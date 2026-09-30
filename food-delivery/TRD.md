# TRD — VQ Food

## 1. Architecture (production target)

```
Customer SPA ─┐
Restaurant    ├─▶ Cloudflare Pages (CDN, free)
Partner App ──┘
       │ JWT (Supabase Auth, roles: customer/restaurant/rider/support/admin)
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Cloudflare Workers (API + dispatch brain)                   │
│  /api/restaurants /api/menus /api/cart /api/checkout          │
│  /api/orders/* /api/rider/* /api/dispatch/assign              │
│  /api/webhooks/razorpay                                      │
│  /api/partner/* (restaurant) /api/support/* /api/admin/*      │
│  - RBAC middleware (role from JWT claims)                    │
│  - rate limits via Upstash Redis                             │
│  - service-role Supabase access; realtime fan-out            │
└──┬────────────┬──────────────┬───────────────────────────────┘
   ▼            ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐
│Supabase │ │ Upstash  │ │ Razorpay     │
│Postgres │ │ Redis    │ │ test → live  │
│+ Auth   │ │ geo/dispatch│ │ UPI/cards   │
│+ Realtime│ │ rate-limit │ │ webhooks    │
│+ Storage│ │ idempotency│ │ signature-  │
│(menu    │ │ queues    │ │ verified    │
│ photos) │ │          │ │             │
└─────────┘ └──────────┘ └──────────────┘
```

**Stack decision:** Cloudflare Pages (3 SPAs or one SPA with role routes) + Workers API; Supabase Postgres + Auth + Realtime (order status, rider GPS channel per order); Upstash Redis for dispatch queue + geo + rate limits; Razorpay test mode; Supabase Storage for menu photos.

## 2. Data model (ERD)

```
restaurants            menu_items             orders
-----------            ----------             ------
id (uuid pk)           id (uuid pk)            id (uuid pk)
owner_id → auth        restaurant_id → rest.   restaurant_id → restaurants
name / slug unique     name                    user_id → auth
area / city / geo      price_cents (int)       rider_id → riders (nullable)
cuisines[]             veg bool                status (enum)
rating_cached          is_available            subtotal/delivery_fee/total_cents
delivery_fee_cents     photo_url               payment_id → payments
min_order_cents        created_at              idempotency_key unique
commission_pct         ──                      eta_at / delivered_at
is_active                                       created_at
created_at
                       riders                  order_items
                       ------                  -----------
                       id (uuid pk)            id → orders
                       user_id → auth unique   menu_item_id
                       name / phone            qty / unit_price_cents
                       vehicle                 ──
                       is_online / geo (postgis point)
                       kyc_status              payments (like grocery TRD)
                       created_at

ratings                support_tickets / audit_log (like grocery TRD)
-------
id, order_id unique, restaurant_id, rider_id, food_stars, delivery_stars, note
```

**Rules:** paise integers; menu prices server-read at checkout; single-restaurant cart enforced by DB check (`order_items` must share one `restaurant_id`); status transitions validated in a DB function (can't jump `placed → delivered`).

**RLS sketch:** restaurants/menu_items public read (active); restaurant owner writes own rows; orders visible to customer, restaurant, assigned rider (rider sees only active deliveries), support masked, admin all; rider `geo` writable by rider, readable only by parties to the active order (Realtime channel auth).

## 3. API contracts

| Endpoint | Method | Auth | Rate limit | Notes |
|---|---|---|---|---|
| `/api/restaurants?area=&cuisine=` | GET | none | 100/min/IP | paginated, cached at edge |
| `/api/restaurants/:id/menu` | GET | none | 100/min/IP | only `is_available` items |
| `/api/cart` | POST/PUT | customer JWT | 60/min/user | single-restaurant enforced |
| `/api/checkout` | POST | customer JWT | 10/min/user | idempotency key required; creates Razorpay order |
| `/api/webhooks/razorpay` | POST | Razorpay sig | 60/min/IP | signature verify; server amounts |
| `/api/orders/:id` | GET | party JWT | 60/min/user | customer / restaurant / assigned rider only |
| `/api/partner/orders` | GET | restaurant JWT | 60/min/user | own restaurant only |
| `/api/partner/orders/:id/accept` `/reject` | POST | restaurant JWT | 30/min/user | triggers dispatch queue |
| `/api/partner/menu` | CRUD | restaurant JWT | 60/min/user | availability toggles |
| `/api/dispatch/assign` | POST | service/internal | — | Worker cron/queue: nearest online rider |
| `/api/rider/offers` | GET | rider JWT | 30/min/user | only offers to that rider |
| `/api/rider/location` | POST | rider JWT | 1/5s/rider | GPS ping → Realtime channel (consent flag) |
| `/api/rider/orders/:id/status` | PATCH | rider JWT | 30/min/user | picked_up / delivered; COD amount recorded |
| `/api/support/orders/lookup` | GET | support JWT | 30/min/user | masked PII |
| `/api/support/refunds` | POST | support JWT | 10/min/user | ≤₹500 auto |
| `/api/admin/*` | * | admin JWT | 30/min/user | audit-logged |

## 4. Redis usage plan (Upstash)

| Key pattern | Purpose | TTL |
|---|---|---|
| `rl:*` | rate-limit counters per endpoint/IP/user | 60s |
| `idem:{key}` | checkout idempotency → order id | 24h |
| `queue:dispatch` | pending deliveries awaiting rider assignment | — |
| `rider:online` (geo set) | online riders by zone for assignment | 2min heartbeat |
| `order:{id}:rider` | assigned rider + offer expiry | 10min |
| `queue:notify` | SMS/push notifications | — |
| `menu:cache:{rest}` | menu JSON cache (invalidated on partner edit) | 5min |
| `eta:{order}` | cached ETA computation | 2min |

**Dispatch (v1, simple):** on restaurant accept → push to `queue:dispatch` → Worker pops, picks nearest `rider:online` in zone, creates offer with 60s expiry, retries 3 riders, then escalates to support. No ML routing at launch.

**Graceful degradation:** Redis down → dispatch falls back to DB polling (slower); checkout still safe via DB unique idempotency key.

## 5. Scaling plan

- **10x:** free tiers hold. Indexes on `orders(restaurant_id, status)`, `menu_items(restaurant_id)`. Edge-cache restaurant/menu GETs.
- **100x:** Supabase Pro for connection pooling; Upstash PAYG; rider GPS via Realtime scales to ~hundreds concurrent channels free, then Supabase Pro. Move dispatch to a dedicated Worker + queue (Cloudflare Queues free tier 1M ops/mo).

## 6. Cost estimate (free-tier-only until revenue)

| Users | Infra | Est. cost |
|---|---|---|
| 1k MAU | Pages + Workers free, Supabase free, Upstash free, Razorpay test | **₹0/mo** |
| 100k MAU | Still largely free; Upstash possibly $10/mo at high GPS ping volume (throttle to 1/10s) | **₹0–800/mo** |
| 1M users | Supabase Pro $25 + Realtime overages, Workers paid, Upstash PAYG | **~₹4,000–7,000/mo** |

Revenue check: 1M users, 200k orders/mo × ₹350 AOV × 10% avg commission ≈ ₹70L/mo gross — infra <0.15%.
