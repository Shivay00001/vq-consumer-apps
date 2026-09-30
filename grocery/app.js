/* ============================================================
   VQ Grocery — app logic (vanilla JS, no build step)
   Cart persists in localStorage on this device only.
   Checkout is a MOCK flow: no real order is created, no real
   payment is processed. All copy on the page says so.
   ============================================================ */
(function () {
  "use strict";

  const CART_KEY = "vq_grocery_cart_v1";
  const state = {
    category: "all",
    query: "",
    cart: loadCart(),
    order: null,       // last demo order {id, items, total, name, pay}
    simStep: 0,
  };

  const $ = (id) => document.getElementById(id);
  const views = ["view-shop", "view-cart", "view-checkout", "view-confirm"];
  const fmt = (n) => "₹" + n.toFixed(2).replace(/\.00$/, "");

  /* ---------- cart persistence ---------- */
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  }
  const cartQty = () => Object.values(state.cart).reduce((a, b) => a + b, 0);
  const cartLines = () =>
    Object.entries(state.cart)
      .map(([id, qty]) => ({ product: DEMO_PRODUCTS.find((p) => p.id === id), qty }))
      .filter((l) => l.product && l.qty > 0);
  const cartTotal = () => cartLines().reduce((s, l) => s + l.product.price * l.qty, 0);

  /* ---------- navigation ---------- */
  function show(viewId) {
    views.forEach((v) => $(v).classList.toggle("active", v === viewId));
    window.scrollTo({ top: 0 });
    if (viewId === "view-cart") renderCart();
    if (viewId === "view-checkout") renderCheckoutSummary();
    if (viewId === "view-confirm") renderConfirm();
  }

  /* ---------- shop ---------- */
  function renderChips() {
    $("categoryChips").innerHTML = DEMO_CATEGORIES.map((c) =>
      `<button class="chip${c.id === state.category ? " active" : ""}" data-cat="${c.id}">${c.icon} ${c.label}</button>`
    ).join("");
  }

  function renderOffers() {
    $("offers").innerHTML = DEMO_OFFERS.map((o) => `<div class="offer">🎁 ${o}</div>`).join("");
  }

  function filteredProducts() {
    const q = state.query.trim().toLowerCase();
    return DEMO_PRODUCTS.filter((p) => {
      const okCat = state.category === "all" || p.category === state.category;
      const okQ = !q || (p.name + " " + p.desc).toLowerCase().includes(q);
      return okCat && okQ;
    });
  }

  function renderProducts() {
    const list = filteredProducts();
    $("emptyState").hidden = list.length > 0;
    $("productGrid").innerHTML = list.map((p) => {
      const qty = state.cart[p.id] || 0;
      const off = Math.round((1 - p.price / p.mrp) * 100);
      const qtyCtl = qty === 0
        ? `<button class="add-btn" data-add="${p.id}">Add</button>`
        : `<div class="stepper"><button data-dec="${p.id}" aria-label="Decrease">−</button><b>${qty}</b><button data-inc="${p.id}" aria-label="Increase">+</button></div>`;
      return `<article class="card">
        <div class="p-icon">${p.icon}</div>
        <h3>${p.name}</h3>
        <div class="unit">${p.unit}</div>
        <div class="stars">★ ${p.rating.toFixed(1)}</div>
        <div class="price-row"><span class="price">${fmt(p.price)}</span><span class="mrp">${fmt(p.mrp)}</span><span class="off">${off}% off</span></div>
        <div class="qty-row">${qtyCtl}</div>
      </article>`;
    }).join("");
  }

  /* ---------- cart drawer + page ---------- */
  function renderCartBadge() { $("cartCount").textContent = cartQty(); }

  function renderCart() {
    const lines = cartLines();
    if (!lines.length) {
      $("cartItems").innerHTML = `<p class="empty-state">Your demo cart is empty.<br>Add something tasty from the shop.</p>`;
      $("cartSummary").innerHTML = "";
      $("goCheckout").disabled = true;
      return;
    }
    $("goCheckout").disabled = false;
    $("cartItems").innerHTML = lines.map((l) => `
      <div class="cart-line">
        <div class="p-icon">${l.product.icon}</div>
        <div class="grow"><strong>${l.product.name}</strong><span>${fmt(l.product.price)} × ${l.qty} ${l.product.unit}</span></div>
        <div class="stepper"><button data-dec="${l.product.id}">−</button><b>${l.qty}</b><button data-inc="${l.product.id}">+</button></div>
      </div>`).join("");
    const sub = cartTotal(), del = sub >= 199 || sub === 0 ? 0 : 25;
    $("cartSummary").innerHTML = `
      <div class="row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
      <div class="row"><span>Delivery ${sub >= 199 ? "(demo free ≥ ₹199)" : ""}</span><span>${del === 0 ? "FREE" : fmt(del)}</span></div>
      <div class="row total"><span>Total</span><span>${fmt(sub + del)}</span></div>
      <p class="muted" style="margin:.4rem 0 0">Demo totals only — no real charge.</p>`;
  }

  function renderDrawer() {
    const lines = cartLines();
    $("drawerItems").innerHTML = lines.length
      ? lines.map((l) => `
        <div class="cart-line"><div class="p-icon">${l.product.icon}</div>
        <div class="grow"><strong>${l.product.name}</strong><span>${l.qty} × ${fmt(l.product.price)}</span></div>
        <div class="stepper"><button data-dec="${l.product.id}">−</button><b>${l.qty}</b><button data-inc="${l.product.id}">+</button></div>
        </div>`).join("")
      : `<p class="empty-state">Cart is empty.</p>`;
  }

  function openDrawer() { renderDrawer(); $("cartDrawer").classList.add("open"); $("drawerBackdrop").hidden = false; $("cartDrawer").setAttribute("aria-hidden", "false"); }
  function closeDrawer() { $("cartDrawer").classList.remove("open"); $("drawerBackdrop").hidden = true; $("cartDrawer").setAttribute("aria-hidden", "true"); }

  function bump(id, delta) {
    const q = (state.cart[id] || 0) + delta;
    if (q <= 0) delete state.cart[id]; else state.cart[id] = q;
    saveCart(); renderCartBadge(); renderProducts();
    if ($("view-cart").classList.contains("active")) renderCart();
    if ($("cartDrawer").classList.contains("open")) renderDrawer();
  }

  /* ---------- checkout ---------- */
  function renderCheckoutSummary() {
    const lines = cartLines();
    const sub = cartTotal(), del = sub >= 199 ? 0 : 25;
    $("orderSummary").innerHTML = `<strong>Demo order summary</strong><br>` +
      lines.map((l) => `${l.qty} × ${l.product.name} — ${fmt(l.product.price * l.qty)}`).join("<br>") +
      `<br><strong>Total: ${fmt(sub + del)}</strong> (demo, no charge)`;
  }

  $("checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, err = $("formError");
    const name = f.name.value.trim(), phone = f.phone.value.trim(), addr = f.address.value.trim();
    const pay = f.pay.value;
    if (!name || !/^[0-9]{10}$/.test(phone) || !addr) {
      err.hidden = false;
      err.textContent = "Please fill name, a 10-digit phone number and address. (Demo validation only.)";
      return;
    }
    err.hidden = true;
    const sub = cartTotal(), del = sub >= 199 ? 0 : 25;
    state.order = {
      id: "VQG-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      items: cartLines(), total: sub + del, name, pay,
      placedAt: new Date().toLocaleString("en-IN"),
    };
    state.simStep = 0;
    state.cart = {}; saveCart(); renderCartBadge();
    show("view-confirm");
  });

  document.querySelectorAll('input[name="pay"]').forEach((r) =>
    r.addEventListener("change", () => { $("upiMock").hidden = document.querySelector('input[name="pay"]:checked').value !== "upi"; })
  );

  /* ---------- confirmation + demo timeline ---------- */
  const STAGES = ["Order placed", "Packed", "Out for delivery", "Delivered"];
  function renderConfirm() {
    const o = state.order;
    if (!o) return;
    $("orderId").textContent = o.id;
    $("statusTimeline").innerHTML = STAGES.map((s, i) => `
      <li class="${i <= state.simStep ? "done" : ""}">${s}
        <span class="t-time">${i === 0 ? o.placedAt : i <= state.simStep ? "simulated (demo)" : "pending"}</span>
      </li>`).join("");
    $("simulateBtn").disabled = state.simStep >= STAGES.length - 1;
  }
  $("simulateBtn").addEventListener("click", () => {
    if (state.simStep < STAGES.length - 1) { state.simStep++; renderConfirm(); }
  });
  $("newOrderBtn").addEventListener("click", () => { state.order = null; show("view-shop"); });

  /* ---------- events ---------- */
  $("categoryChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (b) { state.category = b.dataset.cat; renderChips(); renderProducts(); }
  });
  $("searchInput").addEventListener("input", (e) => { state.query = e.target.value; renderProducts(); });

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]"), inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
    if (add) bump(add.dataset.add, 1);
    if (inc) bump(inc.dataset.inc, 1);
    if (dec) bump(dec.dataset.dec, -1);
  });

  $("cartBtn").addEventListener("click", openDrawer);
  $("closeDrawer").addEventListener("click", closeDrawer);
  $("drawerBackdrop").addEventListener("click", closeDrawer);
  $("drawerCheckout").addEventListener("click", () => { closeDrawer(); show("view-checkout"); });
  $("backToShop").addEventListener("click", () => show("view-shop"));
  $("backToCart").addEventListener("click", () => show("view-cart"));
  $("goCheckout").addEventListener("click", () => show("view-checkout"));

  /* ---------- init ---------- */
  renderChips(); renderOffers(); renderProducts(); renderCartBadge();
})();
