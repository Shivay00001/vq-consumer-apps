# TRD — VQ Jobs

## 1. Architecture (production target)

The app already runs dual-mode (demo localStorage / live Supabase direct). Production keeps the static frontend on Pages but moves **all writes through an API layer** so RLS + rate limits + moderation can't be bypassed from the browser.

```
┌──────────────┐      ┌──────────────────┐
│  Static SPA  │ ────▶│ Cloudflare Pages │
│  (Pages)     │      │ (CDN, free)      │
└──────┬───────┘      └──────────────────┘
       │ reads: Supabase client (anon key, RLS)
       │ writes: Worker API (validates, rate-limits, moderates)
       ▼
┌──────────────────────────────────────────────────────┐
│  Cloudflare Workers (write API + moderation)         │
│  POST /api/jobs (→ creates employer+job, held for    │
│       moderation)                                    │
│  POST /api/applications (→ throttled, captcha)       │
│  PATCH /api/employer/jobs/:id (pause/close)          │
│  PATCH /api/employer/applications/:id (shortlist)    │
│  /api/support/* /api/admin/* (RBAC middleware)       │
│  - service-role Supabase; Upstash Redis rate limits  │
└──────┬──────────────┬────────────────┬───────────────┘
       ▼              ▼                ▼
┌────────────┐ ┌────────────┐ ┌─────────────────┐
│ Supabase   │ │ Upstash    │ │ Supabase Storage│
│ Postgres   │ │ Redis      │ │ (resumes bucket,│
│ + Auth     │ │ rate-limit │ │  private, signed│
│ + Realtime │ │ idempotency│ │  URLs, ≤5MB)    │
│ (notify    │ │ queues     │ └─────────────────┘
│  employer  │ │            │
│  on apply) │ │            │
└────────────┘ └────────────┘
```

**Stack decision:** Cloudflare Pages + Workers; Supabase Postgres (existing `schema.sql` + hardening below) + Auth + Storage; Upstash Redis; no payments in v1 (Featured listings later via Razorpay test→live). Realtime: notify employer dashboard on new application.

## 2. Data model (ERD) — extends existing `schema.sql`

```
profiles                 employers (EXISTING + hardening)
--------                 -------------------------------
id → auth.users pk       id (uuid pk)
role: candidate/         owner_id → auth.users  ★ NEW (required)
  employer/support/      company_name
  admin                  contact_email / website
full_name                is_verified bool ★ NEW
created_at               created_at

jobs (EXISTING + hardening)      applications (EXISTING + hardening)
--------------------------      -----------------------------------
id (uuid pk)                    id (uuid pk)
employer_id → employers         job_id → jobs (cascade)
title / location / type /       candidate_id → auth.users ★ NEW
  remote / salary_text /         name / email / phone
  description                   resume_path (Storage) ★ was resume_link
is_active bool                  cover_note
moderation: pending/            status: received/shortlisted/
  approved/rejected ★ NEW         rejected ★ NEW
created_at                      created_at

reports                    audit_log / notifications
-------                    -------------------------
id, job_id → jobs,         (standard: actor, action, entity, meta, ts)
reporter_email,
reason, status, created_at
```

**Migration notes (on top of `schema.sql`):**
1. `alter table employers add column owner_id uuid references auth.users;` + backfill for existing rows (admin assigns).
2. `alter table applications add column candidate_id uuid references auth.users, add column status text default 'received';` — replace `resume_link` with `resume_path` (Storage object path).
3. `alter table jobs add column moderation text default 'pending';` — public read policy becomes `is_active AND moderation='approved'`.
4. RLS: `applications` SELECT → `authenticated` where employer owns the job (the commented policy in `schema.sql`, now real). INSERT → authenticated candidates (or anon with captcha + strict throttle at launch).

## 3. API contracts

| Endpoint | Method | Auth | Rate limit | Notes |
|---|---|---|---|---|
| `GET /api/jobs?q=&loc=&type=&remote=` | GET | none | 100/min/IP | only approved+active; paginated; edge-cached |
| `GET /api/jobs/:id` | GET | none | 100/min/IP | approved+active only |
| `POST /api/jobs` | POST | employer JWT | 10/day/employer | creates employer (if new, owner_id=uid) + job with moderation='pending' |
| `PATCH /api/employer/jobs/:id` | PATCH | employer JWT | 30/min/user | pause/close own jobs; ownership check |
| `POST /api/applications` | POST | candidate JWT (or anon+captcha at launch) | 5/hour/user | idempotency key; duplicate (candidate+job) rejected |
| `GET /api/employer/applications?job=` | GET | employer JWT | 60/min/user | own jobs only (RLS) |
| `PATCH /api/employer/applications/:id` | PATCH | employer JWT | 60/min/user | shortlist/reject → notifies candidate |
| `POST /api/upload/resume` | POST | candidate JWT | 10/day/user | → Storage `resumes/` private bucket; PDF/DOC ≤5MB; signed URL on read |
| `POST /api/reports` | POST | none (captcha) | 5/min/IP | report spam/fake listing |
| `/api/support/reports` | GET/PATCH | support JWT | 30/min/user | triage; hide listing pending review |
| `/api/admin/moderation` | GET/PATCH | admin JWT | 30/min/user | approve/reject queue; audit-logged |
| `/api/admin/users` | GET/PATCH | admin JWT | 30/min/user | role assignment; audit-logged |

## 4. Redis usage plan (Upstash)

| Key pattern | Purpose | TTL |
|---|---|---|
| `rl:apply:{uid_or_ip}` | application throttle (5/hour) | 1h |
| `rl:post:{uid}` | job-post throttle (10/day) | 24h |
| `rl:report:{ip}` | report spam guard | 1h |
| `idem:apply:{key}` | apply idempotency → application id | 24h |
| `queue:notify` | emails: application received, shortlisted, moderation decision | — |
| `sess:{uid}` | session metadata | 15min |
| `jobs:feed:{hash}` | search-result cache (invalidated on new approval) | 2min |

Graceful degradation: Redis down → throttles fall back to DB checks (unique constraint on `(job_id, candidate_id)` prevents double-applies).

## 5. Scaling plan

- **10x:** free tiers hold. Indexes already in `schema.sql`; add `(moderation, is_active, created_at)` composite.
- **100x:** Supabase Pro for pooling; Workers paid if >100k req/day; full-text search via Postgres `tsvector` on title/description (no Algolia bill).

## 6. Cost estimate (free-tier-only until revenue)

| Users | Infra | Est. cost |
|---|---|---|
| 1k MAU | Pages + Workers free, Supabase free, Upstash free | **₹0/mo** |
| 100k MAU | Same; Supabase free covers 50k MAU — split anon/auth carefully; Storage resumes ~GBs | **₹0–800/mo** |
| 1M users | Supabase Pro $25 + Storage/bandwidth overages, Workers paid, Upstash PAYG | **~₹3,000–5,000/mo** |

Revenue check: 1M users, 5k featured listings/mo × ₹299 ≈ ₹15L/mo — infra <0.4%.
