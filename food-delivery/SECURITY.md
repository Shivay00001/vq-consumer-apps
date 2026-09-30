# Security Review — VQ Food

Framework section-4 checklist. **PASS/FAIL/N-A refer to the production target design unless noted; prototype column is honest current state.**

## Checklist

| # | Item | Prototype | Production target | Notes |
|---|---|---|---|---|
| 1 | Auth: no IDOR | ❌ **FAIL** | planned | No auth today. Target: order reads scoped to (customer ∨ restaurant ∨ assigned rider) in RLS + middleware. |
| 2 | JWT expiry + refresh rotation | N/A | planned | Supabase Auth defaults. |
| 3 | OAuth state validated | N/A | planned | If Google login added. |
| 4 | Password rules + breach-list check | N/A | planned | Supabase Auth. |
| 5 | Rate limiting (auth, OTP, paid endpoints) | ❌ **FAIL** | planned | Prototype: none (static files). Target: Redis counters; rider GPS endpoint throttled to 1/5s. |
| 6 | Server-side input validation | ❌ **FAIL** | planned | Checkout validated in browser only; must move server-side. |
| 7 | Parameterized queries / RLS | N/A | planned | RLS on every table; service-role only in Workers. |
| 8 | XSS escaped | ⚠️ partial | planned | `data.js` rendered via innerHTML in places; must escape before restaurant-generated content (names, reviews) exists. |
| 9 | CSRF tokens on cookie auth | N/A | planned | Bearer JWT → N/A. |
| 10 | File uploads (type/size/malware posture) | ❌ **FAIL** | planned | Menu photos: image MIME allowlist, ≤2MB, separate Storage domain. |
| 11 | Secrets in env only | ✅ PASS | must hold | No secrets in prototype. Production: Razorpay, service-role, Upstash in Worker env. |
| 12 | Payment webhooks verified; amounts from server | ❌ **FAIL** | planned | Mock payment today. Target: Razorpay signature verify; totals recomputed from `menu_items`. |
| 13 | Audit log (admin/support); PII access logged | ❌ **FAIL** | planned | No panels yet. Target: `audit_log` table. |
| 14 | Error messages leak nothing | ⚠️ partial | planned | Generic today; must ensure no "restaurant exists" / user enumeration on partner signup. |
| 15 | Backups tested; RPO/RTO written | ❌ **FAIL** | planned | Target: Supabase PITR; RPO 24h / RTO 4h. |
| 16 | Dependency scan; no critical CVEs | ✅ PASS | must hold | Zero-dep prototype; scan the Workers codebase at build. |

## Extra: location-privacy rules (rider GPS)

- Rider location is collected **only** during an active delivery, with explicit in-app consent; pings stop the moment the order completes or the rider goes offline.
- Customer sees rider position **only** for their own live order; no history is exposed to customers.
- Rider GPS history is admin-only, audit-logged, retained 90 days, then purged.
- Restaurant sees "rider en route" status, not the live map (they get arrival, not surveillance).
- Never store or display precise customer home coordinates to riders beyond the drop pin needed for the delivery; addresses masked after delivery completes.

## Top 3 security gaps (prototype → production)

1. **Client-side menu prices + mock payment.** Same critical pattern as grocery: totals computed in JS. Production checkout must re-price from `menu_items` server-side; Razorpay webhooks signature-verified.
2. **No identity across three roles.** Customer/restaurant/rider all unauthenticated today. Without Auth + RLS, anyone could read anyone's orders the moment a backend exists.
3. **Simulated tracking must never become fake live data.** The prototype's timer animation is honestly labeled; production replaces it with real GPS. Hard rule: no synthetic rider positions, ever — a "demo rider" leaking into production tracking is a trust-killer.

## Sign-off

- [ ] Prototype gaps acknowledged (this doc)
- [ ] Location-privacy rules implemented before rider app ships
- [ ] Production checklist re-run before first real restaurant goes live
- [ ] Load & break test notes filed (double order submit, GPS flood, concurrent accept by two staff)
