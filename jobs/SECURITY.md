# Security Review — VQ Jobs

Framework section-4 checklist. Jobs is the most backend-real of the four apps (`schema.sql` + RLS live), so several items are genuinely PASS today — marked honestly.

## Checklist

| # | Item | Current | Production target | Notes |
|---|---|---|---|---|
| 1 | Auth: no IDOR | ⚠️ **partial** | planned | RLS enabled on all tables ✅. But: open INSERT MVP policies mean anyone can write; `applications` has no SELECT policy (reads return zero — deliberate, documented). Employer-scoped read needs `owner_id` (commented policy in `schema.sql`, not yet applied). |
| 2 | JWT expiry + refresh rotation | ❌ **FAIL** | planned | No Auth wired yet — `supabase-config.js` has placeholders; app works anon. Target: Supabase Auth. |
| 3 | OAuth state validated | N/A | planned | If Google login added, use Supabase's flow. |
| 4 | Password rules + breach-list check | N/A | planned | Supabase Auth. |
| 5 | Rate limiting (auth, OTP, paid endpoints) | ❌ **FAIL** | planned | No throttling: anyone can spam job posts or applications today. Target: Redis counters (5 applies/hour, 10 posts/day). |
| 6 | Server-side input validation | ⚠️ partial | planned | `schema.sql` has CHECK constraints (type enum, email `%@%`) ✅ — but no length limits on description/cover_note, and no server beyond Postgres. App form validation is client-side only. |
| 7 | Parameterized queries / RLS | ✅ **PASS** | must hold | RLS on every table; PostgREST parameterizes. Keep service-role key out of the client. |
| 8 | XSS escaped | ⚠️ partial | planned | Job descriptions are employer-supplied HTML-risk: render as text or sanitize (DOMPurify) before any rich text. |
| 9 | CSRF tokens on cookie auth | N/A | planned | Bearer JWT → N/A. |
| 10 | File uploads | ⚠️ partial | planned | Today: `resume_link` is a free-text URL (phishing vector — "resume" linking to malware). Target: Storage uploads, PDF/DOC ≤5MB, private bucket + signed URLs. |
| 11 | Secrets in env only | ✅ **PASS** | must hold | Only placeholders in repo ✅. Anon key is safe client-side by design; never commit service-role key. |
| 12 | Payment webhooks | N/A | N/A (v1) | No payments in v1. Razorpay only when Featured listings launch. |
| 13 | Audit log (admin/support); PII access logged | ❌ **FAIL** | planned | No panels yet. Target: `audit_log` table; log every application-view by employer? (No — too noisy; log support/admin lookups + moderation actions.) |
| 14 | Error messages leak nothing | ✅ **PASS** | must hold | PostgREST errors are generic; keep "already applied" messaging from enumerating (it's fine — applying is public by design). |
| 15 | Backups tested; RPO/RTO | ⚠️ partial | planned | Supabase free includes daily backups; **restore drill not done**. Target: drill before launch; RPO 24h / RTO 4h. |
| 16 | Dependency scan | ✅ **PASS** | must hold | Only `@supabase/supabase-js` CDN; pin version, check advisories. |

## Top 3 security gaps (current → production)

1. **Open INSERT on all three tables (MVP).** Documented and deliberate, but it means anyone can flood `jobs` with spam or `applications` with junk right now in live mode. Production gate: Auth + moderation queue + rate limits before promoting the live URL anywhere.
2. **No employer identity → no applicant privacy.** Without `owner_id`, the employer-scoped `applications` SELECT policy can't exist; today reads return zero rows (safe but useless), and the moment a permissive policy is added without ownership, applicant PII leaks across employers. Apply the `schema.sql` commented migration as one atomic change.
3. **`resume_link` free-text URL.** An attacker posts a job, harvests applicant clicks to a malicious "resume" link — or an applicant's link phishes the employer. Replace with Storage uploads (private bucket, signed URLs, MIME allowlist) before real hiring volume.

## Sign-off

- [ ] MVP policies acknowledged as launch-blockers (this doc)
- [ ] `owner_id` + moderation migration applied and RLS re-tested
- [ ] Rate limits live on apply/post endpoints
- [ ] Restore drill done; RPO/RTO written
- [ ] Load & break test notes filed (apply spam, double-apply, 10MB resume, concurrent moderation)
