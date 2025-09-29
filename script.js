/* script.js
   Handles: theme toggle, product rendering, add-to-cart, cart sidebar,
   login/signup modal (mock), persistence via localStorage.
*/

(() => {
  // ---------- Data ----------
  const PRODUCTS = [
  { id: "p1", title: "Elegant Evening Gown", price: 3499, rating: 4.8, category: "dresses",
    img: "images/dress1.jpg",
    desc: "Flowing silhouette, premium fabric." },
  { id: "p2", title: "Summer Sundress", price: 1299, rating: 4.5, category: "dresses",
    img: "images/dress2.jpg",
    desc: "Breathable, casual summer style." },
  { id: "p3", title: "Silk Blouse", price: 999, rating: 4.3, category: "tops",
    img: "images/dress3.jpg",
    desc: "Lightweight and luxe." },
  { id: "p4", title: "Trench Coat", price: 4999, rating: 4.7, category: "outerwear",
    img: "images/dress4.jpg",
    desc: "Classic polished finish." }
];

    

  // Small placeholder image generator (data URL with gradient)
  function placeholderDataUrl(seed = 1) {
    const hue = 20 + (seed * 37) % 200;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
      <defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='hsl(${hue} 80% 60%)' /><stop offset='1' stop-color='hsl(${(hue+40)%360} 80% 45%)' /></linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)' />
      <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='36' fill='rgba(255,255,255,0.85)' font-family='Inter,Arial'>Product</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  PRODUCTS.forEach((p, i) => p.img = p.img || placeholderDataUrl(i+3));

  // ---------- Utilities ----------
  const $ = (s, ctx=document) => ctx.querySelector(s);
  const $$ = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));
  const formatCurrency = v => `₹${Number(v).toLocaleString('en-IN')}`;

  // ---------- Theme Toggle ----------
  const themeBtn = $("#theme-toggle");
  const body = document.body;
  const storedTheme = localStorage.getItem("theme") || "dark";
  if (storedTheme === "light") body.classList.add("light");
  updateThemeButton();

  themeBtn.addEventListener("click", () => {
    body.classList.toggle("light");
    localStorage.setItem("theme", body.classList.contains("light") ? "light" : "dark");
    updateThemeButton();
  });

  function updateThemeButton() {
    if (body.classList.contains("light")) themeBtn.textContent = "🌙 Dark Mode";
    else themeBtn.textContent = "☀️ Light Mode";
  }

  // ---------- Mobile Nav Toggle ----------
  const navToggle = $("#nav-toggle"), mobileNav = $("#mobile-nav");
  navToggle.addEventListener("click", () => {
    const open = mobileNav.getAttribute("aria-hidden") === "true";
    mobileNav.setAttribute("aria-hidden", !open);
    mobileNav.classList.toggle("open");
  });

  // ---------- Render Products ----------
  const productsRoot = $("#products");
  const categoryFilter = $("#category-filter");
  const sortSelect = $("#sort-by");

  function renderProducts() {
    const cat = categoryFilter.value;
    const sort = sortSelect.value;
    let list = PRODUCTS.slice();
    if (cat !== "all") list = list.filter(p => p.category === cat);
    if (sort === "price-asc") list.sort((a,b)=>a.price-b.price);
    if (sort === "price-desc") list.sort((a,b)=>b.price-a.price);

    productsRoot.innerHTML = "";
    for (const p of list) {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="media"><img src="${p.img}" alt="${p.title}"></div>
        <div class="content">
          <h3>${p.title}</h3>
          <div class="muted">${p.desc}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem">
            <div class="price">${formatCurrency(p.price)}</div>
            <div class="rating">⭐ ${p.rating}</div>
          </div>
          <div class="actions">
            <div class="qty">
              <label class="muted" style="font-size:.85rem">Qty</label>
              <input type="number" min="1" value="1" class="qty-input" aria-label="Quantity for ${p.title}">
            </div>
            <div style="display:flex;gap:.4rem">
              <button class="btn btn-ghost view-btn">View</button>
              <button class="btn btn-primary add-btn" data-id="${p.id}">Add to cart</button>
            </div>
          </div>
        </div>
      `;
      productsRoot.appendChild(card);
    }
    attachProductListeners();
  }

  categoryFilter.addEventListener("change", renderProducts);
  sortSelect.addEventListener("change", renderProducts);

  // ---------- CART ----------
  const CART_KEY = "elegant_cart_v1";
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}"); // {productId: qty}

  const cartToggle = $("#cart-toggle");
  const cartEl = $("#cart");
  const overlay = $("#overlay");
  const cartCount = $("#cart-count");
  const cartItemsRoot = $("#cart-items");
  const cartTotalEl = $("#cart-total");
  const closeCartBtn = $("#close-cart");
  const clearCartBtn = $("#clear-cart");
  const checkoutBtn = $("#checkout");

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function getCartCount() {
    return Object.values(cart).reduce((s,n)=>s + Number(n), 0);
  }

  function updateCartUI() {
    cartCount.textContent = getCartCount();
    // render items
    cartItemsRoot.innerHTML = "";
    const ids = Object.keys(cart);
    if (!ids.length) {
      cartItemsRoot.innerHTML = `<p class="muted">Your cart is empty.</p>`;
      cartTotalEl.textContent = formatCurrency(0);
      return;
    }
    let total = 0;
    for (const id of ids) {
      const qty = Number(cart[id]);
      const p = PRODUCTS.find(x => x.id === id);
      const itemTotal = p.price * qty;
      total += itemTotal;

      const node = document.createElement("div");
      node.className = "cart-item";
      node.innerHTML = `
        <img src="${p.img}" alt="${p.title}">
        <div style="flex:1">
          <strong>${p.title}</strong>
          <div class="muted" style="font-size:.9rem">${formatCurrency(p.price)} × ${qty} = <span class="price">${formatCurrency(itemTotal)}</span></div>
          <div style="margin-top:.5rem;display:flex;gap:.5rem;align-items:center">
            <button class="btn btn-ghost small dec" data-id="${id}">-</button>
            <span class="muted">${qty}</span>
            <button class="btn btn-ghost small inc" data-id="${id}">+</button>
            <button class="btn btn-ghost small remove" data-id="${id}">Remove</button>
          </div>
        </div>
      `;
      cartItemsRoot.appendChild(node);
    }
    cartTotalEl.textContent = formatCurrency(total);
    // attach listeners for inc/dec/remove
    for (const b of $$(".inc", cartItemsRoot)) b.addEventListener("click", () => changeQty(b.dataset.id, 1));
    for (const b of $$(".dec", cartItemsRoot)) b.addEventListener("click", () => changeQty(b.dataset.id, -1));
    for (const b of $$(".remove", cartItemsRoot)) b.addEventListener("click", () => removeFromCart(b.dataset.id));
  }

  function changeQty(id, delta) {
    cart[id] = Math.max(0, (Number(cart[id]||0) + delta));
    if (cart[id] <= 0) delete cart[id];
    saveCart();
  }

  function removeFromCart(id) {
    delete cart[id];
    saveCart();
  }

  function openCart() {
    cartEl.classList.add("open");
    cartEl.setAttribute("aria-hidden", "false");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    cartEl.classList.remove("open");
    cartEl.setAttribute("aria-hidden", "true");
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  cartToggle.addEventListener("click", () => {
    if (cartEl.classList.contains("open")) closeCart();
    else { updateCartUI(); openCart(); }
  });
  closeCartBtn.addEventListener("click", closeCart);
  overlay.addEventListener("click", () => { closeCart(); closeAllModals(); });

  clearCartBtn.addEventListener("click", () => {
    cart = {};
    saveCart();
  });

  checkoutBtn.addEventListener("click", () => {
    if (!Object.keys(cart).length) { alert("Your cart is empty."); return; }
    // Mock checkout
    alert("Checkout is a demo — thanks for trying this template!");
    cart = {};
    saveCart();
    closeCart();
  });

  // Add to cart from products
  function attachProductListeners() {
    for (const btn of $$(".add-btn")) {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.id;
        // find qty input in same card
        const card = btn.closest(".card");
        const qtyInput = card.querySelector(".qty-input");
        let qty = Number(qtyInput?.value) || 1;
        if (qty < 1) qty = 1;
        cart[id] = (Number(cart[id]||0) + qty);
        saveCart();
        // little added animation feedback
        btn.textContent = "Added ✓";
        setTimeout(()=> btn.textContent = "Add to cart", 900);
      });
    }
    for (const b of $$(".view-btn")) {
      b.addEventListener("click", () => alert("Demo product view — implement product page as a next step."));
    }
  }

  // ---------- Persistence & init ----------
  function init() {
    // render
    renderProducts();
    // load cart from storage
    cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    updateCartUI();
    // year
    $("#year").textContent = new Date().getFullYear();
  }
  init();

  // ---------- Simple Login / Signup Modals (mock) ----------
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("aria-hidden", "false");
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    el.focus();
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("aria-hidden", "true");
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }
  function closeAllModals() {
    for (const m of $$(".modal")) m.setAttribute("aria-hidden", "true");
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  $("#login-btn").addEventListener("click", () => openModal("login-modal"));
  $("#signup-btn").addEventListener("click", () => openModal("signup-modal"));
  $("#open-signup").addEventListener("click", () => { closeModal("login-modal"); openModal("signup-modal"); });

  // modal close buttons
  for (const c of $$(".modal-close")) {
    c.addEventListener("click", (e) => {
      const id = c.dataset.modal || c.closest(".modal")?.id;
      if (id) closeModal(id);
    });
  }

  // simple forms (mock)
  $("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    // mock auth: accept anything
    alert("Logged in (demo).");
    closeModal("login-modal");
  });
  $("#signup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Account created (demo).");
    closeModal("signup-modal");
  });

  // Esc to close modals/cart
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCart();
      closeAllModals();
    }
  });

  // Newsletter mock
  $("#newsletter").addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Thanks for subscribing!");
    e.target.reset();
  });

  // keep cart UI in sync on storage changes (helpful if user uses multiple tabs)
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) {
      cart = JSON.parse(e.newValue || "{}");
      updateCartUI();
    }
    if (e.key === "theme") {
      if (localStorage.getItem("theme")==="light") body.classList.add("light");
      else body.classList.remove("light");
      updateThemeButton();
    }
  });
})();
