/**
 * Mini-cart experience shared by every page: fly-to-cart, badge bump, toast, drawer, free-shipping bar
 * and "complete your cup" suggestions. Any element with [data-nm-add="<product id>"] is an add-to-cart button.
 */
import * as store from './store.js';
import { esc } from './card.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const S = () => window.NM_SETTINGS || {};
const t = (k, f) => (S().i18n || {})[k] || f;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let current = store.normalizeCart(null);
let toastTimer;
let audio;
const upsellCache = {};

/* ---------- rendering ---------- */

export function lineHTML(item) {
  return `
    <div class="nm-line" data-item-id="${item.id}" data-product-id="${item.productId}">
      <a class="nm-line__img" href="${esc(item.url)}"><img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy"></a>
      <div class="nm-line__body">
        <div class="nm-line__top">
          <a class="nm-line__name" href="${esc(item.url)}">${esc(item.name)}</a>
          <strong class="nm-line__total">${store.money(item.total)}</strong>
        </div>
        <div class="nm-line__bottom">
          <div class="nm-qty nm-qty--sm">
            <button type="button" data-nm-line-step="1" aria-label="${t('increase', '+')}">+</button>
            <span data-nm-line-qty>${store.arabicDigits(item.quantity)}</span>
            <button type="button" data-nm-line-step="-1" aria-label="${t('decrease', '-')}">−</button>
          </div>
          <button type="button" class="nm-line__remove" data-nm-line-remove>${t('remove', '×')}</button>
        </div>
      </div>
    </div>`;
}

export function renderFreeShipping(root, cart) {
  const box = $('[data-nm-free]', root);
  if (!box) return;
  const bar = cart.freeShipping;
  if (!bar || !cart.count) { box.hidden = true; return; }
  box.hidden = false;
  box.classList.toggle('is-done', !!bar.has_free_shipping);
  $('[data-nm-free-text]', box).textContent = bar.has_free_shipping
    ? t('freeDone', '')
    : t('freeLeft', '{amount}').replace('{amount}', store.money(bar.remaining));
  $('[data-nm-free-fill]', box).style.width = `${Math.min(100, Number(bar.percent) || 0)}%`;
}

/** Suggestions not already in the cart, fetched once per product. */
export async function renderUpsell(root, cart) {
  const box = $('[data-nm-upsell]', root);
  if (!box) return;
  const inCart = new Set(cart.items.map((i) => String(i.productId)));
  const rows = $$('[data-nm-up]', box);
  await Promise.all(rows.map(async (row) => {
    const id = row.dataset.nmUp;
    if (id && !(id in upsellCache)) upsellCache[id] = store.product(id);
    if (id) upsellCache[id] = await upsellCache[id];
  }));
  let shown = 0;
  rows.forEach((row) => {
    const id = row.dataset.nmUp;
    if (!id || inCart.has(String(id)) || shown >= 3) { row.hidden = true; return; }
    const p = upsellCache[id];
    if (!p || p.is_available === false) { row.hidden = true; return; }
    const price = Number(p.price?.amount ?? p.price) || 0;
    const image = p.image?.url || p.thumbnail || p.images?.[0]?.url || '';
    if (!row.innerHTML) {
      row.innerHTML = `<a href="${esc(p.url)}"><img src="${esc(image)}" alt="" loading="lazy"></a>
        <span><strong>${esc(p.name)}</strong><small>${store.money(price)}</small></span>
        <button class="nm-btn nm-btn--ink" type="button" data-nm-add="${p.id}" data-name="${esc(p.name)}" data-image="${esc(image)}" data-url="${esc(p.url)}" data-price="${price}">${t('add', 'أضف')}</button>`;
    }
    shown += 1;
    row.hidden = false;
  });
  box.hidden = shown === 0 || !cart.count;
}

export function render(cart) {
  current = cart;
  const { count } = cart;
  $$('[data-nm-cart-count]').forEach((el) => { el.textContent = store.arabicDigits(count); el.hidden = !count; });
  $$('[data-nm-cart-count-text]').forEach((el) => { el.textContent = store.arabicDigits(count); });
  $$('[data-nm-subtotal]').forEach((el) => { el.textContent = store.money(cart.subTotal); });
  $$('[data-nm-installment]').forEach((el) => el.setAttribute('price', cart.total));

  const drawer = $('[data-nm-drawer]');
  if (!drawer) return;
  $('[data-nm-lines]', drawer).innerHTML = cart.items.map(lineHTML).join('');
  $('[data-nm-empty]', drawer).hidden = count > 0;
  $('[data-nm-foot]', drawer).hidden = count === 0;
  renderFreeShipping(drawer, cart);
  renderUpsell(drawer, cart);
}

/* ---------- feedback ---------- */

function bump() {
  $$('[data-nm-cart-count]').forEach((el) => {
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  });
}

function chime() {
  if (!S().sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio = audio || new Ctx();
    const t0 = audio.currentTime;
    [[880, 0], [1318.5, 0.08]].forEach(([f, d]) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t0 + d);
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.045, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.45);
      o.connect(g).connect(audio.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 0.5);
    });
  } catch { /* sound is a nicety */ }
  navigator.vibrate?.(10);
}

/** Flies a copy of the product image into the visible cart icon. */
function fly(sourceImg) {
  const target = $$('[data-nm-cart-target], .nm-tabbar [data-nm-cart-open]').find((el) => el.offsetParent !== null);
  if (!sourceImg || !target || reduced()) return Promise.resolve();
  const from = sourceImg.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || from.bottom < 0 || from.top > innerHeight) return Promise.resolve();
  const ghost = document.createElement('img');
  ghost.src = sourceImg.currentSrc || sourceImg.src;
  ghost.className = 'nm-fly';
  const size = Math.min(from.width, 160);
  Object.assign(ghost.style, { left: `${from.left + (from.width - size) / 2}px`, top: `${from.top + (from.height - size) / 2}px`, width: `${size}px`, height: `${size}px` });
  document.body.appendChild(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const anim = ghost.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '0px' },
    { transform: `translate(${dx * 0.4}px, ${dy * 0.2 - 80}px) scale(.55)`, opacity: 1, borderRadius: '50%', offset: 0.45 },
    { transform: `translate(${dx}px, ${dy}px) scale(.08)`, opacity: 0.3, borderRadius: '50%' },
  ], { duration: 760, easing: 'cubic-bezier(.55,0,.25,1)' });
  const settle = Promise.race([anim.finished, new Promise((r) => setTimeout(r, 900))]);
  return settle.then(() => ghost.remove(), () => ghost.remove());
}

function toast(image) {
  const el = $('[data-nm-toast]');
  if (!el || $('[data-nm-drawer].is-open')) return;
  $('[data-nm-toast-img]', el).src = image || '';
  el.hidden = false;
  el.classList.remove('is-out');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => { el.hidden = true; }, 400);
  }, 3200);
}

/* ---------- drawer ---------- */

let lastFocus;
export function openDrawer() {
  const drawer = $('[data-nm-drawer]');
  if (!drawer) return;
  lastFocus = document.activeElement;
  drawer.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => drawer.classList.add('is-open')));
  document.documentElement.classList.add('nm-locked');
  $('[data-nm-toast]')?.setAttribute('hidden', '');
  setTimeout(() => $('.nm-drawer__head button', drawer)?.focus({ preventScroll: true }), 60);
}

export function closeDrawer() {
  const drawer = $('[data-nm-drawer]');
  if (!drawer || drawer.hidden) return;
  drawer.classList.remove('is-open');
  document.documentElement.classList.remove('nm-locked');
  setTimeout(() => { drawer.hidden = true; }, 500);
  lastFocus?.focus?.({ preventScroll: true });
}

/* ---------- wiring ---------- */

export async function addOne(btn, { silent = false } = {}) {
  if (btn.classList.contains('is-busy')) return null;
  const id = btn.dataset.nmAdd;
  let qty = 1;
  if (btn.hasAttribute('data-nm-with-qty')) qty = Number($('[data-nm-qty-input]')?.value) || 1;
  const box = btn.closest('[data-nm-card], .nm-spot__grid, .nm-pdp, .nm-up');
  const img = box?.querySelector('[data-nm-fly-src]') || box?.querySelector('img');
  const meta = { name: btn.dataset.name, image: btn.dataset.image, url: btn.dataset.url, price: Number(btn.dataset.price) };

  btn.classList.add('is-busy');
  btn.setAttribute('aria-busy', 'true');
  try {
    const flight = silent ? Promise.resolve() : fly(img);
    const cart = await store.add(id, qty, meta);
    await flight;
    render(cart.items.length ? cart : await store.details());
    bump();
    if (!silent) { chime(); toast(meta.image); }
    btn.classList.add('is-done');
    setTimeout(() => btn.classList.remove('is-done'), 1400);
    return cart;
  } catch (e) {
    console.warn('[NM] add to cart failed', e);
    return null;
  } finally {
    btn.classList.remove('is-busy');
    btn.removeAttribute('aria-busy');
  }
}

async function handleLineStep(line, step) {
  const item = current.items.find((i) => String(i.id) === line.dataset.itemId);
  const next = (item?.quantity || 1) + step;
  line.classList.add('is-busy');
  try {
    const cart = next < 1 ? await store.remove(line.dataset.itemId) : await store.update(line.dataset.itemId, next);
    const fresh = cart.items.length || next < 1 ? cart : await store.details();
    render(fresh);
    document.dispatchEvent(new CustomEvent('nm:cart', { detail: fresh }));
  } finally {
    line.classList.remove('is-busy');
  }
}

export function init() {
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-nm-add]');
    if (add) {
      e.preventDefault();
      addOne(add).then((cart) => {
        if (cart && add.hasAttribute('data-nm-buy-now')) location.href = S().cartUrl || '/cart';
      });
      return;
    }

    const open = e.target.closest('[data-nm-cart-open]');
    if (open && !document.body.classList.contains('page-cart')) { e.preventDefault(); openDrawer(); return; }

    if (e.target.closest('[data-nm-cart-close]')) { closeDrawer(); return; }

    const line = e.target.closest('[data-nm-drawer] .nm-line, [data-nm-cart-lines] .nm-line');
    if (line) {
      const step = e.target.closest('[data-nm-line-step]');
      if (step) handleLineStep(line, Number(step.dataset.nmLineStep));
      if (e.target.closest('[data-nm-line-remove]')) handleLineStep(line, -999);
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  store.ready(async () => {
    render(await store.details());
    store.onChange(async (summary) => {
      if (summary.count !== current.count || summary.total !== current.total) render(await store.details());
    });
  });
}

export const getCurrent = () => current;
