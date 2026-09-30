# VQ Transit — Demo Timetables (App 3)

Mobile-first bus & train timetable toolkit. Open `index.html` in any browser — no build step, no server, no npm.

## What's real vs prototype

| Part | Status |
|---|---|
| Route search (from → to) over static data | ✅ Real logic — over **sample** timetable in `data.js` |
| "Next departures" | ✅ Real computation — static sample schedule × device clock; **labeled "not live"** in UI |
| Fare calculator | ✅ Real — over **fictional demo fares** (labeled not official) |
| Full train/bus timetable views | ✅ Real — sample data |
| Live bus/train tracking | ❌ **Phase 2 — deliberately not built.** No fake positions anywhere. |

**Honesty rules baked into the UI:** a Phase-2 banner on every screen states no live positions are shown; every result card carries a "static sample timetable — not live" note; the app links to the official NTES site for real live status.

## API research outcome (Sept 2026)

Question: is there a reliable **free, keyless** public API for Indian bus/train live tracking?

**Answer: no.** Findings:

| Source | Verdict |
|---|---|
| **RailRadar** (railradar.in/docs) | Closest fit — documented live board/running-status API, free tier 1,000 req/month, but **requires a bearer API key**. Not keyless. |
| **RapidAPI "Indian Railways API"** | Requires RapidAPI key + subscription (paid tiers). Not free/keyless. |
| **NTES / enquiry.indianrail.gov.in** (official) | Authoritative running status, but **no public API** — protected site, scraping is blocked/unreliable. |
| **Delhi Open Transit Data** (otd.delhi.gov.in) | Static GTFS public; **realtime feed needs a registered private key**. |
| **BMTC (Bengaluru)** | Static GTFS via community mirrors (e.g. Vonter/bmtc-gtfs); realtime not reliably open. Unofficial reverse-engineered APIs exist but break and are not reliable. |

**Conclusion:** ship the timetable tools now; wire live data later as an *optional enhancement with graceful fallback* to static data — never fake positions.

Sources: RailRadar docs (railradar.in/docs), Delhi OTD docs (otd.delhi.gov.in/documentation), community GTFS mirrors, NTES.

## Phase 2 wiring plan (for the owner)

1. Sign up at railradar.in → get free API key (1,000 req/month).
2. Add an optional `LIVE` section in `data.js` config: `{ railRadarKey: "…" }` (empty = static mode).
3. `app.js` already isolates data access — add a `fetchLiveBoard(trainNo)` that runs **only when a key is present**, caches aggressively, and falls back to the static timetable on any failure.
4. Delhi buses: register at otd.delhi.gov.in for a realtime key when available.

Until then, the app stays honest: static demo timetables, clearly labeled.

## File layout

- `index.html` — tabs (find routes, next departures, fare calculator, timetables) + Phase-2 banner/note
- `styles.css` — mobile-first responsive styles
- `data.js` — sample stations/trains/buses + documented Phase-2 provider list (not wired)
- `app.js` — search, next-departure computation, fare calc, timetable rendering

## AdSense slots

Two labeled placeholder slots (`data-ad="transit-tools-top"` / `"transit-tools-bottom"`) — HTML comments mark the paste points.

## Production setup (v1 — no backend needed)

**What the owner must provide:** nothing for v1 — just a Cloudflare account (free) and an AdSense account when ready for ads.

1. Replace the fictional sample in `data.js` with a real static dataset (GTFS or official timetable), keeping the `source` + `valid_from/to` labels the UI already shows.
2. Deploy to Cloudflare Pages (drag-and-drop or `wrangler pages deploy`).
3. Paste AdSense unit code at the two marked slots (`data-ad="transit-tools-top"` / `"transit-tools-bottom"`).

**Phase 2 (live status) additionally needs:** a free RailRadar API key (1,000 req/month) stored in a Cloudflare Worker env var — **never in `data.js`** (see SECURITY.md gap #1). Delhi buses: registered key from otd.delhi.gov.in when available.

## Architecture summary

v1: static SPA on Cloudflare Pages — zero backend, zero database, zero auth; datasets ship as versioned JSON. Phase 2: one Cloudflare Worker proxies live-provider APIs (key in env) with Upstash Redis caching (5–10 min TTL) and a monthly quota guard; every live failure degrades to the static timetable. Full diagram + contracts in TRD.md.

## Cost at scale (free-tier-only until revenue)

| 1k users | 100k users | 1M users |
|---|---|---|
| ₹0/mo | ₹0/mo | ₹0/mo |

Transit is the cheapest app in the portfolio: no DB, no auth, no payments. Revenue is AdSense. A paid live-data tier only ever comes out of ad income, never ahead of it.

## Rollback steps

1. **Frontend/data:** Cloudflare Pages one-click rollback to any prior deployment (datasets are versioned: `/data/v2026-09/trains.json`).
2. **Dataset:** keep the previous version live — rollback = reactivate previous dataset version.
3. **Live proxy (Phase 2):** `DISABLE_LIVE=true` in Worker env instantly falls back to static timetables everywhere.

## Docs map

- [PRD.md](PRD.md) — problem, users, stories, metrics, non-goals, monetization
- [COMPETITORS.md](COMPETITORS.md) — NTES / Where Is My Train / redBus / RailRadar / ixigo: feature matrix, what to copy/beat
- [TRD.md](TRD.md) — architecture (static-first), data model, API contracts, Redis/quota plan, scaling, cost
- [UI_FLOWS.md](UI_FLOWS.md) — user tool flows + minimal admin/support/partner surfaces, RBAC matrix
- [SECURITY.md](SECURITY.md) — framework section-4 checklist (lowest risk profile of the four apps), key-placement trap, sign-off
