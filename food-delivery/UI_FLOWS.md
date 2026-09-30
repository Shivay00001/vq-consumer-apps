# UI Flows — VQ Food

**Production target.** Prototype today: User panel only (restaurant list → menu → cart → mock checkout → simulated tracking).

## Screen map

```
User                      Restaurant partner        Rider app              Support / Admin
────                      ──────────────────        ─────────              ───────────────
/ (restaurants)           /partner/login            /rider/login           /support/login
  → filters (cuisine,       /partner/dashboard        /rider/home            /support/tickets
    area, rating, veg)        → incoming orders         → go online/offline    /support/orders/lookup
/r/:slug (menu)                → accept/reject         → delivery offers      /support/refunds
  → veg-only toggle            → prep-time set           → accept → navigate  /admin/login
  → item → add               /partner/menu               → picked/delivered   /admin/dashboard
/cart (single-restaurant)      → availability toggle   /rider/earnings        /admin/restaurants
/checkout                    /partner/earnings                                /admin/riders
  → address                    → payout history                               /admin/analytics
  → UPI / COD                /partner/reviews                               /admin/audit-log
  → place order              /partner/settings
/order/:id (live tracking)     → hours, offers
  Confirmed → Preparing
  → Rider assigned → On the way → Delivered
  → live rider map (consent-gated)
/orders (history) → rate
/account
```

## Click-paths

### User: order dinner
1. `/` → filter "North Indian" → restaurant card (rating, time, fee) → `/r/spice-symphony` → veg toggle → add items.
2. Cart drawer → **Checkout** (`/checkout`) → address → **UPI** → Razorpay sheet → success → `/order/:id`.
3. Tracking: status timeline + map with rider pin (only after rider accepts; consent banner "rider shares live location for this delivery").
4. Delivered → **Rate food / delivery** (1–5 stars).
5. **Empty states:** no restaurants in area → "We're not here yet — notify me" (email capture). Cart empty → back to menu. **Errors:** payment fails → retry/COD, no order created. Restaurant rejects → instant refund trigger + "try similar" suggestions. Rider not found in 10 min → support auto-ticket + option to cancel with full refund.

### Restaurant: lunch rush
1. `/partner/login` → dashboard → **🔔 New order** (sound + Realtime) → order detail → **Accept** (+ prep-time picker 15/20/30 min) or **Reject** (reason).
2. Accept → dispatch assigns rider → status auto-advances; kitchen marks **Ready for pickup**.
3. 86 an item mid-rush: `/partner/menu` → toggle off → instant storefront update.
4. **Error:** double-accept by two staff → idempotent (second tap is no-op, "already accepted by <name>").

### Rider: delivery run
1. `/rider/login` → **Go online** → offers arrive with payout shown → **Accept** → pickup address → **Picked up** → navigate → **Delivered** (+ COD cash collected field if applicable).
2. GPS pings only while on an active delivery; toggling offline stops all location sharing.
3. **Error:** customer unreachable → "contact / wait 5 min / mark failed" flow → support ticket auto-created.

### Support: late-order complaint
1. Ticket → order lookup (masked phone/address) → sees: restaurant accepted at 12:04, rider assigned 12:09, GPS stale 10 min.
2. Actions: **reassign rider**, **issue credit** (≤₹500), **call restaurant** (masked number relay).
3. **Empty:** queue clear → "All caught up". **Error:** refund already issued → blocked with timestamp.

### Admin: onboard restaurant
1. `/admin/restaurants` → application → FSSAI/GST checklist → **Approve** (commission %, zone) → credentials sent to owner.
2. `/admin/analytics`: GMV, orders, avg commission take, refund rate, rider utilisation.

## RBAC matrix (deny-by-default; RLS + API middleware)

| Capability | User | Restaurant | Rider | Support | Admin |
|---|---|---|---|---|---|
| Browse restaurants/menus | ✅ | ✅ | ✅ | ✅ | ✅ |
| Own orders / payments | ✅ (own) | — | — | — | — |
| Own restaurant's orders/menu/earnings | — | ✅ (own) | — | — | — |
| See other restaurants' data | — | ❌ | — | — | ✅ |
| Delivery offers / active delivery (+GPS of own run) | — | — | ✅ (own) | — | — |
| Customer live location | — | — | ❌ (only drop pin) | ❌ | ❌ |
| Order lookup (masked PII) | — | — | — | ✅ | ✅ |
| Refund ≤ ₹500 | — | — | — | ✅ | ✅ |
| Refund > ₹500 / commission change / onboarding | — | — | — | ❌ | ✅ |
| Raw PII export | — | — | — | ❌ | ✅ (audit-logged) |
| Rider GPS history | — | ❌ | ✅ (own) | ❌ | ✅ (audit-logged) |

Prototype gap: no auth, no panels; tracking is a timer animation with a fictional rider — must be replaced, never "upgraded" into fake live data.
