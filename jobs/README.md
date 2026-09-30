# VQ Jobs — Real Job Board (App 4)

Mobile-first job board that is **genuinely shippable**: it runs on bundled demo data out of the box, and becomes a real Supabase-backed app the moment the owner pastes in a project URL + anon key. No build step, no npm, no server — just static files.

## What's real vs demo

| Part | Demo mode (default) | Live mode (Supabase configured) |
|---|---|---|
| Browse / search / filter (title, location, type, remote) | ✅ Real UI over **fictional** sample jobs | ✅ Real — reads your `jobs` table |
| Job detail view | ✅ Real UI, fictional data | ✅ Real |
| Apply flow (name/email/phone/resume-link/cover note) | ✅ Real form — saved to **this device only**, labeled as such | ✅ Real — inserts into `applications` table |
| Post-a-job flow (company, role, salary, description) | ✅ Real form — saved to **this device only**, appears in demo list | ✅ Real — creates `employers` + `jobs` rows |
| Data honesty | Banner: "Demo mode — connect Supabase to go live" | Banner: "Connected to Supabase — real data" |

## Go live in ~5 minutes (site owner steps)

**What the owner must provide:** a free Supabase project (URL + anon key). Nothing else — no paid plan, no server.

1. **Create project** — go to https://supabase.com → Sign up → New project → name it `vq-jobs` → region **ap-south-1 (Mumbai)** → wait ~2 minutes.
2. **Run the schema** — in the dashboard open **SQL Editor → New query**, paste the entire contents of `schema.sql`, press **Run**. You should see "Success".
3. **Copy credentials** — go to **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. **Paste into `supabase-config.js`** — replace `PASTE_YOUR_SUPABASE_URL_HERE` and `PASTE_YOUR_SUPABASE_ANON_KEY_HERE`.
5. **Open `index.html`** — the banner flips to "🟢 Connected to Supabase — real data". Post a test job, apply to it, then check the rows in Supabase **Table Editor**.

## Schema summary (`schema.sql`)

- **`employers`** — `id (uuid pk)`, `company_name`, `contact_email`, `website`, `created_at`
- **`jobs`** — `id (uuid pk)`, `employer_id → employers`, `title`, `location`, `type` (check: full-time/part-time/contract/internship), `remote bool`, `salary_text`, `description`, `is_active`, `created_at`
- **`applications`** — `id (uuid pk)`, `job_id → jobs (cascade)`, `name`, `email` (basic format check), `phone`, `resume_link`, `cover_note`, `created_at`
- **Indexes** on active/created, location, type, employer, application job_id, company name
- **RLS** — enabled on all tables. Policies: public read on `jobs` + `employers`; **open inserts on all three for MVP** (each policy carries a `PRODUCTION` comment explaining the hardening: require auth for posting, rate-limit applications, and restrict `applications` SELECT to the posting employer — currently there is deliberately *no* select policy on `applications`, so reads return zero rows publicly).
- **View** `active_jobs` — jobs joined with company info, newest first.

## Security notes for the owner

- The **anon key** is safe to ship in frontend code (it's designed for that); RLS is what protects the data.
- Before promoting beyond MVP: add Supabase Auth for employers, flip the insert policies to `authenticated`, add a moderation step for new listings, and rate-limit the apply endpoint.
- Demo-mode data lives in `localStorage` keys `vq_jobs_demo_extra_v1` / `vq_jobs_demo_apps_v1` — clearing site data resets the demo.

## File layout

- `index.html` — browse / detail / apply / post-a-job views (+ the one allowed external script: `@supabase/supabase-js` CDN)
- `styles.css` — mobile-first responsive styles
- `app.js` — dual-mode data layer, filters, apply/post flows
- `supabase-config.js` — placeholders + go-live comment block
- `schema.sql` — full Postgres schema with RLS

## AdSense slots

Two labeled placeholder slots on the listings view (`data-ad="jobs-listing-top"` / `"jobs-listing-bottom"`) — HTML comments mark the paste points.

## Production hardening checklist (before promoting the live URL)

The app is backend-real but ships with **MVP-open policies** — do these before real traffic:

1. **Supabase Auth** — enable email + Google login; add `profiles` table with roles.
2. **Apply the `owner_id` migration** in TRD.md (employers → auth.users; applications → candidate_id + status; jobs → moderation column).
3. **Flip RLS policies** — inserts to `authenticated`, applications SELECT scoped to owning employer (the commented policy in `schema.sql`).
4. **Moderation** — new listings default `moderation='pending'`; build the admin approve/reject queue.
5. **Rate limits** — Workers/Edge Function + Upstash: 5 applications/hour, 10 posts/day.
6. **Resumes** — replace `resume_link` free text with Storage uploads (private bucket, signed URLs, ≤5MB).
7. **Restore drill** — test a Supabase backup restore; write down RPO 24h / RTO 4h.

**What the owner must provide:** free Supabase project (URL + anon key) — already documented above; plus free Cloudflare account (Pages + Workers) and free Upstash Redis for the write API + throttles. Razorpay only later, when Featured listings launch.

## Architecture summary

Static SPA (Cloudflare Pages) — reads via Supabase client (anon key + RLS), **writes via Cloudflare Workers API** (validates, rate-limits via Upstash Redis, enforces moderation) → Supabase Postgres (hardened `schema.sql`) + Auth + Storage (private resume bucket) + Realtime (employer new-applicant pings). Full diagram + ERD + API contracts in TRD.md.

## Cost at scale (free-tier-only until revenue)

| 1k users | 100k users | 1M users |
|---|---|---|
| ₹0/mo (all free tiers) | ₹0–800/mo | ~₹3,000–5,000/mo (Supabase Pro $25 + overages) |

Alert at 70% of any free-tier quota. Revenue math: 5k featured listings/mo × ₹299 ≈ ₹15L/mo — infra <0.4%.

## Rollback steps

1. **Frontend:** Cloudflare Pages one-click rollback.
2. **Workers API:** `wrangler rollback` or dashboard rollback.
3. **Database:** Supabase PITR / daily backup restore; migrations are additive-only (new columns, never drops).
4. **Kill switches:** `POSTING_ENABLED=false` pauses new job posts; `APPLY_ENABLED=false` pauses applications — both without downtime.

## Docs map

- [PRD.md](PRD.md) — problem, users, stories, metrics, non-goals, monetization
- [COMPETITORS.md](COMPETITORS.md) — Naukri / LinkedIn / Apna / Indeed / Cutshort-Wellfound: pricing, feature matrix, what to copy/beat
- [TRD.md](TRD.md) — architecture, ERD (extends `schema.sql`), API contracts, Redis plan, scaling, cost
- [UI_FLOWS.md](UI_FLOWS.md) — screen maps + click-paths for all four panels, RBAC matrix
- [SECURITY.md](SECURITY.md) — framework section-4 checklist, top 3 gaps (open INSERT, owner_id, resume_link), sign-off
