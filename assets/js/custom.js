const WA_NUMBER = "6285266744688";



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
  showToast(`${name} added!`);
  const badge = document.getElementById("cartCount");
  if (badge) {
    badge.classList.add("bump");
    setTimeout(() => badge.classList.remove("bump"), 300);
  }
}

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


function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart(cart);
  renderCart();
  updateCartCount();
  updateCartInForm();
  updateSidebarCart();
  showToast(`${name} removed from cart`);
}


function clearCart() {
  cart = [];
  saveCart(cart);
  renderCart();
  updateCartCount();
  updateCartInForm();
  updateSidebarCart();
}


function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}


function formatRupiah(num) {
  return "Rp " + num.toLocaleString("id-ID");
}


function renderCart() {
  const itemsEl  = document.getElementById("cartItems");
  const emptyEl  = document.getElementById("cartEmpty");
  const footerEl = document.getElementById("cartFooter");

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = "";
    itemsEl.appendChild(emptyEl || createEmptyState());
    if (emptyEl) emptyEl.style.display = "flex";
    if (footerEl) footerEl.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (footerEl) footerEl.style.display = "block";

  Array.from(itemsEl.children).forEach(child => {
    if (!child.classList.contains("cart-empty")) child.remove();
  });

  const fragment = document.createDocumentFragment();
  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.name = item.name;
    row.innerHTML = `
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
        <span>${item.name} ×${item.qty}</span>
        <span>${formatRupiah(item.price * item.qty)}</span>
      </div>
    `).join("");
  }
  if (total) total.textContent = formatRupiah(getCartTotal());
}

/**
 * Show cart items inside the pre-order form's product info area
 */
function updateCartInForm() {
  const el = document.getElementById("cartInForm");
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = `<span style="color:var(--muted);font-size:0.85rem;">Add products from menu above, or write manually in notes below</span>`;
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-in-form-item">
      <span>${item.name} <strong>×${item.qty}</strong></span>
      <span style="color:var(--primary);font-weight:600;">${formatRupiah(item.price * item.qty)}</span>
    </div>
  `).join("") + `
    <div style="border-top:1px dashed rgba(193,98,43,0.2);margin-top:0.5rem;padding-top:0.5rem;display:flex;justify-content:space-between;font-size:0.85rem;font-weight:700;color:var(--primary);">
      <span>Total</span><span>${formatRupiah(getCartTotal())}</span>
    </div>
  `;
}

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

/**
 * Build and send WhatsApp message from the cart.
 * Triggered from the cart drawer "Checkout via WhatsApp" button.
 */
function checkoutWhatsApp() {
  if (cart.length === 0) {
    showToast("Cart is empty!");
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

  const total = formatRupiah(getCartTotal());
  const tanggal = ddate ? `\nPreorder Date: ${ddate}` : "";

  const message = [
    `Halo, DBitesOfBliss!`,
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
    `Terima kasih sudah berbelanja di dbitesofbliss.`
  ].filter(line => line !== "").join("\n");

  // Encode and redirect to WhatsApp
  const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(waURL, "_blank");
}

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
    showToast("Please fill in all required fields!");
    return;
  }

  // Get form values
  const fname   = document.getElementById("fname").value.trim();
  const phone   = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const notes   = document.getElementById("notes").value.trim();
  const ddate   = document.getElementById("ddate").value;
  const source  = document.getElementById("source").value;

  let orderLines = "";
  if (cart.length > 0) {
    orderLines = cart.map(item =>
      `  - ${item.name} ×${item.qty} = ${formatRupiah(item.price * item.qty)}`
    ).join("\n");
  } else {
    orderLines = "  (Products will be confirmed via WhatsApp)";
  }

  const total = cart.length > 0 ? `Total: ${formatRupiah(getCartTotal())}` : "";
  const tanggal = ddate ? `\nPreorder Date: ${ddate}` : "";
  const sumber  = source ? `\nSource: ${source}` : "";

  const message = [
    `Halo, DBitesOfBliss!`,
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
    ` Terima kasih sudah berbelanja di dbitesofbliss`
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


function filterMenu(cat, btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".menu-col").forEach(col => {
    const show = cat === "all" || col.dataset.cat === cat;
    col.style.display = show ? "" : "none";
  });
}

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

const dateInput = document.getElementById("ddate");
if (dateInput) {
  const today = new Date();
  today.setDate(today.getDate() + 2);
  dateInput.min = today.toISOString().split("T")[0];
}

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