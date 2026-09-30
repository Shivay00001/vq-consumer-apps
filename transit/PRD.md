# PRD — VQ Transit

**Status: planning doc for production target.** Current build is a working static toolkit (route search, next-departures, fare calculator, timetables over sample data — see README "What's real vs prototype"). This PRD describes the **production target**.

## 1. Problem

Indian train/bus travellers juggle fragmented sources: NTES for trains (official, no public API), Where Is My Train (crowdsourced GPS), redBus/AbhiBus for buses, and each city bus operator's own site. There is **no reliable free, keyless public API** for live positions (researched Sept 2026 — see README: RailRadar needs a bearer key; NTES has no public API; Delhi OTD realtime needs a registered key).

**VQ Transit** starts where data is obtainable: a fast, honest timetable + fare toolkit (static GTFS-style datasets, clearly labeled), with live data wired later as an *optional enhancement with graceful fallback* — never fake positions.

## 2. Users (per panel)

Note: per the framework, pure tool-type apps are exempt from the four-panel model. Transit is 90% tool; the panels below are the minimal honest set (data ops, not commerce).

| Panel | Who | Core needs |
|---|---|---|
| **User (traveller)** | Train/bus passengers | Route search, next departures, fare estimate, full timetables, live status (Phase 2) |
| **Admin (platform owner)** | Shivay / VisionQuantech | Manage timetable datasets (upload/refresh GTFS), configure live providers + API keys, analytics |
| **Customer Support** | VQ support staff | Data-correction tickets ("this timetable is wrong"), user feedback triage — no payments, so no refunds |
| **Partner (data provider)** | Transit agencies / GTFS publishers (future) | Submit/refresh static feeds, view usage stats for their feed |

## 3. User stories

**User**
- As a traveller, I can search trains/buses from → to and see departures sorted by soonest.
- As a traveller, I can see "next departures" computed against my device clock, clearly labeled as static timetable (not live).
- As a traveller, I can estimate fares by class — labeled as indicative, not official.
- As a traveller (Phase 2), I can optionally see live running status when a provider key is configured; if live fails, I get the static timetable with a clear "live unavailable" note.

**Admin**
- As admin, I can upload a new static timetable dataset (CSV/GTFS) and it goes live after validation.
- As admin, I can paste a RailRadar API key into server env (never client) and enable the live section.
- As admin, I can see which routes are searched most to prioritise data coverage.

**Support**
- As a support agent, I can log a data-correction ticket from a user report and mark it resolved when the dataset is fixed.
- As a support agent, I see no PII beyond an optional contact email the user volunteered.

**Partner (data provider)**
- As a transit agency, I can submit my GTFS feed URL; the platform validates and schedules refreshes.
- As a partner, I can see how many searches used my feed.

## 4. Success metrics

- Search success (from→to returns ≥1 result): **> 85%** on covered corridors
- "Was this timetable helpful?" positive: **> 80%**
- Data freshness: static datasets **< 90 days old**; stale datasets auto-flagged
- Zero incidents of fake live data shown (hard invariant)
- Phase 2: live-status cache hit rate **> 70%** (to stay inside RailRadar's 1,000 req/month free tier)

## 5. Non-goals

- No ticket booking (IRCTC/redBus own this; deep integration + payment liability out of scope).
- No fake "live" positions — ever. This is a brand-trust rule, not a technical limitation.
- No crowdsourced GPS (Where Is My Train's moat; unreliable without a large user base).
- No PNR status (requires IRCTC integration).

## 6. Monetization

| Stream | Model | Notes |
|---|---|---|
| Ads | AdSense slots already placed (2 placeholders in prototype) | Primary revenue; transit tools are high-traffic, low-conversion — ads fit |
| API | Phase 3: paid API for the cleaned timetable dataset (per 1k calls) | Only after coverage is genuinely good |
| Pro | No consumer Pro planned — tool stays free | Keeps SEO/traffic flywheel |

## 7. Prototype → production mapping

| Prototype (today) | Production target |
|---|---|
| `data.js` fictional sample (4 trains, 4 buses) | Real static datasets (GTFS / official timetables) with source + date labels |
| Next-departures from device clock | Same logic, over real data; still labeled "timetable, not live" |
| Fictional demo fares | Indicative fares from official fare tables, labeled as such |
| Phase-2 provider list (documented, not wired) | Worker proxy: `GET /api/live/train/:no` → RailRadar (key in env) → Redis cache → static fallback |
