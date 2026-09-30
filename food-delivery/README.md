# VQ Food — Demo Food Delivery (App 2)

Mobile-first food-delivery prototype. Open `index.html` in any browser — no build step, no server, no npm.

## What's real vs prototype

| Part | Status |
|---|---|
| Restaurant list (6), cuisines, ratings, search/filter | ✅ Real UI — **demo data** in `data.js` (fictional restaurants/menus/prices) |
| Per-restaurant menu + veg-only filter | ✅ Real, works over demo data |
| Cart (single-restaurant, quantities, localStorage) | ✅ Real (stored on this device only) |
| Checkout form + COD/UPI-mock choice | ⚠️ **Mock only** — labeled "no real charge" |
| Order tracking timeline | ⚠️ **Demo simulation** — animates through stages on a timer; every label says "simulated / fictional rider / no real delivery" |
| Real restaurants, riders, orders, payments | ❌ Not built — **Phase 2** |

**Honesty rules baked into the UI:** top banner states no real restaurants/riders/payments; the tracking view explicitly says the rider is fictional and nothing was delivered.

## File layout

- `index.html` — views (list, menu, checkout, tracking) + cart drawer
- `styles.css` — mobile-first responsive styles
- `data.js` — demo restaurants + menus + simulated tracking stages
- `app.js` — rendering, cart logic, mock checkout, tracking simulation

## AdSense slots

Two labeled placeholder slots on the restaurant listing (`data-ad="food-listing-top"` / `"food-listing-bottom"`) — HTML comments mark the paste points.

## Phase 2 (to go real)

1. Backend for restaurants, menus, orders, rider assignment
2. Real payment gateway
3. Real-time order tracking via rider GPS (with consent)
4. Restaurant partner onboarding + admin panel

## Production setup (Phase 2)

**What the owner must provide:** (1) free Supabase project (URL + anon key), (2) free Cloudflare account (Pages + Workers), (3) free Upstash Redis (URL + token), (4) Razorpay test keys (live keys only after business KYC).

1. Create Supabase project (ap-south-1), run production schema: `restaurants`, `menu_items`, `riders`, `orders`, `order_items`, `payments`, `ratings`, `support_tickets`, `audit_log` (see TRD.md ERD).
2. Deploy the three SPAs (customer / restaurant partner / rider) to Cloudflare Pages; deploy Workers API with env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`, `RAZORPAY_KEY_ID/SECRET`).
3. Razorpay test keys → verify webhook signature endpoint with a ₹1 test order.
4. Onboard first restaurant manually (FSSAI/GST checklist in UI_FLOWS.md) before opening signup.

## Architecture summary

Static SPAs (Pages) → Workers API + dispatch queue (RBAC middleware, Redis rate limits) → Supabase Postgres (RLS on every table) + Auth + Realtime (order status, rider GPS channels) + Storage (menu photos) → Razorpay (signature-verified webhooks). Full diagram + ERD + API contracts in TRD.md.

## Cost at scale (free-tier-only until revenue)

| 1k users | 100k users | 1M users |
|---|---|---|
| ₹0/mo (all free tiers) | ₹0–800/mo (Upstash may tip over at high GPS ping volume — throttle to 1/10s) | ~₹4,000–7,000/mo |

Alert at 70% of any free-tier quota. Revenue math: 200k orders/mo × ₹350 AOV × 10% avg commission ≈ ₹70L/mo gross — infra <0.15%.

## Rollback steps

1. **Frontend:** Cloudflare Pages one-click rollback to any prior deployment.
2. **Workers API:** `wrangler rollback` or dashboard rollback.
3. **Database:** Supabase PITR / daily backup restore; additive-only migrations.
4. **Kill switches:** `CHECKOUT_ENABLED=false` pauses ordering; `DISPATCH_ENABLED=false` pauses auto rider-assignment (orders queue for manual dispatch).

## Docs map

- [PRD.md](PRD.md) — problem, users, stories, metrics, non-goals, monetization
- [COMPETITORS.md](COMPETITORS.md) — Zomato / Swiggy / Flipkart / ONDC / MagicPin-Thrive: pricing, feature matrix, what to copy/beat
- [TRD.md](TRD.md) — architecture, ERD, API contracts, Redis plan, dispatch design, scaling, cost
- [UI_FLOWS.md](UI_FLOWS.md) — screen maps + click-paths for all four panels (+ rider), RBAC matrix
- [SECURITY.md](SECURITY.md) — framework section-4 checklist, rider location-privacy rules, top gaps, sign-off
