# TRD — VQ Grocery

## 1. Architecture (production target)

```
┌──────────────┐      HTTPS       ┌─────────────────────────┐
│  Static SPA  │ ───────────────▶ │   Cloudflare Pages      │
│ (Pages site) │                  │   (CDN, free)           │
└──────┬───────┘                  └────────────┬────────────┘
       │ JWT (Supabase Auth)                   │
       ▼                                       ▼
┌──────────────────────────────────────────────────────────┐
│              Cloudflare Workers (API layer)              │
│  /api/products  /api/cart  /api/orders  /api/checkout    │
│  /api/webhooks/razorpay   /api/admin/*  /api/support/*   │
│  - validates input, enforces RBAC, rate limits (Redis)  │
│  - service-role key to Supabase (never exposed to client)│
└──────┬───────────────┬───────────────────┬───────────────┘
       │               │                   │
       ▼               ▼                   ▼
┌─────────────┐ ┌─────────────┐    ┌──────────────────┐
│  Supabase   │ │  Upstash    │    │  Razorpay        │
│  Postgres   │ │  Redis      │    │  (test → live)   │
│  + Auth     │ │  sessions,  │    │  UPI/cards       │
│  + Realtime │ │  rate-limit,│    │  webhooks→Worker │
│  + Storage  │ │  idempotency│    │                  │
│  (product   │ │  keys,      │    └──────────────────┘
│   images)   │ │  queues     │
└─────────────┘ └─────────────┘
```

**Stack decision:** Cloudflare Pages + Workers for API (100k req/day free), Supabase Postgres with RLS on every table, Supabase Auth, Upstash Redis, Supabase Storage for product images (R2 optional later), Razorpay test mode → live after KYC. Realtime order status via Supabase Realtime channels scoped per order.

## 2. Data model (ERD)

```
stores            products              orders
------            --------              ------
id (uuid pk)      id (uuid pk)           id (uuid pk)
owner_id → auth   store_id → stores      store_id → stores
name              name                   user_id → auth
slug (unique)     price_cents (int!)     status (enum)
commission_pct    mrp_cents              subtotal_cents
is_active         stock_qty              delivery_fee_cents
created_at        image_url              total_cents
                  is_active              payment_id → payments
                  created_at             idempotency_key (unique)
                                         created_at

order_items       payments              support_tickets
-----------       --------              ---------------
id (uuid pk)      id (uuid pk)           id (uuid pk)
order_id → orders order_id → orders      order_id → orders (nullable)
product_id        razorpay_order_id      user_id → auth
qty               amount_cents           status / priority
unit_price_cents  method (upi/card/cod)  notes
                  status                 created_by → auth
                                          created_at

audit_log
---------
id, actor_id → auth, action, entity, entity_id, meta jsonb, created_at
```

**Rules:** money as integer paise (`*_cents`), never floats. Prices are read from the `products` table at checkout — the client total is display-only. `idempotency_key` unique per checkout attempt (double-submit safe).

**RLS sketch:** `products`/`stores` public read (active only); write limited to store owner (`owner_id = auth.uid()`). `orders` readable by owning user, owning store, support (via ticket), admin. `payments` readable only via server role + owner. `audit_log` insert by server, read by admin only.

## 3. API contracts

| Endpoint | Method | Auth | Rate limit | Notes |
|---|---|---|---|---|
| `/api/stores/:slug/products` | GET | none | 100/min/IP | public catalog, paginated |
| `/api/cart` | GET/POST/PUT | user JWT | 60/min/user | server-side cart; merges guest cookie on login |
| `/api/checkout` | POST | user JWT | 10/min/user | creates order + Razorpay order; **idempotency-key header required** |
| `/api/webhooks/razorpay` | POST | Razorpay signature | 60/min/IP | verifies signature; amounts from server; updates `payments` + order status |
| `/api/orders/:id` | GET | user JWT (owner) | 60/min/user | ownership check = no IDOR |
| `/api/partner/orders` | GET | partner JWT | 60/min/user | only own store's orders |
| `/api/partner/orders/:id/status` | PATCH | partner JWT | 30/min/user | status transitions validated (can't skip to delivered) |
| `/api/partner/products` | CRUD | partner JWT | 60/min/user | RLS: `store.owner_id = auth.uid()` |
| `/api/support/orders/lookup` | GET | support JWT | 30/min/user | masked PII; ticket-linked |
| `/api/support/refunds` | POST | support JWT | 10/min/user | ≤ ₹500 auto; above → admin approval queue |
| `/api/admin/stores` | CRUD | admin JWT | 30/min/user | all actions → `audit_log` |
| `/api/admin/payouts` | POST | admin JWT | 10/min/user | weekly partner payouts; idempotent |

**Error contract:** `{ "error": { "code": "ORDER_NOT_FOUND", "message": "Order not found" } }` — no stack traces, no "user exists" on auth endpoints.

## 4. Redis usage plan (Upstash)

| Key pattern | Purpose | TTL |
|---|---|---|
| `rl:{ip}:{endpoint}` | rate-limit counters (sliding window) | 60s |
| `rl:user:{uid}:checkout` | checkout throttle | 60s |
| `idem:{key}` | idempotency keys → order id | 24h |
| `sess:{uid}` | session metadata cache | 15min |
| `queue:notify` | notification queue (order confirmations, SMS) | — |
| `queue:webhook:retry` | failed webhook retries with backoff | — |
| `stock:reserve:{product}` | short-lived stock reservation during checkout | 10min |
| `leaderboard:stores` | top-store counters for admin dashboard | 5min |

Graceful degradation: if Redis is down, checkout falls back to DB-level idempotency (unique constraint) and in-memory per-instance throttling — slower, not dead.

## 5. Scaling plan

- **10x (1k → 10k users):** free tiers absorb it. Add DB indexes on `orders(user_id, created_at)`, `products(store_id)`. Enable Cloudflare cache on catalog GETs.
- **100x (→ 1M users):** move Workers to paid if >100k req/day; Supabase Pro ($25/mo) for connection pooling + bigger DB; Upstash pay-as-you-go; product images on R2; read replica via Supabase read-replicas or cached catalog in Redis.

## 6. Cost estimate (free-tier-only until revenue)

| Users | Infra | Est. cost |
|---|---|---|
| 1k MAU | Pages + Workers free, Supabase free (500MB DB, 50k MAU), Upstash free (10k cmds/day), Razorpay test | **₹0/mo** |
| 100k MAU | Same; likely still inside free tiers; Upstash may need $10/mo if commands exceed; Supabase free covers 50k MAU — MAU is monthly actives, 100k users ≠ 100k MAU | **₹0–800/mo** |
| 1M users | Supabase Pro $25/mo + overages, Workers paid (~$5+/mo), Upstash PAYG (~$10–30/mo), R2 pennies | **~₹3,500–6,000/mo** |

Cost guardrails: alert at 70% of free-tier quotas; per-store product-image cap 50MB; catalog API cached at edge.

**Revenue check at scale:** at 1M users / 100k orders/mo × ₹400 AOV × 6% commission ≈ ₹24L/mo gross — infra cost is <0.3% of that.
