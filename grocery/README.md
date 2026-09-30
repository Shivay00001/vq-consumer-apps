# VQ Grocery — Demo Storefront (App 1)

Mobile-first grocery storefront prototype. Open `index.html` in any browser — no build step, no server, no npm.

## What's real vs prototype

| Part | Status |
|---|---|
| Product catalog (26 items, 6 categories) | ✅ Real UI — **demo data** in `data.js` (fictional products/prices) |
| Category filter + search | ✅ Real, works over demo data |
| Cart with quantities, localStorage persistence | ✅ Real (stored on this device only) |
| Checkout form (name/phone/address, validation) | ✅ Real UI — data goes nowhere |
| COD / UPI-mock payment choice | ⚠️ **Mock only** — explicitly labeled "no real charge" |
| Order confirmation + order ID | ✅ Real UI — ID is randomly generated, no backend record |
| Order-status timeline | ⚠️ **Demo timeline** — "Simulate progress" button advances it; no real fulfillment |
| Real store / inventory / payments / delivery | ❌ Not built — **Phase 2** |

**Honesty rules baked into the UI:** a top banner states this is a demo with no real store/inventory/payment; every demo element (offers, totals, timeline) is labeled demo/mock.

## File layout

- `index.html` — all views (shop, cart, checkout, confirmation) + cart drawer
- `styles.css` — mobile-first responsive styles
- `data.js` — demo catalog (26 products, offers)
- `app.js` — rendering, cart logic, mock checkout

## AdSense slots

Two labeled placeholder slots on the listing page (`data-ad="grocery-listing-top"` and `"grocery-listing-bottom"`) — HTML comments mark the paste points for AdSense ad unit code.

## Phase 2 (to go real)

1. Backend (e.g. Supabase/Firebase) for catalog, inventory, orders
2. Real payment gateway (Razorpay/UPI) replacing the mock
3. Admin panel for the store owner to manage products
4. Real delivery/fulfillment integration

## Production setup (Phase 2)

**What the owner must provide:** (1) free Supabase project (URL + anon key), (2) free Cloudflare account (Pages + Workers), (3) free Upstash Redis (URL + token), (4) Razorpay test keys (live keys only after business KYC).

1. Create Supabase project (region ap-south-1), run the production schema (extends the jobs-style pattern: `stores`, `products`, `orders`, `order_items`, `payments`, `support_tickets`, `audit_log` — see TRD.md ERD).
2. Deploy frontend to Cloudflare Pages; deploy Workers API with env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`, `RAZORPAY_KEY_ID/SECRET`).
3. In Razorpay dashboard: create test API keys → paste → verify webhook signature endpoint.
4. Smoke test: place a ₹1 test order via UPI test mode → confirm webhook → order status flips.

## Architecture summary

Static SPA (Cloudflare Pages) → Cloudflare Workers API (RBAC + rate limits via Upstash Redis) → Supabase Postgres (RLS on every table) + Auth + Realtime (order status) + Storage (product images) → Razorpay (payments, signature-verified webhooks). Full diagram + ERD + API contracts in TRD.md.

## Cost at scale (free-tier-only until revenue)

| 1k users | 100k users | 1M users |
|---|---|---|
| ₹0/mo (all free tiers) | ₹0–800/mo | ~₹3,500–6,000/mo (Supabase Pro $25 + Workers/Upstash overages) |

Alert at 70% of any free-tier quota. Revenue math: 100k orders/mo × ₹400 AOV × 6% commission ≈ ₹24L/mo gross — infra stays <0.3%.

## Rollback steps

1. **Frontend:** Cloudflare Pages keeps every deployment — one-click rollback to any prior deploy in the dashboard.
2. **Workers API:** `wrangler rollback` to previous version (or dashboard rollbacks).
3. **Database:** Supabase point-in-time recovery (Pro) / daily backup restore (free); schema changes ship as additive migrations — never destructive.
4. **Kill switch:** set `CHECKOUT_ENABLED=false` in Worker env to pause new orders instantly without downtime.

## Docs map

- [PRD.md](PRD.md) — problem, users, stories, metrics, non-goals, monetization
- [COMPETITORS.md](COMPETITORS.md) — Blinkit / Zepto / Instamart / BigBasket / JioMart: pricing, feature matrix, what to copy/beat
- [TRD.md](TRD.md) — architecture, ERD, API contracts, Redis plan, scaling, cost
- [UI_FLOWS.md](UI_FLOWS.md) — screen maps + click-paths for all four panels, RBAC matrix
- [SECURITY.md](SECURITY.md) — framework section-4 checklist (PASS/FAIL/N-A), top gaps, sign-off
