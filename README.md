# VQ Consumer Apps — Track Overview

Four local consumer apps, each self-contained in its folder. Open any `index.html` directly in a browser — **no npm, no build step, no server**.

| App | Folder | Month-1 status | Honesty note |
|---|---|---|---|
| 🥦 VQ Grocery | `grocery/` | Polished prototype frontend | Catalog/cart/checkout UI real; **demo data only** — no real store, inventory or payments (Phase 2) |
| 🍔 VQ Food | `food-delivery/` | Polished prototype frontend | Restaurant/menu/cart UI real; **demo data only**; order tracking is a **labeled simulation** — no real restaurants or riders (Phase 2) |
| 🚆 VQ Transit | `transit/` | Honest timetable toolkit | Route search, next-departures (static × device clock), fare calc, timetables — all **sample data**; **live tracking is Phase 2** (no free keyless API exists — research in `transit/README.md`) |
| 💼 VQ Jobs | `jobs/` | **Real, Supabase-shippable** | Demo mode on bundled data until owner pastes Supabase URL + anon key (~5 min go-live, steps in `jobs/README.md`) |

## Shared conventions

- Mobile-first responsive CSS, one `styles.css` per app; vanilla JS, one `app.js` per app.
- Every app has an honest banner + a `README.md` with a **"What's real vs prototype/demo"** table. No fake claims in UI copy.
- AdSense placeholder slots (labeled `<div class="ad-slot">` with HTML paste-point comments) on listing pages of grocery, food-delivery and jobs, and on the transit tools page.
- Each app lives entirely in its own folder — no shared dependencies between apps.

## Blockers / owner actions needed

- **Jobs → live:** needs the owner's Supabase project URL + anon public key pasted into `jobs/supabase-config.js` (free tier is enough). Until then it runs in clearly-labeled demo mode.
- **Transit → live tracking:** needs the owner to obtain a free API key (e.g. RailRadar, 1,000 req/month free) — see `transit/README.md` Phase-2 wiring plan. Until then: static demo timetables only, honestly labeled.
- **Grocery / Food → real:** need a backend + payment gateway (Phase 2, not started).
