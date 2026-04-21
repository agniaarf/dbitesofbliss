// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
entries.forEach((e, i) => {
    if (e.isIntersecting) {
    setTimeout(() => e.target.classList.add('visible'), i * 80);
    observer.unobserve(e.target);
    }
});
}, { threshold: 0.1 });
reveals.forEach(el => observer.observe(el));

// Menu filter
function filterMenu(cat, btn) {
document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
btn.classList.add('active');
document.querySelectorAll('.menu-col').forEach(col => {
    const show = cat === 'all' || col.dataset.cat === cat;
    col.style.display = show ? '' : 'none';
});
}

// Add to order
function addToOrder(item) {
const select = document.getElementById('product');
for (let opt of select.options) {
    if (opt.text === item) { opt.selected = true; break; }
}
document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

// Order form
document.getElementById('orderForm').addEventListener('submit', function(e) {
e.preventDefault();
const required = ['fname','phone','product','qty','ddate','address'];
let valid = true;
required.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.style.borderColor = '#E24B4A'; valid = false; }
    else el.style.borderColor = '';
});
if (valid) {
    document.getElementById('successMsg').style.display = 'block';
    this.reset();
    setTimeout(() => document.getElementById('successMsg').style.display = 'none', 5000);
}
});

// Set min date to today
const dateInput = document.getElementById('ddate');
const today = new Date();
today.setDate(today.getDate() + 2);
dateInput.min = today.toISOString().split('T')[0];