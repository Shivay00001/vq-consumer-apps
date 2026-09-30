/* ============================================================
   VQ Food — app logic (vanilla JS, no build step)
   Cart is single-restaurant (like real food apps): adding from
   a different restaurant replaces the demo cart (with confirm).
   The "live tracking" view is a TIMED DEMO SIMULATION only —
   every label on the page says so. No real orders exist.
   ============================================================ */
(function () {
  "use strict";

  const CART_KEY = "vq_food_cart_v1";
  const state = {
    cuisine: "All", query: "", vegOnly: false,
    cart: loadCart(),            // {restaurantId, items:{menuId:qty}}
    restId: null,                // restaurant open in menu view
    order: null, timers: [],
  };

  const $ = (id) => document.getElementById(id);
  const views = ["view-list", "view-menu", "view-checkout", "view-track"];
  const fmt = (n) => "₹" + n;
  const restById = (id) => DEMO_RESTAURANTS.find((r) => r.id === id);

  function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '{"restaurantId":null,"items":{}}'); } catch { return { restaurantId: null, items: {} }; } }
  function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); }
  function clearTimers() { state.timers.forEach(clearTimeout); state.timers = []; }

  function cartQty() { return Object.values(state.cart.items).reduce((a, b) => a + b, 0); }
  function cartRestaurant() { return state.cart.restaurantId ? restById(state.cart.restaurantId) : null; }
  function cartLines() {
    const r = cartRestaurant(); if (!r) return [];
    return Object.entries(state.cart.items)
      .map(([mid, qty]) => ({ dish: r.menu.find((m) => m.id === mid), qty }))
      .filter((l) => l.dish && l.qty > 0);
  }
  function cartSubtotal() { return cartLines().reduce((s, l) => s + l.dish.price * l.qty, 0); }

  /* ---------- navigation ---------- */
  function show(viewId) {
    clearTimers();
    views.forEach((v) => $(v).classList.toggle("active", v === viewId));
    window.scrollTo({ top: 0 });
    if (viewId === "view-checkout") renderCheckoutSummary();
    if (viewId === "view-track") startTrackingDemo();
  }

  /* ---------- restaurant list ---------- */
  function renderChips() {
    $("cuisineChips").innerHTML = DEMO_CUISINES.map((c) =>
      `<button class="chip${c === state.cuisine ? " active" : ""}" data-cuisine="${c}">${c}</button>`).join("");
  }

  function filteredRestaurants() {
    const q = state.query.trim().toLowerCase();
    return DEMO_RESTAURANTS.filter((r) => {
      const okC = state.cuisine === "All" || r.cuisines.includes(state.cuisine);
      const hay = (r.name + " " + r.area + " " + r.cuisines.join(" ") + " " + r.menu.map((m) => m.name).join(" ")).toLowerCase();
      return okC && (!q || hay.includes(q));
    });
  }

  function renderRestaurants() {
    const list = filteredRestaurants();
    $("emptyState").hidden = list.length > 0;
    $("restaurantList").innerHTML = list.map((r) => `
      <article class="rest-card" data-rest="${r.id}" tabindex="0" role="button" aria-label="Open ${r.name}">
        <div class="r-icon">${r.icon}</div>
        <div>
          <h3>${r.name}</h3>
          <div class="area">${r.area} · ${r.cuisines.join(", ")}</div>
          <div class="meta"><span class="rating">★ ${r.rating.toFixed(1)}</span><span>🛵 ${r.deliveryTime}</span><span>min ${fmt(r.minOrder)}</span></div>
          <div class="offer-tag">🏷️ ${r.offer}</div>
        </div>
      </article>`).join("");
  }

  /* ---------- menu view ---------- */
  function openRestaurant(id) {
    state.restId = id; state.vegOnly = false; $("vegOnly").checked = false;
    renderMenu(); show("view-menu");
  }

  function renderMenu() {
    const r = restById(state.restId); if (!r) return;
    $("restHero").innerHTML = `
      <div class="r-icon">${r.icon}</div>
      <div><h2 style="margin:.2rem 0">${r.name}</h2>
      <div class="area">${r.area} · ${r.cuisines.join(", ")}</div>
      <div class="meta"><span class="rating">★ ${r.rating.toFixed(1)}</span><span>🛵 ${r.deliveryTime}</span><span>fee ${fmt(r.deliveryFee)}</span></div>
      <div class="offer-tag">🏷️ ${r.offer}</div></div>`;
    const dishes = r.menu.filter((m) => !state.vegOnly || m.veg);
    $("menuList").innerHTML = dishes.map((m) => {
      const qty = (state.cart.restaurantId === r.id && state.cart.items[m.id]) || 0;
      const ctl = qty === 0
        ? `<button class="add-btn" data-add="${m.id}">Add</button>`
        : `<div class="stepper"><button data-dec="${m.id}">−</button><b>${qty}</b><button data-inc="${m.id}">+</button></div>`;
      return `<div class="dish">
        <div class="d-icon">${m.icon}</div>
        <div class="grow"><strong><span class="veg-dot${m.veg ? "" : " nonveg"}"></span>${m.name}</strong>
        <div class="desc">${m.desc}</div><div class="price">${fmt(m.price)}</div></div>
        <div>${ctl}</div></div>`;
    }).join("");
  }

  function addDish(menuId, delta) {
    const r = restById(state.restId);
    if (state.cart.restaurantId && state.cart.restaurantId !== r.id) {
      if (!confirm(`Demo cart has items from ${cartRestaurant().name}. Replace with items from ${r.name}? (demo)`)) return;
      state.cart = { restaurantId: r.id, items: {} };
    }
    state.cart.restaurantId = r.id;
    const q = (state.cart.items[menuId] || 0) + delta;
    if (q <= 0) delete state.cart.items[menuId]; else state.cart.items[menuId] = q;
    if (!Object.keys(state.cart.items).length) state.cart.restaurantId = null;
    saveCart(); renderCartBadge(); renderMenu();
    if ($("cartDrawer").classList.contains("open")) renderDrawer();
  }

  /* ---------- cart ---------- */
  function renderCartBadge() { $("cartCount").textContent = cartQty(); }

  function renderDrawer() {
    const r = cartRestaurant(), lines = cartLines();
    $("drawerItems").innerHTML = !r ? `<p class="empty-state">Cart is empty.</p>`
      : `<p class="muted" style="margin-top:0">From <strong>${r.name}</strong> (demo)</p>` +
        lines.map((l) => `
        <div class="cart-line"><div class="grow"><strong>${l.dish.name}</strong><br>${l.qty} × ${fmt(l.dish.price)}</div>
        <div class="stepper"><button data-cdec="${l.dish.id}">−</button><b>${l.qty}</b><button data-cinc="${l.dish.id}">+</button></div></div>`).join("") +
        `<p><strong>Subtotal: ${fmt(cartSubtotal())}</strong> <span class="muted">(demo)</span></p>`;
  }
  function openDrawer() { renderDrawer(); $("cartDrawer").classList.add("open"); $("drawerBackdrop").hidden = false; }
  function closeDrawer() { $("cartDrawer").classList.remove("open"); $("drawerBackdrop").hidden = true; }

  /* ---------- checkout ---------- */
  function renderCheckoutSummary() {
    const r = cartRestaurant(), lines = cartLines();
    const sub = cartSubtotal(), total = sub + (r ? r.deliveryFee : 0);
    $("orderSummary").innerHTML = `<strong>Demo order from ${r ? r.name : "—"}</strong><br>` +
      lines.map((l) => `${l.qty} × ${l.dish.name} — ${fmt(l.dish.price * l.qty)}`).join("<br>") +
      `<br>Delivery fee: ${fmt(r ? r.deliveryFee : 0)}<br><strong>Total: ${fmt(total)}</strong> (demo, no charge)`;
  }

  $("checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, err = $("formError");
    if (!f.name.value.trim() || !/^[0-9]{10}$/.test(f.phone.value.trim()) || !f.address.value.trim()) {
      err.hidden = false;
      err.textContent = "Please fill name, a 10-digit phone number and address. (Demo validation only.)";
      return;
    }
    err.hidden = true;
    const r = cartRestaurant();
    state.order = {
      id: "VQF-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      restaurant: r.name, items: cartLines(),
      total: cartSubtotal() + r.deliveryFee, name: f.name.value.trim(),
      placedAt: new Date().toLocaleString("en-IN"),
    };
    state.cart = { restaurantId: null, items: {} };
    saveCart(); renderCartBadge();
    show("view-track");
  });

  /* ---------- DEMO tracking simulation ---------- */
  const DEMO_RIDERS = ["Aarav (demo)", "Priya (demo)", "Rohan (demo)", "Sana (demo)"];
  function startTrackingDemo() {
    const o = state.order; if (!o) return;
    $("orderId").textContent = o.id;
    const rider = DEMO_RIDERS[Math.floor(Math.random() * DEMO_RIDERS.length)];
    let step = 0;
    const paint = () => {
      $("trackTimeline").innerHTML = DEMO_TRACK_STAGES.map((s, i) => `
        <li class="${i < step ? "done" : i === step ? "active-now" : ""}">${s.label}
          <span class="t-note">${i <= step ? s.note + " (simulated)" : "pending"}</span></li>`).join("");
      $("riderCard").innerHTML = step >= 2 && step < DEMO_TRACK_STAGES.length - 1
        ? `🛵 <strong>${rider}</strong> is on the way with your demo order.<br><span class="muted">Fictional rider — simulation only, no real delivery.</span>`
        : step >= DEMO_TRACK_STAGES.length - 1
        ? `✅ Demo order complete. <span class="muted">Nothing was delivered; this was a simulation.</span>`
        : `👨‍🍳 <strong>${o.restaurant}</strong> is handling your demo order… <span class="muted">(simulated)</span>`;
    };
    paint();
    // Advance one stage every ~4 seconds — clearly a demo animation.
    for (let i = 1; i < DEMO_TRACK_STAGES.length; i++) {
      state.timers.push(setTimeout(() => { step = i; paint(); }, i * 4000));
    }
    $("replayBtn").onclick = () => startTrackingDemo();
  }

  /* ---------- events ---------- */
  $("cuisineChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cuisine]");
    if (b) { state.cuisine = b.dataset.cuisine; renderChips(); renderRestaurants(); }
  });
  $("searchInput").addEventListener("input", (e) => { state.query = e.target.value; renderRestaurants(); });
  $("restaurantList").addEventListener("click", (e) => {
    const c = e.target.closest("[data-rest]"); if (c) openRestaurant(c.dataset.rest);
  });
  $("backToList").addEventListener("click", () => show("view-list"));
  $("vegOnly").addEventListener("change", (e) => { state.vegOnly = e.target.checked; renderMenu(); });
  $("backToMenu").addEventListener("click", () => show("view-menu"));

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]"), inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
    const cinc = e.target.closest("[data-cinc]"), cdec = e.target.closest("[data-cdec]");
    if (add) addDish(add.dataset.add, 1);
    if (inc) addDish(inc.dataset.inc, 1);
    if (dec) addDish(dec.dataset.dec, -1);
    if (cinc || cdec) {
      const id = (cinc || cdec).dataset.cinc || (cinc || cdec).dataset.cdec;
      const r = cartRestaurant(); state.restId = state.restId; // drawer edits keep current restaurant context
      const q = (state.cart.items[id] || 0) + (cinc ? 1 : -1);
      if (q <= 0) delete state.cart.items[id]; else state.cart.items[id] = q;
      if (!Object.keys(state.cart.items).length) state.cart.restaurantId = null;
      saveCart(); renderCartBadge(); renderDrawer();
      if (state.restId) renderMenu();
    }
  });

  $("cartBtn").addEventListener("click", openDrawer);
  $("closeDrawer").addEventListener("click", closeDrawer);
  $("drawerBackdrop").addEventListener("click", closeDrawer);
  $("drawerCheckout").addEventListener("click", () => {
    if (!cartQty()) { alert("Demo cart is empty — add a dish first."); return; }
    closeDrawer(); show("view-checkout");
  });
  $("newOrderBtn").addEventListener("click", () => { state.order = null; show("view-list"); });

  /* ---------- init ---------- */
  renderChips(); renderRestaurants(); renderCartBadge();
})();
