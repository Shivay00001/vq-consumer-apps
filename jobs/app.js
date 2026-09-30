/* ============================================================
   VQ Jobs — app logic (vanilla JS, no build step)
   TWO MODES, chosen by supabase-config.js:
     • LIVE  — SUPABASE_CONFIGURED is true: reads/writes the real
               Supabase tables (employers, jobs, applications).
     • DEMO  — placeholder config: runs 100% on bundled demo data
               (+ localStorage for your own demo posts/applies).
               Nothing leaves the device. Banner says so.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- demo data (used only in demo mode) ---------------- */
  const DEMO_JOBS = [
    { id: "d1", title: "Frontend Developer (React)", company_name: "PixelKart", location: "Bengaluru", type: "full-time", remote: false, salary_text: "₹10–14 LPA", created_at: "2026-09-24", description: "Build responsive web apps with React. 2+ yrs experience.\n\nDemo listing — not a real job." },
    { id: "d2", title: "Python Backend Engineer", company_name: "DataWings", location: "Remote", type: "full-time", remote: true, salary_text: "₹12–18 LPA", created_at: "2026-09-23", description: "FastAPI + Postgres services. 3+ yrs experience.\n\nDemo listing — not a real job." },
    { id: "d3", title: "Digital Marketing Executive", company_name: "BrightAds", location: "Mumbai", type: "full-time", remote: false, salary_text: "₹4–6 LPA", created_at: "2026-09-22", description: "Run Meta/Google ad campaigns, SEO basics.\n\nDemo listing — not a real job." },
    { id: "d4", title: "Data Analyst", company_name: "InsightLabs", location: "Hyderabad", type: "full-time", remote: false, salary_text: "₹8–11 LPA", created_at: "2026-09-21", description: "SQL, dashboards, stakeholder reporting.\n\nDemo listing — not a real job." },
    { id: "d5", title: "UI/UX Design Intern", company_name: "PixelKart", location: "Remote", type: "internship", remote: true, salary_text: "₹15k/month stipend", created_at: "2026-09-20", description: "Figma, design systems, 3-month internship.\n\nDemo listing — not a real job." },
    { id: "d6", title: "Customer Support Specialist", company_name: "HelpDesk Pro", location: "Delhi", type: "full-time", remote: false, salary_text: "₹3–4.5 LPA", created_at: "2026-09-19", description: "Chat + email support, night-shift allowance.\n\nDemo listing — not a real job." },
    { id: "d7", title: "Content Writer (Contract)", company_name: "WordSmiths", location: "Remote", type: "contract", remote: true, salary_text: "₹40k/month", created_at: "2026-09-18", description: "SEO blogs, 6-month contract, renewable.\n\nDemo listing — not a real job." },
    { id: "d8", title: "Delivery Partner Onboarding Lead", company_name: "SwiftKart", location: "Pune", type: "full-time", remote: false, salary_text: "₹5–7 LPA", created_at: "2026-09-17", description: "Onboard gig partners, field ops.\n\nDemo listing — not a real job." },
    { id: "d9", title: "Part-time Accountant", company_name: "LedgerLine", location: "Chennai", type: "part-time", remote: false, salary_text: "₹25k/month", created_at: "2026-09-16", description: "GST filing, Tally, 4 hrs/day.\n\nDemo listing — not a real job." },
    { id: "d10", title: "AI Chatbot Developer", company_name: "VisionQuantech", location: "Remote", type: "contract", remote: true, salary_text: "₹60k/month", created_at: "2026-09-15", description: "Build WhatsApp/AI agents. Contract role.\n\nDemo listing — not a real job." },
  ];
  const DEMO_EXTRA_KEY = "vq_jobs_demo_extra_v1";   // demo posts, this device only
  const DEMO_APPS_KEY = "vq_jobs_demo_apps_v1";     // demo applications, this device only

  /* ---------------- mode setup ---------------- */
  const LIVE = typeof SUPABASE_CONFIGURED !== "undefined" && SUPABASE_CONFIGURED && typeof window.supabase !== "undefined";
  let sb = null;
  if (LIVE) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  const $ = (id) => document.getElementById(id);
  const state = { jobs: [], detailId: null, filters: { q: "", location: "", type: "", remote: false } };

  function setModeUI() {
    const banner = $("modeBanner");
    if (LIVE) {
      banner.className = "mode-banner live";
      banner.innerHTML = "🟢 <strong>Connected to Supabase — real data.</strong> Jobs you post and applications you submit are stored in your Supabase project.";
      $("modeLabel").textContent = "live · Supabase connected";
      $("footMode").textContent = "live mode";
      $("postModeNote").textContent = "(publishes to your Supabase)";
    } else {
      banner.className = "mode-banner demo";
      banner.innerHTML = "🧪 <strong>Demo mode — connect Supabase to go live.</strong> Listings below are fictional sample data; posts & applications stay on this device only. See README for the 5-minute go-live steps.";
      $("modeLabel").textContent = "demo mode";
      $("footMode").textContent = "demo mode";
      $("postModeNote").textContent = "(demo — saved on this device only)";
    }
  }

  function show(view) {
    ["view-browse", "view-detail", "view-post"].forEach((v) => $(v).classList.toggle("active", "view-" + view === v));
    document.querySelectorAll(".navbtn").forEach((b) => b.classList.toggle("active", b.dataset.view === view || (view === "detail" && b.dataset.view === "browse")));
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll(".navbtn").forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));

  /* ---------------- data layer ---------------- */
  function demoExtras() { try { return JSON.parse(localStorage.getItem(DEMO_EXTRA_KEY) || "[]"); } catch { return []; } }

  async function loadJobs() {
    if (LIVE) {
      const { data, error } = await sb
        .from("jobs")
        .select("id,title,location,type,remote,salary_text,description,created_at,employers(company_name,website)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw new Error("Supabase read failed: " + error.message);
      state.jobs = (data || []).map((j) => ({
        id: j.id, title: j.title, location: j.location, type: j.type,
        remote: j.remote, salary_text: j.salary_text, description: j.description,
        created_at: j.created_at,
        company_name: (j.employers && j.employers.company_name) || "Company",
        website: j.employers && j.employers.website,
      }));
    } else {
      state.jobs = [...demoExtras(), ...DEMO_JOBS].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    fillLocationFilter();
    renderJobs();
  }

  /* ---------------- browse ---------------- */
  function fillLocationFilter() {
    const locs = [...new Set(state.jobs.map((j) => j.location))].sort();
    const sel = $("locationFilter"), cur = state.filters.location;
    sel.innerHTML = `<option value="">All locations</option>` +
      locs.map((l) => `<option value="${l}">${l}</option>`).join("");
    sel.value = cur;
  }

  function filteredJobs() {
    const f = state.filters, q = f.q.trim().toLowerCase();
    return state.jobs.filter((j) => {
      const okQ = !q || (j.title + " " + j.company_name + " " + (j.description || "")).toLowerCase().includes(q);
      const okL = !f.location || j.location === f.location;
      const okT = !f.type || j.type === f.type;
      const okR = !f.remote || j.remote;
      return okQ && okL && okT && okR;
    });
  }

  function timeAgo(iso) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
    if (isNaN(d)) return "";
    return d <= 0 ? "today" : d === 1 ? "yesterday" : d + " days ago";
  }

  function renderJobs() {
    const list = filteredJobs();
    $("emptyState").hidden = list.length > 0;
    $("resultMeta").textContent = list.length
      ? `${list.length} job${list.length > 1 ? "s" : ""} · ${LIVE ? "live from Supabase" : "demo data"}`
      : "";
    $("jobList").innerHTML = list.map((j) => `
      <article class="job-card" data-job="${j.id}" tabindex="0" role="button" aria-label="View ${j.title}">
        <div class="company">${j.company_name}</div>
        <h3>${j.title}</h3>
        <div class="meta">
          <span class="tag">${j.type}</span>
          ${j.remote ? `<span class="tag remote">remote</span>` : ""}
          <span>📍 ${j.location}</span>
        </div>
        ${j.salary_text ? `<div class="salary">${j.salary_text}</div>` : ""}
        <div class="posted">Posted ${timeAgo(j.created_at)}</div>
      </article>`).join("");
  }

  $("searchInput").addEventListener("input", (e) => { state.filters.q = e.target.value; renderJobs(); });
  $("locationFilter").addEventListener("change", (e) => { state.filters.location = e.target.value; renderJobs(); });
  $("typeFilter").addEventListener("change", (e) => { state.filters.type = e.target.value; renderJobs(); });
  $("remoteFilter").addEventListener("change", (e) => { state.filters.remote = e.target.checked; renderJobs(); });

  $("jobList").addEventListener("click", (e) => {
    const c = e.target.closest("[data-job]");
    if (c) openDetail(c.dataset.job);
  });
  $("backToBrowse").addEventListener("click", () => show("browse"));

  /* ---------------- detail + apply ---------------- */
  function openDetail(id) {
    const j = state.jobs.find((x) => String(x.id) === String(id));
    if (!j) return;
    state.detailId = j.id;
    $("jobDetail").innerHTML = `
      <div class="company">${j.company_name}${j.website ? ` · <a href="${j.website}" rel="noopener" target="_blank">${j.website}</a>` : ""}</div>
      <h2>${j.title}</h2>
      <div class="meta" style="display:flex;gap:.5rem;flex-wrap:wrap;font-size:.85rem;color:var(--muted)">
        <span class="tag">${j.type}</span>${j.remote ? `<span class="tag remote">remote</span>` : ""}
        <span>📍 ${j.location}</span>${j.salary_text ? `<span><strong>${j.salary_text}</strong></span>` : ""}
      </div>
      <div class="desc" style="margin-top:.8rem">${(j.description || "").replace(/</g, "&lt;")}</div>
      <p class="muted">Posted ${timeAgo(j.created_at)}${LIVE ? " · live listing" : " · demo listing (fictional)"}.</p>`;
    $("applyMsg").hidden = true;
    $("applyForm").reset();
    show("detail");
  }

  function formMsg(el, ok, text) {
    el.hidden = false;
    el.className = "form-msg " + (ok ? "ok" : "err");
    el.textContent = text;
  }

  $("applyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, msg = $("applyMsg");
    const name = f.name.value.trim(), email = f.email.value.trim();
    if (!name || !/.+@.+\..+/.test(email)) {
      formMsg(msg, false, "Please enter your name and a valid email.");
      return;
    }
    const payload = {
      job_id: state.detailId,
      name, email,
      phone: f.phone.value.trim() || null,
      resume_link: f.resume.value.trim() || null,
      cover_note: f.cover.value.trim() || null,
    };
    try {
      if (LIVE) {
        const { error } = await sb.from("applications").insert(payload);
        if (error) throw new Error(error.message);
        formMsg(msg, true, "✅ Application submitted — stored in your Supabase (applications table). The employer can review it there.");
      } else {
        const apps = JSON.parse(localStorage.getItem(DEMO_APPS_KEY) || "[]");
        apps.push({ ...payload, at: new Date().toISOString() });
        localStorage.setItem(DEMO_APPS_KEY, JSON.stringify(apps));
        formMsg(msg, true, "✅ Demo application saved on this device only — nothing was sent anywhere. Connect Supabase to accept real applications.");
      }
      f.reset();
    } catch (err) {
      formMsg(msg, false, "Could not submit: " + err.message);
    }
  });

  /* ---------------- post a job ---------------- */
  $("postForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, msg = $("postMsg");
    const company = f.company.value.trim(), title = f.title.value.trim(),
          location = f.location.value.trim(), description = f.description.value.trim();
    if (!company || !title || !location || !description) {
      formMsg(msg, false, "Company, role title, location and description are required.");
      return;
    }
    const jobData = {
      title, location,
      type: f.type.value,
      remote: f.remote.checked,
      salary_text: f.salary.value.trim() || null,
      description,
    };
    try {
      if (LIVE) {
        // Reuse employer row if the company already posted, else create it.
        let employerId = null;
        const { data: existing } = await sb.from("employers")
          .select("id").eq("company_name", company).limit(1).maybeSingle();
        if (existing) {
          employerId = existing.id;
        } else {
          const { data: emp, error: empErr } = await sb.from("employers")
            .insert({ company_name: company, contact_email: f.contactEmail.value.trim() || null })
            .select("id").single();
          if (empErr) throw new Error(empErr.message);
          employerId = emp.id;
        }
        const { error: jobErr } = await sb.from("jobs").insert({ ...jobData, employer_id: employerId });
        if (jobErr) throw new Error(jobErr.message);
        formMsg(msg, true, "✅ Job published to your Supabase — it now appears in the live listings.");
        await loadJobs();
      } else {
        const extras = demoExtras();
        extras.unshift({
          id: "demo-" + Date.now(), company_name: company,
          created_at: new Date().toISOString(), ...jobData,
        });
        localStorage.setItem(DEMO_EXTRA_KEY, JSON.stringify(extras));
        formMsg(msg, true, "✅ Demo job saved on this device only — it appears in the demo list below. Connect Supabase to publish real listings.");
        await loadJobs();
      }
      f.reset();
    } catch (err) {
      formMsg(msg, false, "Could not publish: " + err.message);
    }
  });

  /* ---------------- init ---------------- */
  setModeUI();
  loadJobs().catch((err) => {
    $("jobList").innerHTML = "";
    $("emptyState").hidden = false;
    $("emptyState").textContent = "Could not load jobs: " + err.message +
      (LIVE ? " Check your Supabase URL/key and that schema.sql was run." : "");
  });
})();
