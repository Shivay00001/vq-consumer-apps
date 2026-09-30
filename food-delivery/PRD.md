# PRD — VQ Food (Food Delivery)

**Status: planning doc for production target.** Current build is a prototype (demo restaurants/menus, mock checkout, simulated tracking — see README "What's real vs prototype"). This PRD describes the **production target**.

## 1. Problem

Small independent restaurants pay 15–30% commission to Zomato/Swiggy plus ad spend, and lose nearly half the order value to deductions (reported by restaurant owners, Mint 2025). New cloud kitchens get discovery but bleed margin. Customers, meanwhile, want reliable delivery from restaurants they already trust.

**VQ Food** is a lower-take-rate food delivery platform: restaurants get a partner app with full order control, customers get real-time tracking, and the platform commission is capped well below incumbents — with a "direct channel" playbook (restaurants re-route repeat customers to lower-fee ordering).

## 2. Users (per panel)

| Panel | Who | Core needs |
|---|---|---|
| **User (end customer)** | Local food orderers | Browse restaurants, menus, veg filter, cart (single-restaurant), checkout (UPI/COD), live rider tracking, ratings |
| **Partner (restaurant)** | Restaurant owner / manager | Menu CRUD, availability toggles, order accept/reject, prep-time updates, earnings, payout schedule, offers |
| **Partner (rider)** | Delivery partner | Accept deliveries, GPS-tracked en route status, earnings per delivery, availability toggle |
| **Customer Support** | VQ support staff | Ticket queue, order lookup (masked PII), refunds/credits within limits, rider issue escalation |
| **Admin (platform owner)** | Shivay / VisionQuantech | Restaurant onboarding/KYC, commission config, city analytics, audit log, payout runs |

## 3. User stories

**User**
- As a customer, I can find restaurants by cuisine/area, see ratings and delivery time, so I can decide in under 2 minutes.
- As a customer, I can build a single-restaurant cart (prototype already enforces this) and check out with UPI or COD.
- As a customer, I can watch my order move: Confirmed → Preparing → Rider assigned → On the way → Delivered, with the rider's live position on a map.
- As a customer, I can rate the restaurant and the delivery after the order.

**Restaurant partner**
- As a restaurant, I get an instant alert on a new order and can accept/reject with one tap; rejection needs a reason.
- As a restaurant, I can toggle item availability (86'd items) so customers never order what the kitchen can't make.
- As a restaurant, I can set prep time per order, which feeds the customer's ETA.
- As a restaurant, I see earnings net of the platform's capped commission.

**Rider**
- As a rider, I can go online/offline and receive delivery offers with pickup/drop details and payout shown upfront.
- As a rider, my GPS position (with consent) updates the customer's tracking map.
- As a rider, I can mark picked-up / delivered; COD cash collected is reconciled in the app.

**Support**
- As a support agent, I can look up any order by ID/phone, see payment + rider state, with PII masked.
- As a support agent, I can issue refunds/credits up to ₹500; escalate above that.
- As a support agent, I can reassign a stuck order to another rider.

**Admin**
- As admin, I onboard restaurants (FSSAI/GST verification checklist), set per-restaurant commission.
- As admin, I see city-level GMV, order volume, rider utilisation, refund rate.
- As admin, every financial action is audit-logged.

## 4. Success metrics

- Order acceptance rate: **> 92%**
- On-time delivery (within promised window): **> 90%**
- Refund rate: **< 4%**
- Restaurant NPS / retention at 90 days: **> 60% still active**
- Avg. commission take vs incumbents: **documented ≤ 12% all-in** (vs 15–30% reported)

## 5. Non-goals (production v1)

- No 10-minute delivery; honest 25–50 min windows per restaurant.
- No own cloud-kitchen network; partner restaurants only.
- No intercity; launch is one city / a few zones.
- No dine-in table booking (separate product if ever).

## 6. Monetization

| Stream | Model | Notes |
|---|---|---|
| Commission | **Capped at 12% all-in** per order (vs 16–30% incumbents; Flipkart's reported entry cap is 15–20%) | The headline differentiator |
| Ads | AdSense slots already placed on listing page (2 placeholders in prototype) | Post-traffic |
| Restaurant Pro | ₹499/mo: promoted placement, analytics, offer engine | Phase 2+ |
| Delivery fee | ₹15–39 by distance (prototype demo values) to customer; rider keeps base payout | Transparent split shown to restaurant |

## 7. Prototype → production mapping

| Prototype (today) | Production target |
|---|---|
| `data.js` 6 fictional restaurants/menus | `restaurants` + `menu_items` tables, per-restaurant RLS |
| Single-restaurant cart (localStorage) | Server cart; single-restaurant rule enforced server-side |
| Mock checkout | Razorpay UPI + COD; server-side totals; idempotency keys |
| Simulated tracking animation (timer) | Real state machine driven by restaurant + rider apps; rider GPS via Supabase Realtime (consent-gated) |
| Fictional rider names | Real rider accounts with KYC-lite onboarding |
