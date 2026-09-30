/* ============================================================
   VQ Transit — STATIC DEMO TIMETABLE (App 3, honest scope)
   Every time, fare and route below is fictional SAMPLE data for
   demo purposes. This app shows NO live positions — live tracking
   is explicitly Phase 2 (see README + on-page banner).
   "Next departures" is computed from THIS static timetable
   against the device clock — it is not live data.
   ============================================================ */

const DEMO_STATIONS = [
  { code: "BCT", name: "Mumbai Central" },
  { code: "NDLS", name: "New Delhi" },
  { code: "ADI", name: "Ahmedabad Jn" },
  { code: "MAS", name: "Chennai Central" },
  { code: "SBC", name: "Bengaluru City" },
  { code: "HWH", name: "Howrah Jn" },
  { code: "CNB", name: "Kanpur Central" },
];

const DEMO_TRAINS = [
  {
    no: "12951", name: "Mumbai Rajdhani (Demo)", days: "Daily",
    classes: { "Sleeper": 0, "3AC": 1890, "2AC": 2640 },
    stops: [
      { code: "BCT", arr: null, dep: "16:35" },
      { code: "ADI", arr: "21:55", dep: "22:00" },
      { code: "CNB", arr: "06:10", dep: "06:15", nextDay: true },
      { code: "NDLS", arr: "08:35", dep: null, nextDay: true },
    ],
  },
  {
    no: "12009", name: "Mumbai–Ahmedabad Shatabdi (Demo)", days: "Daily except Sun",
    classes: { "Chair Car": 720, "Executive": 1380 },
    stops: [
      { code: "BCT", arr: null, dep: "06:25" },
      { code: "ADI", arr: "12:45", dep: null },
    ],
  },
  {
    no: "12639", name: "Chennai–Bengaluru Brindavan (Demo)", days: "Daily",
    classes: { "Chair Car": 465, "2S": 165 },
    stops: [
      { code: "MAS", arr: null, dep: "07:40" },
      { code: "SBC", arr: "13:55", dep: null },
    ],
  },
  {
    no: "12301", name: "Howrah Rajdhani (Demo)", days: "Mon, Fri",
    classes: { "3AC": 2145, "2AC": 3010, "1AC": 4890 },
    stops: [
      { code: "HWH", arr: null, dep: "16:55" },
      { code: "CNB", arr: "01:35", dep: "01:40", nextDay: true },
      { code: "NDLS", arr: "10:05", dep: null, nextDay: true },
    ],
  },
];

const DEMO_BUS_STOPS = [
  { code: "CP", name: "Connaught Place", city: "Delhi" },
  { code: "AIIMS", name: "AIIMS", city: "Delhi" },
  { code: "NDRS", name: "New Delhi Rly Stn", city: "Delhi" },
  { code: "MGROAD", name: "MG Road", city: "Bengaluru" },
  { code: "KOR", name: "Koramangala", city: "Bengaluru" },
  { code: "MAJESTIC", name: "Majestic", city: "Bengaluru" },
  { code: "BANDRA", name: "Bandra Station", city: "Mumbai" },
  { code: "ANDHERI", name: "Andheri Station", city: "Mumbai" },
];

const DEMO_BUSES = [
  {
    route: "729", operator: "DTC (Demo)", city: "Delhi", fare: 15,
    departures: ["06:30", "07:15", "08:00", "09:30", "11:00", "13:00", "15:30", "17:45", "19:30", "21:00"],
    stops: [
      { code: "NDRS", t: "+0 min" }, { code: "CP", t: "+20 min" }, { code: "AIIMS", t: "+45 min" },
    ],
  },
  {
    route: "39", operator: "DTC (Demo)", city: "Delhi", fare: 10,
    departures: ["06:00", "07:00", "08:30", "10:00", "12:00", "14:00", "16:30", "18:30", "20:00"],
    stops: [
      { code: "CP", t: "+0 min" }, { code: "AIIMS", t: "+25 min" },
    ],
  },
  {
    route: "500D", operator: "BMTC (Demo)", city: "Bengaluru", fare: 25,
    departures: ["06:15", "07:00", "08:10", "09:45", "11:30", "13:15", "15:00", "17:15", "19:00", "20:45"],
    stops: [
      { code: "MAJESTIC", t: "+0 min" }, { code: "MGROAD", t: "+30 min" }, { code: "KOR", t: "+55 min" },
    ],
  },
  {
    route: "A-1", operator: "BEST (Demo)", city: "Mumbai", fare: 12,
    departures: ["06:45", "07:30", "08:45", "10:15", "12:30", "14:45", "17:00", "18:45", "20:30"],
    stops: [
      { code: "BANDRA", t: "+0 min" }, { code: "ANDHERI", t: "+35 min" },
    ],
  },
];

/* Phase-2 live-data hooks (NOT wired — no keyless free API exists, see README).
   When the owner obtains a key, app.js can call these via the
   LiveProviders stub. They are documented, not implemented. */
const LIVE_PROVIDERS_PHASE2 = [
  { name: "RailRadar", url: "https://railradar.in/docs", needs: "free API key (bearer), 1,000 req/month free tier", covers: "train live board / running status" },
  { name: "Delhi Open Transit Data", url: "https://otd.delhi.gov.in", needs: "registered private key for realtime feed", covers: "Delhi bus GTFS-Realtime" },
  { name: "BMTC GTFS (community mirrors)", url: "https://github.com/Vonter/bmtc-gtfs", needs: "none for static; realtime not reliably open", covers: "Bengaluru bus static timetable" },
  { name: "NTES / enquiry.indianrail.gov.in", url: "https://enquiry.indianrail.gov.in", needs: "no public API (official site only)", covers: "authoritative train running status" },
];
