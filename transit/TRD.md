# TRD — VQ Transit

## 1. Architecture (production target)

Phase 1 is deliberately server-light: static datasets served from CDN, all computation client-side. Live data (Phase 2) goes through a key-holding Worker proxy so API keys never touch the browser.

```
Phase 1 (now → production v1):
┌──────────────┐      ┌──────────────────┐
│  Static SPA  │ ────▶│ Cloudflare Pages │
│  (search +   │      │ (CDN; datasets   │
│   timetables │      │  as JSON/GTFS    │
│   client-side)│      │  bundles)        │
└──────────────┘      └──────────────────┘
        No auth, no DB, no payments. AdSense only.

Phase 2 (live status, optional):
┌──────────────┐      ┌───────────────────────────┐      ┌────────────┐
│  Static SPA  │ ────▶│  Cloudflare Worker        │─────▶│ RailRadar  │
│  /api/live/* │      │  - key in env (never      │ key  │ API        │
└──────────────┘      │    client)                │      │ 1k req/mo  │
                      │  - Redis cache (5-10 min) │      └────────────┘
                      │  - fallback → static      │
                      └──────┬────────────────────┘
                             ▼
                      ┌──────────────┐
                      │ Upstash Redis│  live-board cache, rate limits
                      └──────────────┘
(Admin dataset uploads: Supabase Storage + a tiny Worker admin API, or manual deploy. No user DB.)
```

**Stack decision:** Cloudflare Pages for everything in v1 (₹0). Phase 2 adds one Worker + Upstash Redis free tier. Supabase only if/when user accounts or saved routes are wanted — not in v1. No payments anywhere.

## 2. Data model (ERD)

v1 has no relational DB — datasets are versioned static files. Documented here as the production schema for when datasets move server-side:

```
datasets               gtfs_calendar (illustrative, if moved to Postgres)
--------               -------------
id (uuid pk)           service_id, monday..sunday bool, start_date, end_date
source (ntes/dtc/...)  ──
region                 stops: stop_id pk, stop_code, stop_name, lat, lon
valid_from/to          stop_times: trip_id, stop_id, arrival, departure, seq
file_url (R2/Storage)  trips: trip_id pk, route_id, service_id
row_count              routes: route_id pk, route_short_name, route_type
imported_at            fare_rules (indicative): route_id, class, fare_cents
imported_by → auth         ──
status (active/stale)  live_cache (Redis, not Postgres):
                       live:train:{no} → board JSON, TTL 5–10 min

correction_tickets
------------------
id, dataset_id, reported_by_email (optional), description, status, resolved_at
```

**Rules:** every dataset carries `source` + `valid_from/to`; UI shows "Data: DTC GTFS, updated <date>" on every result. Stale datasets (>90 days) auto-flag to admin.

## 3. API contracts

| Endpoint | Method | Auth | Rate limit | Notes |
|---|---|---|---|---|
| `/data/trains.json`, `/data/buses.json` | GET | none | CDN-cached | versioned (`/data/v2026-09/trains.json`); immutable cache |
| `/api/live/train/:no` (Phase 2) | GET | none | 20/min/IP | Worker → Redis → RailRadar; on failure returns `{ "live": false, "fallback": "static" }` |
| `/api/live/bus/:route` (Phase 2) | GET | none | 20/min/IP | Delhi OTD realtime when key exists; else static |
| `/api/corrections` | POST | none (email optional) | 5/min/IP | data-correction ticket; honeypot + length limits |
| `/api/admin/datasets` | CRUD | admin JWT | 10/min/user | upload/activate/retire datasets; audit-logged |
| `/api/admin/providers` | PUT | admin JWT | 10/min/user | enable/disable live providers (keys stay in env, never via API) |

**Error contract:** `{ "error": { "code": "LIVE_UNAVAILABLE", "message": "Live data unavailable — showing timetable" } }`. Live endpoints must never 500 into a blank screen; they degrade to static.

## 4. Redis usage plan (Upstash) — Phase 2 only

| Key pattern | Purpose | TTL |
|---|---|---|
| `live:train:{no}` | RailRadar board response cache | 5–10 min |
| `live:bus:{route}` | bus realtime cache | 2–5 min |
| `rl:live:{ip}` | live-endpoint rate limit (protects the 1k/mo quota) | 60s |
| `quota:railradar:month` | counter of upstream calls this month; hard-stop at 950 | 30d |

Quota guard: when `quota:railradar:month ≥ 950`, live endpoints short-circuit to static for the rest of the month — no surprise bills, no dead screens.

## 5. Scaling plan

- **10x:** static files on CDN scale infinitely; nothing to do.
- **100x:** same. If live usage grows, add more provider keys / paid RailRadar tier (only after ad revenue covers it — free-tier-only rule).

## 6. Cost estimate (free-tier-only until revenue)

| Users | Infra | Est. cost |
|---|---|---|
| 1k MAU | Pages only | **₹0/mo** |
| 100k MAU | Pages only (static) | **₹0/mo** |
| 1M users | Pages only; Phase-2 Worker still inside 100k req/day free if live section is quota-capped; Upstash free | **₹0/mo** |

Transit is the cheapest app in the portfolio: no DB, no auth, no payments. Revenue is AdSense; costs stay ₹0 until a paid live-data tier is justified by ad income.
