/**
 * Offer popup (components/nm/popup.twig). Opens after its delay, at most once per visit / per day
 * (theme setting), closes on the scrim, the × button, "later" or Escape, and remembers that.
 */
import * as store from './store.js';
import { esc } from './card.js';

const $ = (s, r = document) => r.querySelector(s);
const KEY = 'nm-popup-seen';
const read = (k, area) => { try { return window[area].getItem(k); } catch { return null; } };
const write = (k, v, area) => { try { window[area].setItem(k, v); } catch { /* private mode */ } };

function seen(freq) {
  if (/[?&]popup\b/.test(location.search)) return false; /* ?popup always shows it, for review */
  if (freq === 'always') return false;
  if (freq === 'day') return read(KEY, 'localStorage') === new Date().toDateString();
  return read(KEY, 'sessionStorage') === '1';
}
function remember(freq) {
  if (freq === 'day') write(KEY, new Date().toDateString(), 'localStorage');
  else write(KEY, '1', 'sessionStorage');
}

async function fillProduct(root) {
  const row = $('[data-nm-popup-product]', root);
  if (!row) return;
  const p = await store.product(row.dataset.nmPopupProduct);
  if (!p) return;
  const price = Number(p.price?.amount ?? p.price) || 0;
  const regular = Number(p.regular_price?.amount ?? p.regular_price) || price;
  const image = p.image?.url || p.thumbnail || p.images?.[0]?.url || '';
  const sale = regular > price;
  row.setAttribute('data-nm-card', '');
  row.innerHTML = `<a href="${esc(p.url)}"><img src="${esc(image)}" alt="" data-nm-fly-src></a>
    <div><a href="${esc(p.url)}"><strong>${esc(p.name)}</strong></a>
      <span class="nm-card__price">${sale ? `<strong class="nm-price nm-price--sale">${store.money(price)}</strong><del class="nm-price-old">${store.money(regular)}</del>` : `<strong class="nm-price">${store.money(price)}</strong>`}</span></div>
    ${p.is_available === false ? '' : `<button class="nm-addbtn nm-addbtn--sm" type="button" data-nm-add="${p.id}" data-name="${esc(p.name)}" data-image="${esc(image)}" data-url="${esc(p.url)}" data-price="${price}" aria-label="${esc(p.name)}"><span class="nm-addbtn__a">${(window.NM_SETTINGS?.i18n || {}).add || 'أضف'}</span><span class="nm-addbtn__b"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span></button>`}`;
  row.hidden = false;
}

export function popup() {
  const root = $('[data-nm-popup]');
  if (!root) return;
  const freq = root.dataset.frequency || 'session';
  if (seen(freq)) return;
  let lastFocus;
  const open = () => {
    if ($('[data-nm-drawer].is-open') || $('[data-nm-menu].is-open')) { setTimeout(open, 4000); return; }
    lastFocus = document.activeElement;
    root.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-open')));
    document.documentElement.classList.add('nm-locked');
    setTimeout(() => $('.nm-pop__close', root)?.focus({ preventScroll: true }), 80);
    remember(freq);
  };
  const close = () => {
    root.classList.remove('is-open');
    document.documentElement.classList.remove('nm-locked');
    setTimeout(() => { root.hidden = true; }, 500);
    lastFocus?.focus?.({ preventScroll: true });
  };
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-nm-popup-close]')) close();
    if (e.target.closest('[data-nm-add]')) setTimeout(close, 900);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); });
  store.ready(() => fillProduct(root));
  setTimeout(open, (Number(root.dataset.delay) || 0) * 1000);
}
