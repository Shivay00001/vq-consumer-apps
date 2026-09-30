# UI Flows — VQ Jobs

**Production target.** Today: candidate browse/search/apply + employer post-a-job work in demo and live modes (no login, no panels).

## Screen map

```
Candidate                  Employer (partner)           Support                  Admin
─────────                  ──────────────────           ───────                  ─────
/ (job list)               /employer/login              /support/login           /admin/login
  → filters (title,          /employer/dashboard          /support/reports         /admin/moderation
    location, type,            → my listings               → report detail          → approve/reject
    remote)                    → applications per job        → hide listing           → employer verify
/jobs/:id (detail)             → shortlist/reject        /support/users           /admin/analytics
  → apply → /apply           /employer/jobs/new            (masked lookup)          → funnel, spam rate
  → success                    → post-a-job wizard       /support/audit           /admin/users (roles)
/applications                /employer/company                                      /admin/audit-log
  → status tracking            → profile, verification
/alerts (Phase 2)            /employer/billing (Phase 2: Pro/Featured)
/account (profile, resume)
```

## Click-paths

### Candidate: apply in one click
1. `/` → search "python" + Remote → filters → job card → `/jobs/:id`.
2. **Apply** → logged in? No → `/login` (email or Google, 30s) → back to job → profile pre-fills name/email/phone/resume → **Submit application**.
3. Success: "Application sent to <company>" + `/applications` shows status **Received**.
4. Later: status changes to **Shortlisted** → email notification.
5. **Empty states:** no results → "No jobs match — set an alert" (email capture). No applications → "Your applications will appear here". **Errors:** already applied → "You applied on <date>" (duplicate blocked). Resume >5MB → inline error. Listing paused mid-apply → "This job is no longer accepting applications", no write.

### Employer: post a job (production-hardened)
1. `/employer/login` → `/employer/jobs/new` → company (first time) → title, location, type, remote, salary, description → **Submit for review**.
2. "Under review — usually approved within 24h" → admin approves → listing live → **New applicant** Realtime ping.
3. `/employer/dashboard` → job → applicants table → **Shortlist** / **Reject** (+ optional note) → candidate notified.
4. **Empty state:** no applicants → "Share your job link" + tips. **Error:** tries to view another employer's applicants → 403 (RLS + middleware).

### Support: fake-job report
1. Candidate taps **Report** on listing → reason (fake/scam/spam) → ticket.
2. `/support/reports` → evidence → **Hide listing pending review** (reversible) → escalate to admin for employer ban.
3. **Empty:** "No open reports". PII: candidate email masked; employer contact visible for verification only; all lookups logged.

### Admin: moderation queue
1. `/admin/moderation` → pending listings → preview → **Approve** / **Reject** (reason → employer notified).
2. `/admin/analytics`: listings/day, applies/day, spam rate, time-to-first-applicant.
3. `/admin/users`: assign support/admin roles (deny-by-default; admin-only).

## RBAC matrix (deny-by-default; RLS + API middleware)

| Capability | Candidate | Employer | Support | Admin |
|---|---|---|---|---|
| Browse approved jobs | ✅ | ✅ | ✅ | ✅ |
| Apply to jobs | ✅ (own) | — | — | — |
| Own applications / profile / resume | ✅ (own) | — | — | — |
| Post jobs / manage own listings | — | ✅ (own) | — | — |
| View applicants | — | ✅ (own jobs only) | — | — |
| Shortlist/reject applicants | — | ✅ (own jobs) | — | — |
| See other employers' applicants | — | ❌ | — | ✅ |
| Hide listing pending review | — | — | ✅ | ✅ |
| Approve/reject listings, ban employer | — | — | ❌ | ✅ |
| User lookup (masked) | — | — | ✅ | ✅ |
| Raw PII export / role assignment | — | — | ❌ | ✅ (audit-logged) |

Prototype gap: no auth and no panels today — anyone can post/apply (open INSERT MVP policies), and there is no moderation queue. The RLS hardening in `schema.sql` comments is the exact production checklist.
