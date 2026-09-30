-- ============================================================
-- VQ Jobs — Supabase Postgres schema (App 4, REAL backend)
--
-- HOW TO USE:
--   1. Create a free project at https://supabase.com
--   2. Open the SQL Editor in the Supabase dashboard
--   3. Paste this whole file and run it
--   4. Copy your Project URL + anon key into supabase-config.js
--
-- SECURITY MODEL (MVP):
--   * jobs: public READ (anyone can browse listings)
--   * jobs / employers / applications: open INSERT for MVP so the
--     demo works without logins. !!! PRODUCTION HARDENING !!!
--     Before real use: require auth for posting, add rate limits,
--     and restrict applications SELECT to the posting employer
--     (see comments on each policy below).
-- ============================================================

-- ---------- tables ----------

create table if not exists employers (
  id           uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_email text,
  website      text,
  created_at   timestamptz not null default now()
);

create table if not exists jobs (
  id           uuid primary key default gen_random_uuid(),
  employer_id  uuid references employers(id) on delete set null,
  title        text not null,
  location     text not null default 'Remote',
  type         text not null default 'full-time'
               check (type in ('full-time','part-time','contract','internship')),
  remote       boolean not null default false,
  salary_text  text,                       -- free text, e.g. "₹8–12 LPA" or "$60k/yr"
  description  text not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists applications (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references jobs(id) on delete cascade,
  name        text not null,
  email       text not null check (email like '%@%'),
  phone       text,
  resume_link text,                        -- URL to resume (Drive/Dropbox/etc.)
  cover_note  text,
  created_at  timestamptz not null default now()
);

-- ---------- indexes ----------

create index if not exists jobs_active_created_idx on jobs (is_active, created_at desc);
create index if not exists jobs_location_idx        on jobs (location);
create index if not exists jobs_type_idx           on jobs (type);
create index if not exists jobs_employer_idx       on jobs (employer_id);
create index if not exists applications_job_idx    on applications (job_id);
create index if not exists employers_name_idx     on employers (company_name);

-- ---------- Row Level Security ----------

alter table employers   enable row level security;
alter table jobs        enable row level security;
alter table applications enable row level security;

-- JOBS: anyone (anon + authenticated) can read listings.
create policy "jobs_public_read"
  on jobs for select
  to anon, authenticated
  using (true);

-- JOBS: open insert for MVP (no login yet).
-- PRODUCTION: change to `to authenticated` and/or add moderation queue.
create policy "jobs_open_insert_mvp"
  on jobs for insert
  to anon, authenticated
  with check (true);

-- EMPLOYERS: public read (company names shown on listings).
create policy "employers_public_read"
  on employers for select
  to anon, authenticated
  using (true);

-- EMPLOYERS: open insert for MVP.
-- PRODUCTION: tie to authenticated user id.
create policy "employers_open_insert_mvp"
  on employers for insert
  to anon, authenticated
  with check (true);

-- APPLICATIONS: open insert for MVP so candidates can apply without login.
-- PRODUCTION: add rate limiting / captcha; keep insert open but throttle.
create policy "applications_open_insert_mvp"
  on applications for insert
  to anon, authenticated
  with check (true);

-- NOTE: there is deliberately NO select policy on applications.
-- With RLS enabled and no policy, anon/authenticated reads return zero
-- rows — applications are write-only from the public site.
-- PRODUCTION: add a select policy so each employer can read applications
-- for THEIR jobs only, e.g.:
--   create policy "applications_employer_read" on applications for select
--   to authenticated using (
--     exists (select 1 from jobs j
--             where j.id = applications.job_id
--               and j.employer_id in (select id from employers where owner_id = auth.uid()))
--   );
-- (requires adding an owner_id uuid column to employers first.)

-- ---------- helpful view: active jobs with company ----------

create or replace view active_jobs as
select j.id, j.title, j.location, j.type, j.remote, j.salary_text,
       j.description, j.created_at,
       e.company_name, e.website
from jobs j
left join employers e on e.id = j.employer_id
where j.is_active = true
order by j.created_at desc;
