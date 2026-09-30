# UI Flows — VQ Transit

**A note on panels:** per the framework, pure tool-type apps are exempt from the four-panel model (overengineering them is a mistake). Transit is 90% tool, so this doc covers the full **User** tool flows plus the **minimal** Admin / Support / Partner (data-provider) surfaces the production target actually needs — nothing more.

## Screen map

```
User (tool)                    Admin (data ops)            Support              Partner (data provider)
───────────                    ────────────────            ───────              ─────────────────────
/ (tabs)                       /admin/login                /support/login         /partner/login
  → 🔍 Find routes             /admin/datasets             /support/corrections   /partner/feeds
  → 🕐 Next departures            → upload/validate           → ticket detail        → submit feed URL
  → 💰 Fare calculator            → activate/retire           → resolve              → usage stats
  → 📋 Timetables                 → staleness flags
/results (from → to)           /admin/providers
  → sort: soonest                → enable/disable live
/train/:no, /bus/:route          → quota monitor
  → full timetable             /admin/analytics
  → (Phase 2) live tab           → top searches
```

## Click-paths

### User: "How do I get from A to B?"
1. `/` → **Find routes** tab → From: `BCT` → To: `NDLS` → **Search**.
2. `/results` → list sorted by next departure: train no, name, dep/arr, duration, classes with indicative fares → tap → full timetable with all stops.
3. Every result card: "Static timetable — not live · Data: <source>, updated <date>".
4. **Empty state:** no route → "No direct service in our timetable — try nearby stations" + station picker. **Error:** unknown station code → inline suggestion ("Did you mean NDLS?").

### User: "What's the next bus?"
1. **Next departures** tab → stop: `Connaught Place` → now (device clock) → next 5 departures with countdown ("in 12 min").
2. **Empty state:** no more departures today → "First bus tomorrow at 06:00". **Note:** computed from static schedule — labeled.

### User: fare estimate
1. **Fare calculator** → train no + class → indicative fare. Label: "Indicative fare from published tables — not an official quote, not a ticket."

### Admin: refresh a dataset
1. `/admin/login` → `/admin/datasets` → **Upload** (CSV/GTFS zip ≤50MB) → validation report (row counts, parse errors) → **Activate** (old version kept for rollback) / **Retire**.
2. Stale flag (>90 days): banner "DTC feed is 102 days old — refresh or confirm still valid".
3. `/admin/providers`: toggle live providers; quota bar for RailRadar (e.g. "612 / 1,000 req used").

### Support: correction ticket
1. User taps "Report wrong data" on any result → `/api/corrections` (optional email) → ticket in `/support/corrections`.
2. Agent verifies against source → fixes dataset (or escalates to admin) → **Resolve** → optional email to reporter.
3. **Empty state:** "No open corrections". No PII beyond volunteered email; no payments → no refunds module.

### Partner (data provider): submit feed
1. `/partner/login` → `/partner/feeds` → paste GTFS URL → validation → scheduled daily refresh.
2. Usage stats: searches served from their feed.

## RBAC matrix (deny-by-default)

| Capability | User | Partner (data) | Support | Admin |
|---|---|---|---|---|
| Search / timetables / fares | ✅ | ✅ | ✅ | ✅ |
| Submit correction ticket | ✅ | ✅ | ✅ | ✅ |
| Manage own feeds | — | ✅ (own) | — | — |
| See other providers' feeds | — | ❌ | — | ✅ |
| Resolve correction tickets | — | — | ✅ | ✅ |
| Upload/activate datasets | — | — | ❌ | ✅ |
| Manage live provider keys | — | — | ❌ | ✅ |
| Analytics | — | ✅ (own feed) | — | ✅ |

Prototype gap: only the User tool flows exist today (over fictional sample data); Admin/Support/Partner surfaces are production-target.
