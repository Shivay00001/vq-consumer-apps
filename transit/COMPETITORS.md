# Competitor Research — VQ Transit

Research date: 2026-09-26. VQ Transit is a timetable tool, not a booking platform — competitors are information sources.

## Competitors

### 1. NTES (National Train Enquiry System — enquiry.indianrail.gov.in)
- **Model:** official Indian Railways running-status / train info site.
- **Pricing:** free to users; **no public API** (protected site; scraping is blocked/unreliable — per our Sept 2026 research).
- **Copy:** authoritative data; "spot your train" running status is the gold standard.
- **Beat:** NTES UX is dated and has no API — VQ can be the clean, fast, mobile-first timetable layer on top of official static data, and link out to NTES for live status (which the prototype already does).

### 2. Where Is My Train (Sigmoid Labs / Google)
- **Model:** crowdsourced + official-data train running status app; works offline via cell-tower/SMS triangulation.
- **Pricing:** free, ad-supported; no public API for third parties.
- **Copy:** offline-first design, crowdsourced live positions, PNR/status in one app — the moat is millions of users contributing GPS.
- **Beat/learn:** can't beat the crowdsourced moat without scale; don't try. Copy the offline-first ethos: VQ's static timetables work with zero network after first load.

### 3. redBus
- **Model:** intercity bus discovery + booking; also sells BOSS/SeatSeller SaaS to operators.
- **Pricing:** free consumer app; operator-side: BOSS charges **~1% of every ticket sold** by the operator, SeatSeller **1–5%** from travel agents (Forbes India). Historically ~₹50–60 earned per ticket sold online (older figures).
- **Copy:** widest operator coverage, seat maps, booking flow polish.
- **Beat:** redBus is booking-first; VQ Transit is info-first and free of booking lock-in — link out to redBus for booking rather than competing.

### 4. RailRadar (railradar.in)
- **Model:** live train board / running-status API + app.
- **Pricing:** free tier **1,000 req/month** with bearer API key; paid tiers above that. Not keyless.
- **Copy:** clean documented API — the pragmatic live-data source for Phase 2.
- **Beat/learn:** not a competitor to beat — it's the Phase-2 supplier. Design the Worker proxy + Redis cache around its quota (1k req/mo ≈ 33/day: cache aggressively, per-train TTL 5–10 min).

### 5. ixigo / ConfirmTkt (info features)
- **Model:** booking apps with strong train-info features (PNR prediction, running status, fare info).
- **Pricing:** free app; monetise via bookings + ads.
- **Copy:** PNR prediction is a beloved info feature built on historical data — no live API needed.
- **Beat/learn:** Phase-3 idea: historical on-time performance per train from our own collected data → "usually 20 min late" predictions without any live API.

## Feature matrix

| Feature | NTES | Where Is My Train | redBus | RailRadar | **VQ Transit (target)** |
|---|---|---|---|---|---|
| Live train status | Yes (official) | Yes (crowd) | No | Yes (API) | Phase 2 (via RailRadar) |
| Static timetables | Yes | Yes | Schedules | — | **Yes** |
| Bus timetables | No | No | Yes (booking) | No | **Yes (static)** |
| Fare calculator | Partial | No | Yes | No | **Yes (indicative)** |
| Offline use | No | Yes | Partial | No | **Yes (static bundle)** |
| Public API | No | No | Partner-only | Keyed | Planned (Phase 3) |
| Booking | No | No | Yes | No | **No (link-out)** |

## What to copy
1. **Where Is My Train:** offline-first; the whole static dataset ships with the page.
2. **NTES:** authority — always cite the data source and date on every timetable.
3. **ixigo:** historical delay predictions as a no-live-API differentiator (Phase 3).

## What to beat
1. **Honesty as a feature:** every screen states what's static vs live. Competitors blur this; we make it the brand.
2. **Speed + simplicity:** one search box, instant results, no login, no app install.
3. **Bus coverage:** city bus static timetables (DTC/BMTC/BEST-style) are poorly served by the train-centric apps.

## Sources
- RailRadar docs — https://railradar.in/docs
- Delhi Open Transit Data — https://otd.delhi.gov.in
- Forbes India: "Redbus Has The Hot Ticket" — https://www.forbesindia.com/article/work-in-progress/redbus-has-the-hot-ticket/32382/1
- Sept 2026 API research notes in README.md (this folder)
