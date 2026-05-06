/* ═══════════════════════════════════════════════════════════
   dbitesofbliss — custom.js
   Features:
   - Cart system (localStorage)
   - Cart Drawer (Mini POS UI)
   - WhatsApp Checkout (auto message)
   - Pre-Order Form handling
   - Scroll reveal
   - Menu filter
   ═══════════════════════════════════════════════════════════ */

// ─────────────────────────────────────
// 1. WHATSAPP NUMBER CONFIG
//    Ganti nomor ini dengan nomor WA aktif kamu (format internasional, tanpa +)
// ─────────────────────────────────────
const WA_NUMBER = "6285266744688";

// ─────────────────────────────────────
// 2. PRODUCT EMOJI MAP
//    Emoji untuk tampilan di cart drawer
// ─────────────────────────────────────
const PRODUCT_EMOJIS = {
  "Brownies Classic":       "🍫",
  "Brownies Matcha":        "🍵",
  "Brownies Cream Cheese":  "🧀",
  "Brownies Fudgy Original":"🍫",
  "Brownies Box Gift":      "🎂",
  "Brownies Red Velvet":    "🍓",
};

// ─────────────────────────────────────
// 3. CART STATE (localStorage)
// ─────────────────────────────────────

/**
 * Load cart from localStorage, return array of {name, price, qty}
 */
function loadCart() {
  try {
    const raw = localStorage.getItem("dbitesofbliss_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save cart array to localStorage
 */
function saveCart(cart) {
  localStorage.setItem("dbitesofbliss_cart", JSON.stringify(cart));
}

// Initialize cart from storage
let cart = loadCart();

// ─────────────────────────────────────
// 4. CART CORE FUNCTIONS
// ─────────────────────────────────────

/**
 * Add a product to the cart.
 * If already exists, increment qty.
 * @param {string} name  - Product name
 * @param {number} price - Product price (numeric, e.g. 55000)
 */
function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart(cart);
  renderCart();
  updateCartCount();
  updateCartInForm();
  updateSidebarCart();
  showToast(`✅ ${name} ditambahkan!`);
  // Bump animation on cart badge
  const badge = document.getElementById("cartCount");
  if (badge) {
    badge.classList.add("bump");
    setTimeout(() => badge.classList.remove("bump"), 300);
  }
}

/**
 * Change quantity of a cart item. If qty reaches 0, remove it.
 * @param {string} name  - Product name
 * @param {number} delta - +1 or -1
 */
function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
  }
  saveCart(cart);
  renderCart();
  updateCartCount();
  updateCartInForm();
  updateSidebarCart();
}

/**
 * Remove a specific item from cart by name
 * @param {string} name - Product name to remove
 */
function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart(cart);
  renderCart();
  updateCartCount();
  updateCartInForm();
  updateSidebarCart();
  showToast(`🗑️ ${name} dihapus dari keranjang`);
}

/**
 * Clear all items in cart
 */
function clearCart() {
  cart = [];
  saveCart(cart);
  renderCart();
  updateCartCount();
  updateCartInForm();
  updateSidebarCart();
}

/**
 * Calculate total price of all cart items
 * @returns {number}
 */
function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/**
 * Format number as Indonesian Rupiah
 * @param {number} num
 * @returns {string} e.g. "Rp 55.000"
 */
function formatRupiah(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

// ─────────────────────────────────────
// 5. CART UI RENDER
// ─────────────────────────────────────

/**
 * Re-render the cart drawer items list and footer
 */
function renderCart() {
  const itemsEl  = document.getElementById("cartItems");
  const emptyEl  = document.getElementById("cartEmpty");
  const footerEl = document.getElementById("cartFooter");

  if (!itemsEl) return;

  if (cart.length === 0) {
    // Show empty state
    itemsEl.innerHTML = "";
    itemsEl.appendChild(emptyEl || createEmptyState());
    if (emptyEl) emptyEl.style.display = "flex";
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  // Hide empty state, build item list
  if (emptyEl) emptyEl.style.display = "none";
  if (footerEl) footerEl.style.display = "block";

  // Clear existing items (keep empty div)
  Array.from(itemsEl.children).forEach(child => {
    if (!child.classList.contains("cart-empty")) child.remove();
  });

  // Build item rows
  const fragment = document.createDocumentFragment();
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.name = item.name;
    const emoji = PRODUCT_EMOJIS[item.name] || "🍫";
    row.innerHTML = `
      <div class="cart-item-emoji">${emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatRupiah(item.price)} / pcs</div>
      </div>
      <div class="cart-qty-controls">
        <button class="qty-btn" onclick="changeQty('${item.name}', -1)" aria-label="Kurangi">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.name}', 1)" aria-label="Tambah">+</button>
      </div>
      <div class="cart-item-subtotal">${formatRupiah(item.price * item.qty)}</div>
    `;
    fragment.appendChild(row);
  });
  itemsEl.prepend(fragment);

  // Update totals
  const total = getCartTotal();
  const subtotalEl = document.getElementById("cartSubtotal");
  const totalEl    = document.getElementById("cartTotal");
  if (subtotalEl) subtotalEl.textContent = formatRupiah(total);
  if (totalEl)    totalEl.textContent    = formatRupiah(total);
}

/**
 * Update the cart icon badge count in navbar
 */
function updateCartCount() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? "flex" : "none";
}

// ─────────────────────────────────────
// 6. SIDEBAR CART (shown in order form)
// ─────────────────────────────────────

/**
 * Update the compact cart summary shown inside the pre-order form sidebar
 */
function updateSidebarCart() {
  const wrap  = document.getElementById("sidebarCartSummary");
  const items = document.getElementById("sidebarCartItems");
  const total = document.getElementById("sidebarTotal");
  if (!wrap) return;

  if (cart.length === 0) {
    wrap.style.display = "none";
    return;
  }

  wrap.style.display = "block";
  if (items) {
    items.innerHTML = cart.map(item => `
      <div class="sidebar-cart-item">
        <span>${PRODUCT_EMOJIS[item.name] || "🍫"} ${item.name} ×${item.qty}</span>
        <span>${formatRupiah(item.price * item.qty)}</span>
      </div>
    `).join("");
  }
  if (total) total.textContent = formatRupiah(getCartTotal());
}

// ─────────────────────────────────────
// 7. CART IN FORM (order section)
// ─────────────────────────────────────

/**
 * Show cart items inside the pre-order form's product info area
 */
function updateCartInForm() {
  const el = document.getElementById("cartInForm");
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = `<span style="color:var(--muted);font-size:0.85rem;">Tambah produk dari menu di atas, atau tulis manual di catatan 👇</span>`;
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-in-form-item">
      <span>${PRODUCT_EMOJIS[item.name] || "🍫"} ${item.name} <strong>×${item.qty}</strong></span>
      <span style="color:var(--primary);font-weight:600;">${formatRupiah(item.price * item.qty)}</span>
    </div>
  `).join("") + `
    <div style="border-top:1px dashed rgba(193,98,43,0.2);margin-top:0.5rem;padding-top:0.5rem;display:flex;justify-content:space-between;font-size:0.85rem;font-weight:700;color:var(--primary);">
      <span>Total</span><span>${formatRupiah(getCartTotal())}</span>
    </div>
  `;
}

// ─────────────────────────────────────
// 8. CART DRAWER TOGGLE
// ─────────────────────────────────────

/**
 * Toggle open/close of the cart drawer
 */
function toggleCart() {
  const drawer  = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer) return;
  const isOpen = drawer.classList.contains("open");
  drawer.classList.toggle("open", !isOpen);
  overlay.classList.toggle("open", !isOpen);
  // Prevent body scroll when drawer is open
  document.body.style.overflow = isOpen ? "" : "hidden";
}

// ─────────────────────────────────────
// 9. WHATSAPP CHECKOUT
// ─────────────────────────────────────

/**
 * Build and send WhatsApp message from the cart.
 * Triggered from the cart drawer "Checkout via WhatsApp" button.
 */
function checkoutWhatsApp() {
  if (cart.length === 0) {
    showToast("⚠️ Keranjang masih kosong!");
    return;
  }

  // Get customer info from pre-order form if filled
  const fname   = (document.getElementById("fname")   || {}).value   || "";
  const phone   = (document.getElementById("phone")   || {}).value   || "";
  const address = (document.getElementById("address") || {}).value   || "";
  const notes   = (document.getElementById("notes")   || {}).value   || "";
  const ddate   = (document.getElementById("ddate")   || {}).value   || "";

  // Build order lines
  const orderLines = cart.map(item =>
    `  - ${item.name} ×${item.qty} = ${formatRupiah(item.price * item.qty)}`
  ).join("\n");

  // Format the WhatsApp message
  const total = formatRupiah(getCartTotal());
  const tanggal = ddate ? `\nTanggal Pre-Order: ${ddate}` : "";

  const message = [
    `Halo dbitesofbliss 🍫`,
    `Saya ingin melakukan pre-order:`,
    ``,
    `Nama: ${fname || "(belum diisi)"}`,
    `No HP: ${phone || "(belum diisi)"}`,
    `Alamat: ${address || "(belum diisi)"}`,
    tanggal,
    ``,
    `Pesanan:`,
    orderLines,
    ``,
    `Total: ${total}`,
    notes ? `Catatan: ${notes}` : "",
    ``,
    `Terima kasih 🙏`
  ].filter(line => line !== "").join("\n");

  // Encode and redirect to WhatsApp
  const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(waURL, "_blank");
}

// ─────────────────────────────────────
// 10. PRE-ORDER FORM SUBMISSION
// ─────────────────────────────────────

/**
 * Handle the pre-order form submit.
 * Validates required fields, then opens WhatsApp with message.
 */
function handleOrderForm(e) {
  e.preventDefault();

  const required = [
    { id: "fname",   label: "Nama" },
    { id: "phone",   label: "No. WhatsApp" },
    { id: "address", label: "Alamat" },
  ];

  let valid = true;
  required.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value.trim()) {
      el.style.borderColor = "#E24B4A";
      el.style.boxShadow   = "0 0 0 3px rgba(226,75,74,0.15)";
      valid = false;
    } else {
      el.style.borderColor = "";
      el.style.boxShadow   = "";
    }
  });

  if (!valid) {
    showToast("⚠️ Mohon lengkapi data wajib diisi!");
    return;
  }

  // Get form values
  const fname   = document.getElementById("fname").value.trim();
  const phone   = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const notes   = document.getElementById("notes").value.trim();
  const ddate   = document.getElementById("ddate").value;
  const source  = document.getElementById("source").value;

  // Build order lines — use cart if available, else note they'll discuss via WA
  let orderLines = "";
  if (cart.length > 0) {
    orderLines = cart.map(item =>
      `  - ${item.name} ×${item.qty} = ${formatRupiah(item.price * item.qty)}`
    ).join("\n");
  } else {
    orderLines = "  (Produk akan dikonfirmasi via WhatsApp)";
  }

  const total = cart.length > 0 ? `Total: ${formatRupiah(getCartTotal())}` : "";
  const tanggal = ddate ? `\nTanggal Pre-Order: ${ddate}` : "";
  const sumber  = source ? `\nDari: ${source}` : "";

  // Compose message
  const message = [
    `Halo dbitesofbliss 🍫`,
    `Saya ingin melakukan pre-order:`,
    ``,
    `Nama: ${fname}`,
    `No HP: ${phone}`,
    `Alamat: ${address}`,
    tanggal,
    sumber,
    ``,
    `Pesanan:`,
    orderLines,
    ``,
    total,
    notes ? `Catatan: ${notes}` : "",
    ``,
    `Terima kasih 🙏`
  ].filter(line => line !== undefined && line !== "").join("\n");

  const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

  // Show brief success message, then redirect
  const successEl = document.getElementById("successMsg");
  if (successEl) successEl.style.display = "block";

  setTimeout(() => {
    window.open(waURL, "_blank");
    // Reset form after redirect
    document.getElementById("orderForm").reset();
    if (successEl) {
      setTimeout(() => successEl.style.display = "none", 4000);
    }
  }, 500);
}

// ─────────────────────────────────────
// 11. TOAST NOTIFICATION
// ─────────────────────────────────────

/**
 * Show a brief toast notification at bottom-right
 * @param {string} message
 * @param {number} duration - ms to show (default 2700)
 */
function showToast(message, duration = 2700) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast-item";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// ─────────────────────────────────────
// 12. MENU FILTER
// ─────────────────────────────────────

/**
 * Filter menu cards by category
 * @param {string} cat - Category key or 'all'
 * @param {HTMLElement} btn - The clicked filter button
 */
function filterMenu(cat, btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".menu-col").forEach(col => {
    const show = cat === "all" || col.dataset.cat === cat;
    col.style.display = show ? "" : "none";
  });
}

// ─────────────────────────────────────
// 13. LEGACY: addToOrder (scroll to form)
//     Kept for backward compat if referenced elsewhere
// ─────────────────────────────────────
function addToOrder(item) {
  const select = document.getElementById("product");
  if (select) {
    for (let opt of select.options) {
      if (opt.text === item) { opt.selected = true; break; }
    }
  }
  const orderSection = document.getElementById("order");
  if (orderSection) orderSection.scrollIntoView({ behavior: "smooth" });
}

// ─────────────────────────────────────
// 14. SCROLL REVEAL
// ─────────────────────────────────────
const reveals = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add("visible"), i * 80);
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => revealObserver.observe(el));

// ─────────────────────────────────────
// 15. DELIVERY DATE MIN (H+2)
// ─────────────────────────────────────
const dateInput = document.getElementById("ddate");
if (dateInput) {
  const today = new Date();
  today.setDate(today.getDate() + 2);
  dateInput.min = today.toISOString().split("T")[0];
}

// ─────────────────────────────────────
// 16. EVENT LISTENERS — INIT
// ─────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Bind form submit
  const form = document.getElementById("orderForm");
  if (form) form.addEventListener("submit", handleOrderForm);

  // Initial render from localStorage
  renderCart();
  updateCartCount();
  updateCartInForm();
  updateSidebarCart();

  // Hide cart count badge if 0
  const badge = document.getElementById("cartCount");
  if (badge && cart.length === 0) badge.style.display = "none";
});