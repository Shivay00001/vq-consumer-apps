# PRD — VQ Grocery

**Status: planning doc for production target.** Current build is a prototype (demo catalog, mock checkout — see README "What's real vs prototype"). This PRD describes the **production target**, not the prototype.

## 1. Problem

Small neighbourhood grocers (kirana stores) in India lose customers to quick-commerce giants (Blinkit, Zepto, Instamart) because they have no online storefront. Existing quick-commerce platforms charge sellers steep onboarding fees (Blinkit: ₹25,000/SKU/state reported) and 10–20% commissions plus ad spend. A small store cannot afford that. Meanwhile customers want a simple "order from my local store" experience with delivery in hours, not 10 minutes.

**VQ Grocery** is a lightweight, low-cost storefront platform: each store gets its own branded shop, customers order online, store owners manage inventory/orders from a partner panel, and the platform takes a small, transparent cut.

## 2. Users (per panel)

| Panel | Who | Core needs |
|---|---|---|
| **User (end customer)** | Households near a partner store | Browse catalog, search/filter, cart, checkout (UPI/COD), order tracking, order history, re-order |
| **Partner (store owner)** | Kirana store / small grocer | Product catalog CRUD, inventory counts, order intake (accept/reject), delivery slot management, payouts/earnings, offers |
| **Customer Support** | VQ support staff | Look up orders by ID/phone, issue refunds/credits within limits, resend notifications, flag fraud |
| **Admin (platform owner)** | Shivay / VisionQuantech | Onboard stores, set commission, platform analytics (GMV, orders, AOV), user/vendor management, audit log |

## 3. User stories

**User**
- As a customer, I can browse products by category and search by name, so I find what I need in under a minute.
- As a customer, I can add items to a persistent cart (works across devices after login).
- As a customer, I can check out with UPI or Cash on Delivery and get an order ID immediately.
- As a customer, I can see my order move through Confirmed → Packed → Out for delivery → Delivered.
- As a customer, I can reorder a previous basket in one tap.

**Partner**
- As a store owner, I can add/edit products with price, MRP, stock count, and a photo.
- As a store owner, I get a real-time notification for each new order and can accept/reject within 5 minutes.
- As a store owner, I can mark orders packed / out-for-delivery / delivered.
- As a store owner, I can see my earnings after platform commission and request weekly payout.

**Support**
- As a support agent, I can search an order by ID or customer phone and see full status/payment state.
- As a support agent, I can issue a refund or store credit up to ₹500 per ticket without admin approval; above that needs admin.
- As a support agent, I cannot see full customer addresses or payment details — only masked values (limited PII).

**Admin**
- As admin, I can approve/reject new store applications and set per-store commission.
- As admin, I can view GMV, order counts, and top stores on a dashboard.
- As admin, every destructive or financial action I take is written to an audit log.

## 4. Success metrics

- Order success rate (checkout started → order confirmed): **> 70%**
- Store acceptance latency (order placed → accepted): **< 5 min median**
- Repeat purchase rate (2nd order within 30 days): **> 35%**
- Refund rate: **< 3%** of orders
- Prototype validation: demo → first real store live within 30 days of Phase-2 start

## 5. Non-goals (production v1)

- No 10-minute delivery promise; slots are same-day / next-day (stores fulfil themselves).
- No dark-store / own inventory; inventory belongs to partner stores.
- No multi-city logistics network; launch is one city, store-by-store.
- No perishables cold-chain guarantees beyond what the store already does.

## 6. Monetization

| Stream | Model | Notes |
|---|---|---|
| Commission | 5–8% per order to partner store (vs 10–20% + ads on incumbents) | Deliberately undercuts Blinkit/Zepto seller take |
| Ads | AdSense slots already placed in listing page (prototype has 2 placeholders) | Enable after real traffic |
| VQ Grocery Pro (store) | ₹299/mo: analytics, offers engine, priority support | Phase 2+ |
| Delivery fee | ₹0–29 to customer depending on order value (free above ₹199) | Store keeps 100% of delivery fee |

## 7. Prototype → production mapping

| Prototype (today) | Production target |
|---|---|
| `data.js` demo catalog (26 fictional items) | `products` table in Supabase, per-store, RLS-scoped |
| localStorage cart | Server cart (or guest cookie cart merged on login) |
| Mock checkout (COD/UPI-mock) | Razorpay UPI + COD; orders written server-side; prices from server, never client |
| "Simulate progress" timeline | Supabase Realtime order-status updates driven by partner panel |
| Random order IDs, no backend record | UUID order IDs in Postgres with idempotency keys in Redis |
