# UI Flows — VQ Grocery

Screen map + click-paths for all four panels. **Production target** — the prototype today has only the User panel (shop/cart/checkout/tracking).

## Screen map

```
Public/User panel            Partner panel              Support panel            Admin panel
─────────────────            ─────────────              ─────────────            ───────────
/ (storefront home)          /partner/login             /support/login           /admin/login
  → category filter            /partner/dashboard         /support/tickets         /admin/dashboard
  → search                     /partner/orders            /support/tickets/:id     /admin/stores
  → product card                 → order detail             /support/orders/lookup   /admin/stores/:id
/cart                            → accept/reject          /support/refunds         /admin/users
/checkout                        → status update          /support/audit           /admin/payouts
  → UPI / COD                  /partner/products        (masked PII)             /admin/analytics
  → order confirm                → add/edit product                                 /admin/audit-log
/orders                            → stock update
/orders/:id (tracking)         /partner/earnings
  Confirmed→Packed→             → payout history
  Out→Delivered               /partner/settings
/account                        → hours, delivery zones
  → addresses
  → order history → reorder
```

## Click-paths

### User: first order
1. `/` → picks store (or geo-default) → browses category → taps product card → **Add** (qty stepper).
2. Cart badge → `/cart` → qty edit / remove → **Checkout**.
3. `/checkout` → address (saved or new) → slot picker → payment: **UPI** (Razorpay sheet) or **COD** → **Place order**.
4. Confirmation screen: order ID, ETA slot, **Track order** → `/orders/:id` timeline (Realtime updates).
5. **Empty state:** cart empty → illustration + "Browse products" CTA. **Error:** payment fails → "Payment failed — try again or choose COD", order NOT created (idempotent retry safe). Store closed → banner "Store opens 8 AM", checkout disabled.

### Partner: fulfil an order
1. `/partner/login` (Supabase Auth, store-owner role) → `/partner/dashboard` → new-order push/Supabase Realtime ping.
2. `/partner/orders` → order detail: items, customer name (masked phone), address, payment state → **Accept** (5-min SLA timer) or **Reject** (reason required).
3. Accept → **Mark packed** → **Out for delivery** → **Delivered** (each step timestamped).
4. **Empty state:** no orders → "No orders yet — share your store link". **Error:** stock changed mid-order → partner sees conflict prompt, can partially fulfil with customer auto-notify + refund for missing items.

### Partner: manage catalog
1. `/partner/products` → **Add product** → name, price, MRP, stock, photo upload (Storage, ≤2MB, image types only) → **Save**.
2. Stock hits 0 → product auto-hidden from storefront; low-stock badge at ≤5.
3. **Error:** image too large/wrong type → inline error, upload rejected server-side.

### Support: refund ticket
1. `/support/login` → `/support/tickets` → open ticket → **Look up order** (ID or phone).
2. Order view: status, items, payment state; PII masked (phone ••••1234, address truncated).
3. **Issue refund/credit** → amount ≤ ₹500 → instant; > ₹500 → routed to admin queue with reason.
4. Every action writes to audit log, linked to ticket ID.
5. **Empty state:** no open tickets → "All caught up". **Error:** order already refunded → blocked with "Refund already processed on <date>".

### Admin: onboard a store
1. `/admin/login` → `/admin/stores` → pending applications → review docs → **Approve** (sets commission %) / **Reject** (reason).
2. `/admin/analytics`: GMV, orders, AOV, top stores, refund rate.
3. `/admin/payouts`: weekly payout run → confirm → idempotent payout records per store.
4. `/admin/audit-log`: filter by actor/action/date. Admin sessions expire after 30 min idle.

## RBAC matrix (deny-by-default; enforced in RLS + API middleware, never frontend-only)

| Capability | User | Partner | Support | Admin |
|---|---|---|---|---|
| Browse public catalog | ✅ | ✅ | ✅ | ✅ |
| Own cart / orders / payments | ✅ (own) | — | — | — |
| Manage own store products/orders/earnings | — | ✅ (own store) | — | — |
| See other stores' data or platform revenue | — | ❌ | — | ✅ |
| Look up any order (masked PII) | — | — | ✅ | ✅ |
| Issue refund ≤ ₹500 | — | — | ✅ | ✅ |
| Issue refund > ₹500 / approve store / change commission | — | — | ❌ | ✅ |
| Export raw PII | — | — | ❌ | ✅ (audit-logged) |
| Schema / settings / API keys | — | — | ❌ | ✅ |

Prototype gap: today there are no logins and no panels at all — only the User storefront flow exists, unauthenticated.
