/* ============================================================
   VQ Transit — app logic (vanilla JS, no build step)
   HONESTY CONTRACT: everything here is computed from the
   STATIC demo timetable in data.js. There is deliberately NO
   live-position code — no fake "live" badges, no simulated
   moving buses. "Next departures" = static schedule vs the
   device clock, and the UI says exactly that.
   ============================================================ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const ALL_STOPS = [
    ...DEMO_STATIONS.map((s) => ({ ...s, kind: "train" })),
    ...DEMO_BUS_STOPS.map((s) => ({ ...s, kind: "bus" })),
  ];
  const stopName = (code) => (ALL_STOPS.find((s) => s.code === code) || { name: code }).name;
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const fmtClock = (mins) => String(Math.floor(mins / 60) % 24).padStart(2, "0") + ":" + String(mins % 60).padStart(2, "0");

  /* ---------- tabs ---------- */
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll(".tabpanel").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      $("tab-" + t.dataset.tab).classList.add("active");
      window.scrollTo({ top: 0 });
    })
  );

  /* ---------- find routes ---------- */
  function fillStopSelect(sel, includeTrains, includeBuses) {
    const opts = ALL_STOPS.filter((s) =>
      (s.kind === "train" && includeTrains) || (s.kind === "bus" && includeBuses));
    sel.innerHTML = opts.map((s) =>
      `<option value="${s.code}">${s.name} (${s.code})${s.kind === "bus" ? " — bus" : ""}</option>`).join("");
  }
  fillStopSelect($("fromSel"), true, true);
  fillStopSelect($("toSel"), true, true);
  $("toSel").selectedIndex = 1;

  function trainLegs(from, to) {
    return DEMO_TRAINS.map((t) => {
      const fi = t.stops.findIndex((s) => s.code === from);
      const ti = t.stops.findIndex((s) => s.code === to);
      if (fi === -1 || ti === -1 || ti <= fi) return null;
      const a = t.stops[fi], b = t.stops[ti];
      return { kind: "Train", label: `${t.no} · ${t.name}`, days: t.days,
               dep: a.dep, arr: b.arr, classes: t.classes,
               sub: `${stopName(from)} → ${stopName(to)} · runs ${t.days}` };
    }).filter(Boolean);
  }
  function busLegs(from, to) {
    return DEMO_BUSES.map((b) => {
      const fi = b.stops.findIndex((s) => s.code === from);
      const ti = b.stops.findIndex((s) => s.code === to);
      if (fi === -1 || ti === -1 || ti <= fi) return null;
      return { kind: "Bus", label: `Route ${b.route} · ${b.operator}`, days: "Daily",
               dep: b.departures, arr: null, fare: b.fare,
               sub: `${stopName(from)} → ${stopName(to)} · ${b.city} · flat fare ₹${b.fare} (demo)` };
    }).filter(Boolean);
  }

  $("searchBtn").addEventListener("click", () => {
    const from = $("fromSel").value, to = $("toSel").value;
    const box = $("searchResults");
    if (from === to) { box.innerHTML = `<p class="empty">Pick two different stations/stops.</p>`; return; }
    const legs = [...trainLegs(from, to), ...busLegs(from, to)];
    if (!legs.length) {
      box.innerHTML = `<p class="empty">No direct demo route found between ${stopName(from)} and ${stopName(to)}.<br><span class="muted">Sample dataset covers only a few routes — this is expected in the demo.</span></p>`;
      return;
    }
    box.innerHTML = legs.map((l) => `
      <div class="result-card">
        <div class="svc"><strong>${l.kind === "Train" ? "🚆" : "🚌"} ${l.label}</strong><span class="badge">${l.kind}</span></div>
        <div class="sub">${l.sub}</div>
        ${l.kind === "Train"
          ? `<div class="times">${l.dep || "—"} → ${l.arr || "—"}</div>
             <div class="sub">Demo fares: ${Object.entries(l.classes).map(([c, f]) => f ? `${c} ₹${f}` : `${c} n/a`).join(" · ")}</div>`
          : `<div class="sub" style="margin-top:.4rem">Sample departures today: ${l.dep.slice(0, 6).join(", ")}${l.dep.length > 6 ? ", …" : ""}</div>`}
        <div class="sub" style="margin-top:.35rem">⚠️ Static sample timetable — not live, not for real journey planning.</div>
      </div>`).join("");
  });

  /* ---------- next departures (static schedule × device clock) ---------- */
  const stationSel = $("stationSel");
  stationSel.innerHTML =
    `<optgroup label="Railway stations">` +
    DEMO_STATIONS.map((s) => `<option value="T:${s.code}">${s.name} (${s.code})</option>`).join("") +
    `</optgroup><optgroup label="Bus stops">` +
    DEMO_BUS_STOPS.map((s) => `<option value="B:${s.code}">${s.name}, ${s.city} — bus</option>`).join("") +
    `</optgroup>`;

  function renderNext() {
    const [kind, code] = stationSel.value.split(":");
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    const rows = [];
    if (kind === "T") {
      DEMO_TRAINS.forEach((t) => {
        const st = t.stops.find((s) => s.code === code);
        if (st && st.dep) rows.push({ label: `${t.no} · ${t.name}`, time: st.dep, kind: "Train" });
      });
    } else {
      DEMO_BUSES.forEach((b) => {
        if (b.stops.some((s) => s.code === code))
          b.departures.forEach((d) => rows.push({ label: `Route ${b.route} · ${b.operator}`, time: d, kind: "Bus" }));
      });
    }
    const upcoming = rows
      .map((r) => ({ ...r, mins: toMin(r.time) }))
      .filter((r) => r.mins >= nowMin - 5)
      .sort((a, b) => a.mins - b.mins)
      .slice(0, 8);
    $("nextResults").innerHTML = upcoming.length
      ? upcoming.map((r) => {
          const wait = r.mins - nowMin;
          return `<div class="dep-row"><div><div class="t">${r.time}</div><div class="sub">${r.kind === "Train" ? "🚆" : "🚌"} ${r.label}</div></div>
            <div class="in">${wait <= 0 ? "due now*" : "in ~" + wait + " min*"}</div></div>`;
        }).join("") +
        `<p class="muted">*From the static sample timetable vs your device clock (${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}). Not live — buses/trains may not actually run at these times.</p>`
      : `<p class="empty">No more sample departures today from ${stopName(code)}.<br><span class="muted">Static demo timetable only.</span></p>`;
  }
  stationSel.addEventListener("change", renderNext);
  renderNext();

  /* ---------- fare calculator ---------- */
  const fareService = $("fareService");
  const services = [
    ...DEMO_TRAINS.map((t) => ({ id: "T" + t.no, label: `🚆 ${t.no} · ${t.name}`, classes: t.classes })),
    ...DEMO_BUSES.map((b) => ({ id: "B" + b.route, label: `🚌 Route ${b.route} · ${b.operator} (${b.city})`, classes: { "Flat fare": b.fare } })),
  ];
  fareService.innerHTML = `<option value="">— choose —</option>` +
    services.map((s) => `<option value="${s.id}">${s.label}</option>`).join("");

  fareService.addEventListener("change", () => {
    const svc = services.find((s) => s.id === fareService.value);
    const cls = $("fareClass");
    if (!svc) { cls.innerHTML = ""; $("fareResult").innerHTML = `<span class="muted">Select a service to see its demo fare.</span>`; return; }
    cls.innerHTML = Object.keys(svc.classes).map((c) => `<option>${c}</option>`).join("");
    paintFare(svc, cls.value);
    cls.onchange = () => paintFare(svc, cls.value);
  });
  function paintFare(svc, c) {
    const f = svc.classes[c];
    $("fareResult").innerHTML = f
      ? `Demo fare: <strong>₹${f}</strong> <span class="muted">(${c} · ${svc.label}) — fictional, not an official tariff.</span>`
      : `<span class="muted">No demo fare for this class.</span>`;
  }

  /* ---------- timetables ---------- */
  $("trainSel").innerHTML = DEMO_TRAINS.map((t, i) => `<option value="${i}">${t.no} · ${t.name}</option>`).join("");
  function renderTrain() {
    const t = DEMO_TRAINS[+$("trainSel").value];
    $("trainSchedule").innerHTML = `<div class="result-card">
      <div class="svc"><strong>🚆 ${t.no} · ${t.name}</strong><span class="badge">${t.days}</span></div>
      <table class="stops-table"><tr><th>Station</th><th>Arr</th><th>Dep</th></tr>
      ${t.stops.map((s) => `<tr><td>${stopName(s.code)} (${s.code})${s.nextDay ? " <span class='muted'>+1 day</span>" : ""}</td><td>${s.arr || "—"}</td><td>${s.dep || "—"}</td></tr>`).join("")}
      </table><div class="sub" style="margin-top:.4rem">⚠️ Sample timetable for demo — verify real timings on the official NTES site.</div></div>`;
  }
  $("trainSel").addEventListener("change", renderTrain); renderTrain();

  $("busSel").innerHTML = DEMO_BUSES.map((b, i) => `<option value="${i}">Route ${b.route} · ${b.operator} (${b.city})</option>`).join("");
  function renderBus() {
    const b = DEMO_BUSES[+$("busSel").value];
    $("busSchedule").innerHTML = `<div class="result-card">
      <div class="svc"><strong>🚌 Route ${b.route} · ${b.operator}</strong><span class="badge">${b.city}</span></div>
      <div class="sub">Flat demo fare ₹${b.fare} · Stops: ${b.stops.map((s) => stopName(s.code) + " (" + s.t + ")").join(" → ")}</div>
      <div class="sub" style="margin-top:.4rem"><strong>Sample departures:</strong> ${b.departures.join(", ")}</div>
      <div class="sub" style="margin-top:.35rem">⚠️ Static sample data — not live. Real bus times vary with traffic.</div></div>`;
  }
  $("busSel").addEventListener("change", renderBus); renderBus();
})();
