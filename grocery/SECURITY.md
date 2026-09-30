# Security Review — VQ Grocery

Framework section-4 checklist, marked per app. **PASS/FAIL/N-A refer to the PRODUCTION TARGET design unless noted; the prototype column is the honest current state.**

## Checklist

| # | Item | Prototype | Production target | Notes |
|---|---|---|---|---|
| 1 | Auth: no IDOR (ownership checks on every object fetch) | ❌ **FAIL** | planned | Prototype has no auth at all; orders exist only as random client-side IDs. Target: user_id checks in RLS + API middleware. |
| 2 | JWT expiry + refresh rotation | N/A | planned | Supabase Auth default (1h access, rotating refresh). |
| 3 | OAuth state validated | N/A | planned | Only if Google OAuth added; use Supabase's built-in flow. |
| 4 | Password rules + breach-list check | N/A | planned | Supabase Auth password + HaveIBeenPwned check on signup. |
| 5 | Rate limiting on auth, OTP, paid endpoints (Redis) | ❌ **FAIL** | planned | Prototype: zero rate limiting (static files). Target: Redis counters per TRD table. |
| 6 | All input validated server-side | ❌ **FAIL** | planned | Prototype: checkout form validated only in browser; a user can submit anything (it goes nowhere today — but this is the #1 thing to fix before any backend). |
| 7 | SQL via parameterized queries / RLS | N/A | planned | No SQL in prototype. Target: RLS on every table + service-role only in Workers. |
| 8 | XSS escaped | ⚠️ partial | planned | Prototype renders demo data via innerHTML in places — must switch to textContent/escaping before user-generated content (store names, reviews) exists. |
| 9 | CSRF tokens on cookie auth | N/A | planned | Using Bearer JWT (not cookies) → CSRF N/A; if cookies adopted later, add tokens. |
| 10 | File uploads: type + size + malware-scan posture | ❌ **FAIL** | planned | No uploads in prototype. Target: image MIME allowlist, ≤2MB, served from separate Storage domain, no executable. |
| 11 | Secrets in env only; never in repo/logs/client | ✅ PASS | must hold | Prototype has no secrets at all (good). Production: Razorpay keys, Supabase service-role key, Upstash token in Worker env only. |
| 12 | Payment webhooks signature-verified; amounts from server | ❌ **FAIL** | planned | Prototype: mock payment, no real charge, no server. Target: Razorpay signature verification; order total recomputed server-side from `products` table — client total ignored. |
| 13 | Audit log for admin/support actions; PII access logged | ❌ **FAIL** | planned | No panels exist yet. Target: `audit_log` table per TRD. |
| 14 | Error messages leak nothing | ⚠️ partial | planned | Prototype: generic messages, but order-ID generation is client-side predictable-ish (Math.random) — must be server UUIDs. |
| 15 | Backups tested (restore drill); RPO/RTO written | ❌ **FAIL** | planned | No data to back up yet. Target: Supabase PITR; RPO 24h / RTO 4h documented at launch. |
| 16 | Dependency scan; no known-critical CVEs | ✅ PASS | must hold | Prototype has zero dependencies (no npm). Production: pin versions, run `npm audit` / Dependabot on the Workers codebase. |

## Top 3 security gaps (prototype → production)

1. **Client-side prices.** `data.js` holds prices in the browser and the mock checkout totals them in JS. In production, checkout must re-price server-side from the DB; the client total is display-only. This is the single most critical fix — a tampered total today would be a revenue hole the moment a backend exists.
2. **No identity / no ownership.** No login means no order attribution, no refund accountability, no partner scoping. Production needs Supabase Auth + RLS before the first real order.
3. **Mock payment with no server record.** Order IDs are random client strings; there is no idempotency, no webhook, no payment state machine. Production needs Razorpay orders + signature-verified webhooks + `payments` table before charging anyone.

## Sign-off

- [ ] Prototype gaps acknowledged (done — this doc)
- [ ] Production checklist re-run before first real store goes live
- [ ] Load & break test notes filed (double-submit, expired session, negative amounts, concurrent stock edits)
