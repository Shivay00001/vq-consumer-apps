/* ============================================================
   VQ Jobs — Supabase configuration (App 4)
   ------------------------------------------------------------
   GO LIVE (about 5 minutes):
     1) Create a FREE project at https://supabase.com
        (Sign up → New project → pick region ap-south-1 Mumbai
        for lowest latency in India → wait ~2 min.)
     2) In the Supabase dashboard open SQL Editor → New query,
        paste the entire contents of schema.sql, and Run it.
     3) Go to Project Settings → API, copy the Project URL and
        the "anon public" key, and paste them below replacing
        the PASTE_YOUR_… placeholders.
     4) Open index.html — the banner switches from
        "demo mode" to "connected", and the app reads/writes
        your real Supabase tables.

   Until then the app runs 100% on bundled demo data and shows
   an honest "demo mode — connect Supabase to go live" banner.
   Nothing is sent anywhere in demo mode.
   ============================================================ */

const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

/* Do not edit below — the app uses this flag to pick demo vs live mode. */
const SUPABASE_CONFIGURED =
  typeof SUPABASE_URL === "string" &&
  typeof SUPABASE_ANON_KEY === "string" &&
  !SUPABASE_URL.includes("PASTE_YOUR") &&
  !SUPABASE_ANON_KEY.includes("PASTE_YOUR") &&
  SUPABASE_URL.startsWith("https://");
