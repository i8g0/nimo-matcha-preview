/** Cart page: keeps lines, free-shipping bar, upsell and summary in sync; coupon; checkout via Salla. */
import * as store from './store.js';
import { lineHTML, renderFreeShipping, renderUpsell, render as renderShell } from './cart-ui.js';

const $ = (s, r = document) => r.querySelector(s);
const S = () => window.NM_SETTINGS || {};
const t = (k, f) => (S().i18n || {})[k] || f;

export function cartPage() {
  const root = $('[data-nm-cartpage]');
  if (!root) return;
  const lines = $('[data-nm-cart-lines]', root);
  const empty = $('[data-nm-cart-empty]', root);

  const paint = (cart) => {
    lines.innerHTML = cart.items.map(lineHTML).join('');
    empty.hidden = cart.count > 0;
    $('[data-nm-summary]', root).hidden = cart.count === 0;
    $('[data-nm-sum-sub]', root).textContent = store.money(cart.subTotal);
    $('[data-nm-sum-total]', root).textContent = store.money(cart.total);
    const disc = cart.subTotal - cart.total;
    const row = $('[data-nm-sum-discount-row]', root);
    if (row) { row.hidden = disc < 0.01; $('[data-nm-sum-discount]', root).textContent = `− ${store.money(disc)}`; }
    $('[data-nm-installment]', root)?.setAttribute('price', cart.total);
    renderFreeShipping(root, cart);
    renderUpsell(root, cart);
  };

  document.addEventListener('nm:cart', (e) => paint(e.detail));
  store.ready(async () => {
    const cart = await store.details();
    renderShell(cart);
    paint(cart);
    store.onChange(async () => paint(await store.details()));
  });

  $('[data-nm-checkout]', root)?.addEventListener('click', (e) => {
    e.currentTarget.classList.add('is-busy');
    Promise.resolve(store.checkout()).finally(() => setTimeout(() => e.currentTarget?.classList.remove('is-busy'), 1500));
  });

  const form = $('[data-nm-coupon]', root);
  const msg = $('[data-nm-coupon-msg]', root);
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = form.code.value.trim();
    if (!code) return;
    const btn = form.querySelector('button');
    btn.classList.add('is-busy');
    try {
      paint(await store.coupon(code).then((c) => (c.items.length ? c : store.details())));
      msg.className = 'nm-coupon-msg is-ok';
      msg.textContent = t('couponOk', '');
    } catch (err) {
      msg.className = 'nm-coupon-msg is-err';
      msg.textContent = err?.response?.data?.error?.message || err?.message?.replace(/^preview$/, '') || t('couponErr', '');
      if (!msg.textContent) msg.textContent = t('couponErr', '');
    } finally {
      btn.classList.remove('is-busy');
    }
  });
}
