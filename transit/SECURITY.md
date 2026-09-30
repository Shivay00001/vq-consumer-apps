# Security Review — VQ Transit

Framework section-4 checklist. Transit is a read-only information tool: no auth, no payments, no user data in v1 — so the risk profile is the lowest of the four apps. Marks below are honest for that scope.

## Checklist

| # | Item | Prototype | Production target | Notes |
|---|---|---|---|---|
| 1 | Auth: no IDOR | ✅ **PASS** | ✅ PASS | No per-user objects exist; nothing to be IDOR'd. Admin API (Phase 2) will need ownership checks. |
| 2 | JWT expiry + refresh rotation | N/A | planned (admin only) | Only admin/partner logins need Auth. |
| 3 | OAuth state validated | N/A | N/A | No OAuth planned. |
| 4 | Password rules + breach-list check | N/A | planned (admin only) | Admin accounts: strong passwords + 2FA via Supabase. |
| 5 | Rate limiting | ⚠️ partial | planned | Prototype: none — but it's static files on any host, low abuse value. Production: Redis limits on `/api/live/*` (quota protection) and `/api/corrections` (spam). |
| 6 | Server-side input validation | ⚠️ partial | planned | Search inputs are client-side only today (no server to attack). `/api/corrections` must validate length/content + honeypot. |
| 7 | Parameterized queries / RLS | N/A | planned | No DB in v1. If datasets move to Postgres: RLS, read-only anon. |
| 8 | XSS escaped | ✅ **PASS** | must hold | Static data rendered; keep escaping when real GTFS text (operator names) is ingested — treat feed content as untrusted. |
| 9 | CSRF tokens on cookie auth | N/A | planned if cookies | Bearer JWT preferred for admin. |
| 10 | File uploads | N/A (v1) | planned | Admin dataset uploads: zip/CSV allowlist, ≤50MB, scanned posture, parsed in sandbox/Worker — never executed. |
| 11 | Secrets in env only | ✅ **PASS** | must hold | No secrets today. **Hard rule:** RailRadar/OTD keys live in Worker env only — a key pasted into `data.js` (as the README's Phase-2 sketch might tempt) would be public to every visitor. |
| 12 | Payment webhooks | N/A | N/A | No payments, ever planned. |
| 13 | Audit log | N/A (v1) | planned | Admin dataset/provider actions logged. |
| 14 | Error messages leak nothing | ✅ **PASS** | must hold | Static app; keep it that way — live proxy must not leak upstream error bodies/keys. |
| 15 | Backups tested; RPO/RTO | N/A (v1) | planned | Datasets versioned in Storage/R2 — rollback = reactivate previous version. RPO: dataset refresh cadence; RTO 1h. |
| 16 | Dependency scan | ✅ **PASS** | must hold | Zero dependencies today. |

## Top 3 security gaps (prototype → production)

1. **API-key placement trap (future).** The README's Phase-2 sketch mentions a `LIVE` config in `data.js`. If anyone implements that literally, the RailRadar bearer key ships to every browser. Production rule: key in Worker env, browser only ever calls the Worker's `/api/live/*` proxy. This doc exists so the trap is documented before it's built.
2. **No abuse controls on future write endpoints.** `/api/corrections` (spam) and `/api/live/*` (quota burn: 1,000 req/month free tier) need Redis rate limits from day one of Phase 2, or one scraper burns the month's quota.
3. **Feed content is untrusted input.** Real GTFS/CSV ingestion must treat operator text as hostile: escape on render, validate on import, cap sizes. The prototype's fictional data makes this invisible today.

## What "secure" means for this app

- v1: keep it static, keep it honest, keep keys out of the client. That's 90% of the job.
- The day live data or admin uploads ship, re-run this checklist and the load test (quota-burn simulation, malformed feed upload).

## Sign-off

- [ ] Prototype gaps acknowledged (this doc)
- [ ] Key-in-env rule written into TRD (done)
- [ ] Re-run checklist when Phase 2 (live) or admin uploads ship
