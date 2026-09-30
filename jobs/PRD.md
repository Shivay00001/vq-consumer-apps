# PRD — VQ Jobs

**Status: planning doc for production target.** Current build is the closest to production of the four apps: real Supabase schema with RLS (`schema.sql`), dual demo/live mode, working apply + post-a-job flows (see README "What's real vs demo"). This PRD describes the **production target** — mostly hardening + panels on top of what exists.

## 1. Problem

SMB hiring in India is stuck between two bad options: Naukri charges per-posting (₹400–₹1,650/post) plus database plans (SMB plans ₹2,500–₹4,950+GST), and LinkedIn Recruiter Lite runs ~₹8,260/month — priced for enterprises. Blue-collar platforms (Apna: ~₹1,949/month+) serve frontline roles but not general SMB white-collar hiring. A 10-person startup that hires 3 people a year shouldn't need a recruiter seat.

**VQ Jobs** is a dead-simple job board: free posting for employers (launch), one-click apply for candidates, employer dashboard to manage applicants — monetised later via featured listings and recruiter tools, not per-post tolls.

## 2. Users (per panel)

| Panel | Who | Core needs |
|---|---|---|
| **User (candidate)** | Job seekers | Search/filter jobs, job detail, one-click apply (profile-based), application status, alerts |
| **Partner (employer)** | SMB founders, hiring managers | Post jobs, manage listings (pause/close), view + manage applicants, shortlist/reject, company profile |
| **Customer Support** | VQ support staff | Fraud/spam listing reports, user lookup (masked PII), listing takedowns, dispute tickets |
| **Admin (platform owner)** | Shivay / VisionQuantech | Listing moderation queue, employer verification, analytics (posts, applies, fills), audit log |

## 3. User stories

**Candidate**
- As a candidate, I can search by title, location, type, remote — and get relevant results fast (already works in demo/live).
- As a candidate, I can apply in one click using my saved profile (no retyping) — resume via uploaded file (Storage), not just a link.
- As a candidate, I can see my application status: received → shortlisted / rejected.

**Employer (already partially live via `schema.sql`)**
- As an employer, I can post a job in under 3 minutes (already works; production adds login + moderation).
- As an employer, I can see applicants **only for my jobs** (requires the `owner_id` RLS hardening noted in `schema.sql`).
- As an employer, I can shortlist/reject with one click; the candidate gets notified.

**Support**
- As a support agent, I can action "report this listing" (spam/fraud/fake job) — hide listing pending review.
- As a support agent, I can look up a user by email (masked) to resolve disputes; every lookup logged.

**Admin**
- As admin, I triage the moderation queue (new listings held until approved — kills spam, the #1 job-board killer).
- As admin, I see funnel analytics: listings → applications → shortlists.

## 4. Success metrics

- Time-to-first-applicant per listing: **< 48h median**
- Spam/fake listing rate: **< 1%** (moderation queue + reporting)
- Employer 90-day retention (posts again): **> 40%**
- Candidate apply completion (started → submitted): **> 80%**
- Prototype validation: 10 real employers posting within 60 days of go-live

## 5. Non-goals (production v1)

- No resume database / CV search (Naukri Resdex territory — expensive, legally sensitive).
- No ATS integrations (Greenhouse/Lever) in v1.
- No salary benchmarking data product (Phase 3).
- No automated candidate screening/AI matching in v1 (keep the human loop).

## 6. Monetization

| Stream | Model | Notes |
|---|---|---|
| Free posting | ₹0 at launch | Wedge vs Naukri's ₹400–1,650/post |
| Featured listing | ₹199–499 per listing for 7-day boost | Launch after 500+ live listings |
| Employer Pro | ₹999/mo: applicant tracking extras, company branding, unlimited active posts | Phase 2 |
| Ads | AdSense slots already placed (2 placeholders) | Post-traffic |
| API (Phase 3) | Job-feed API for aggregators | Only with employer consent |

## 7. Prototype → production mapping

| Today (demo/live dual mode) | Production target |
|---|---|
| `schema.sql` with **open INSERT** MVP policies | Auth-gated inserts; `employers.owner_id → auth.uid()`; employer-scoped `applications` SELECT (the commented policy in `schema.sql`) |
| `resume_link` free-text URL | Supabase Storage resume uploads (PDF/DOC ≤5MB, scanned posture) |
| No login | Supabase Auth (email + Google); roles: candidate / employer / support / admin via `profiles.role` |
| No moderation | New listings `is_active=false` until approved (moderation queue) |
| No rate limits | Redis/Edge Function throttling: 5 applications/hour/candidate, 10 posts/day/employer |
| Demo banner vs live banner | Same dual-mode honesty kept: banner always states mode |
