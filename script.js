/* =====================================================================
   The Comfy Oak Tree — site script
   ---------------------------------------------------------------------
   SHOP SETTINGS: edit these when the real shop details are ready.
   ===================================================================== */
const SHOP = {
  phone: '+44 (0) 123 456 7890',          // ← placeholder: replace with the real number
  email: 'hello@thecomfyoaktree.com',
  currency: '£',
  freeShippingOver: 50,                    // free UK standard shipping threshold
  shipping: { standard: 3.95, express: 6.95, international: 9.95 },
  // Paste a Formspree / Getform URL here to receive contact & newsletter
  // messages for real. While empty, forms run in demo mode.
  formEndpoint: ''
};

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = n => SHOP.currency + n.toFixed(2);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Shop details ---------- */
  $$('[data-shop="phone"]').forEach(el => el.textContent = SHOP.phone);
  $$('a[data-shop-link="phone"]').forEach(a => a.href = 'tel:' + SHOP.phone.replace(/\(0\)/, '').replace(/[^\d+]/g, ''));
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle'), nav = $('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }));
    document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.target.closest('.header-inner')) toggle.click(); });
  }

  /* =================================================================
     BASKET (demo: stored in this browser only)
     ================================================================= */
  const KEY = 'comfyOakBasket';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  let cart = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} render(); };
  const count = () => cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => cart.reduce((n, i) => n + i.qty * i.price, 0);
  const lineKey = (id, opt) => id + (opt ? '|' + opt : '');

  function add(item) {
    const k = lineKey(item.id, item.option);
    const found = cart.find(i => lineKey(i.id, i.option) === k);
    if (found) found.qty += 1; else cart.push({ ...item, qty: 1 });
    save();
    const badge = $('[data-cart-count]');
    if (badge) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
    toast(`Added “${item.name}” to your basket`);
  }
  function setQty(k, d) {
    const it = cart.find(i => lineKey(i.id, i.option) === k);
    if (!it) return;
    it.qty += d;
    if (it.qty <= 0) cart = cart.filter(i => i !== it);
    save();
  }
  function remove(k) { cart = cart.filter(i => lineKey(i.id, i.option) !== k); save(); }

  function itemHTML(i, editable) {
    const k = esc(lineKey(i.id, i.option));
    return `<div class="cart-item"><img src="${esc(i.img)}" alt=""><div><h3>${esc(i.name)}</h3>${i.option ? `<small>${esc(i.option)}</small>` : ''}` +
      (editable ? `<div class="qty"><button type="button" data-qty="-1" data-key="${k}" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button type="button" data-qty="1" data-key="${k}" aria-label="Increase quantity">+</button></div>` : `<small>Qty ${i.qty}</small>`) +
      `</div><div class="cart-item-right"><strong>${money(i.qty * i.price)}</strong>${editable ? `<button type="button" class="remove" data-remove="${k}">Remove</button>` : ''}</div></div>`;
  }

  function render() {
    const n = count(), sub = subtotal();
    $$('[data-cart-count]').forEach(b => { b.textContent = n; b.hidden = n === 0; });
    const cb = $('.cart-btn'); if (cb) cb.setAttribute('aria-label', `Open basket (${n} item${n === 1 ? '' : 's'})`);
    const items = $('[data-cart-items]');
    if (items) {
      items.innerHTML = cart.length ? cart.map(i => itemHTML(i, true)).join('') :
        '<div class="cart-empty"><p>Your basket is empty — the oak is waiting.</p><a class="btn btn-primary" href="mystery-boxes.html">Shop Mystery Boxes</a></div>';
    }
    const st = $('[data-cart-subtotal]'); if (st) st.textContent = money(sub);
    const co = $('[data-cart-checkout]'); if (co) co.toggleAttribute('hidden', !cart.length);
    const ship = $('[data-cart-ship]');
    if (ship) {
      const left = SHOP.freeShippingOver - sub;
      ship.innerHTML = !cart.length ? `Free UK shipping on orders over ${SHOP.currency}${SHOP.freeShippingOver}` :
        (left > 0 ? `You're <strong>${money(left)}</strong> away from free UK shipping` : '🌿 You\'ve unlocked <strong>free UK shipping</strong>') +
        `<div class="ship-bar"><i style="width:${Math.min(100, sub / SHOP.freeShippingOver * 100)}%"></i></div>`;
    }
    renderCheckout();
  }

  // Add-to-basket buttons (products + mystery boxes)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add-to-cart]');
    if (b) {
      const sel = $(`[data-option-for="${b.dataset.id}"]`);
      add({ id: b.dataset.id, name: b.dataset.name, price: parseFloat(b.dataset.price), img: b.dataset.img, option: sel ? sel.value : '' });
      return;
    }
    const q = e.target.closest('[data-qty]'); if (q) { setQty(q.dataset.key, +q.dataset.qty); return; }
    const r = e.target.closest('[data-remove]'); if (r) { remove(r.dataset.remove); return; }
    if (e.target.closest('[data-cart-open]')) { openCart(); return; }
    if (e.target.closest('[data-cart-close]') || e.target.matches('[data-cart-overlay]')) closeCart();
  });

  // Drawer
  const drawer = $('[data-cart-drawer]'), overlay = $('[data-cart-overlay]');
  let lastFocus = null;
  function openCart() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('show'));
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll'); drawer.focus();
  }
  function closeCart() {
    if (!drawer || !drawer.classList.contains('open')) return;
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('show'); setTimeout(() => overlay.hidden = true, 250);
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
  window.addEventListener('storage', e => { if (e.key === KEY) { cart = load(); render(); } });

  // Toast
  const toastEl = $('[data-toast]'); let tt;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* =================================================================
     CHECKOUT (demo)
     ================================================================= */
  const co = $('[data-checkout]');
  function shippingCost() {
    const form = $('form[data-form="checkout"]');
    if (!form) return 0;
    const intl = form.country.value === 'INT';
    const method = (form.querySelector('input[name="shipping"]:checked') || {}).value;
    if (intl) return SHOP.shipping.international + (method === 'express' ? SHOP.shipping.express - SHOP.shipping.standard : 0);
    if (method === 'express') return SHOP.shipping.express;
    return subtotal() >= SHOP.freeShippingOver ? 0 : SHOP.shipping.standard;
  }
  function renderCheckout() {
    if (!co) return;
    const empty = !cart.length && !co.dataset.done;
    $('[data-checkout-empty]').hidden = !empty;
    co.hidden = empty || !!co.dataset.done;
    $('[data-summary-items]').innerHTML = cart.map(i => itemHTML(i, false)).join('');
    const sh = shippingCost(), sub = subtotal();
    $('[data-summary-subtotal]').textContent = money(sub);
    $('[data-summary-shipping]').textContent = sh ? money(sh) : 'Free';
    $('[data-summary-total]').textContent = money(sub + sh);
    const std = $('[data-ship-standard]');
    const form = $('form[data-form="checkout"]');
    if (std && form) std.textContent = form.country.value === 'INT' ? money(SHOP.shipping.international) : (sub >= SHOP.freeShippingOver ? 'Free' : money(SHOP.shipping.standard));
  }
  if (co) $('form[data-form="checkout"]').addEventListener('change', renderCheckout);

  /* =================================================================
     FORMS: validation + demo/real sending
     ================================================================= */
  const MSG = { required: 'Please fill this in.', email: 'Please enter a valid email address.', short: 'Please write a little more (10+ characters).' };
  function fieldError(f, msg) {
    const holder = f.closest('label') || f;
    let el = holder.parentElement.querySelector(`.error-msg[data-for="${f.name}"]`);
    f.classList.toggle('field-error', !!msg);
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (!msg) { if (el) el.remove(); return true; }
    if (!el) { el = document.createElement('span'); el.className = 'error-msg'; el.dataset.for = f.name; holder.insertAdjacentElement('afterend', el); }
    el.textContent = msg;
    return false;
  }
  function validate(f) {
    const v = (f.value || '').trim();
    if (f.required && !v) return fieldError(f, MSG.required);
    if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return fieldError(f, MSG.email);
    if (f.tagName === 'TEXTAREA' && f.required && v.length < 10) return fieldError(f, MSG.short);
    return fieldError(f, '');
  }
  $$('form[data-form]').forEach(form => {
    const fields = $$('input:not([type=radio]), textarea, select', form).filter(f => f.name);
    fields.forEach(f => {
      f.addEventListener('blur', () => { if (f.value) validate(f); });
      f.addEventListener('input', () => { if (f.classList.contains('field-error')) validate(f); });
    });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const ok = fields.map(validate).every(Boolean);
      if (!ok) { const bad = $('.field-error', form); if (bad) bad.focus(); return; }
      const btn = $('button[type="submit"]', form), label = btn.textContent;
      const status = $('[data-form-status]', form) || $('[data-form-status]', form.parentElement);
      btn.disabled = true; btn.textContent = form.dataset.form === 'checkout' ? 'Placing order…' : 'Sending…';
      const kind = form.dataset.form;
      try {
        if (SHOP.formEndpoint && kind !== 'checkout') {
          const r = await fetch(SHOP.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error(r.status);
        } else {
          await new Promise(r => setTimeout(r, 800));
        }
        if (kind === 'checkout') return placeOrder(form);
        const demo = SHOP.formEndpoint ? '' : '<small>Demo mode: nothing was actually sent.</small>';
        if (status) { status.className = 'form-status ok'; status.innerHTML = (kind === 'newsletter' ? '🌿 You’re on the list — welcome to the oak!' : '🌿 Thank you! Your whisper reached the oak. We’ll reply within 1–2 business days.') + demo; }
        form.reset();
      } catch (err) {
        if (status) { status.className = 'form-status'; status.textContent = 'Something went wrong — please try again or email ' + SHOP.email + '.'; }
      } finally { btn.disabled = false; btn.textContent = label; }
    });
  });

  function placeOrder(form) {
    const num = 'COT-' + Date.now().toString().slice(-6);
    co.dataset.done = '1';
    cart = []; save();
    co.hidden = true;
    $('[data-checkout-empty]').hidden = true;
    const done = $('[data-order-done]'); done.hidden = false;
    $('[data-order-number]').textContent = num;
    done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }

  /* ---------- Scroll reveal ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    const els = $$('.section-head, .category-card, .tier-card, .product-card, .review-card, .gallery img, .tier-feature, .step, .policy-card, .faq-item, .showcase-images img, .compare-card');
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12, rootMargin: '0px 0px -30px 0px' });
    els.forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentElement.children, el) % 3) * 90 + 'ms'; io.observe(el); });
  }

  render();
});
