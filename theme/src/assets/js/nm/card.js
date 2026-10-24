/**
 * The JS twin of components/product/nm-card.twig. Salla's <salla-products-list> and
 * <salla-products-slider> render their cards through a custom element; giving them
 * product-card-component="nm-product-card" makes every list in the store use the Nimo card.
 * Also home of the "cups per pack / price per cup" calculation used on cards and the product page.
 */
import { money, arabicDigits } from './store.js';

const S = () => window.NM_SETTINGS || {};
const t = (k, fallback) => (S().i18n || {})[k] || fallback;
const num = (v) => Number(v && typeof v === 'object' ? v.amount : v) || 0;
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Grams of matcha in a product, read from its name: "80 جرام", "40g", "1كيلو", "250 غرام".
 * Syrups (ml), cups and tools return 0, so the chip never shows on them.
 */
export function gramsOf(name) {
  const n = String(name || '').replace(/[\u0660-\u0669]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  if (!/ماتشا|matcha/i.test(n) || /^\s*(سيروب|syrup|كوب|أدوات|ادوات|حافظة|مخفقة)/i.test(n)) return 0;
  const kilo = n.match(/(\d+(?:\.\d+)?)\s*(?:كيلو|كجم|kg)/i);
  if (kilo) return Number(kilo[1]) * 1000;
  const grams = [...n.matchAll(/(\d+(?:\.\d+)?)\s*(?:جرام|غرام|جم|g\b)/gi)].map((m) => Number(m[1]));
  if (!grams.length) return 0;
  /* "بوكس 3 ماتشا" style names: three 40 g bags */
  const packs = n.match(/(\d+)\s*(?:×|x)?\s*ماتشا/);
  return Math.max(...grams) * (packs && Number(packs[1]) > 1 && Math.max(...grams) <= 50 ? Number(packs[1]) : 1);
}

export function cupsInfo(name, price) {
  if (!S().cups) return null;
  const g = gramsOf(name);
  const per = Number(S().gramsPerCup) || 2;
  if (!g) return null;
  const cups = Math.floor(g / per);
  if (cups < 2) return null;
  const perCup = Number(price) / cups;
  return { cups, perCup };
}

/** Fills every [data-nm-cups] chip inside root that hasn't been filled yet. */
export function fillCups(root = document) {
  root.querySelectorAll('[data-nm-cups]:not([data-done])').forEach((el) => {
    el.dataset.done = '1';
    const host = el.closest('[data-name]') || el;
    const info = cupsInfo(el.dataset.name || host.dataset.name, el.dataset.price || host.dataset.price);
    if (!info) return;
    el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h12l-1.2 10.5a2 2 0 0 1-2 1.5H8.2a2 2 0 0 1-2-1.5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H16.5"/></svg>~${arabicDigits(info.cups)} ${t('cups', 'كوب')} · ${money(info.perCup.toFixed(2))} ${t('perCup', 'للكوب')}`;
    el.hidden = false;
  });
}

export function cardHTML(p) {
  const price = num(p.price);
  const sale = num(p.sale_price);
  const regular = num(p.regular_price) || price;
  const onSale = !!(p.is_on_sale && sale && regular > sale);
  const off = onSale ? Math.round((1 - sale / regular) * 100) : 0;
  const available = p.is_available !== false && p.status !== 'out';
  const image = p.image?.url || p.thumbnail || p.main_image || '';
  const second = (p.images || [])[1]?.url;
  const promo = p.promotion_title || p.promotion?.title || '';
  const cat = p.category?.name || (typeof p.category === 'string' ? p.category : '') || '';
  const priceHTML = onSale
    ? `<strong class="nm-price nm-price--sale">${money(sale)}</strong><del class="nm-price-old">${money(regular)}</del>`
    : `<strong class="nm-price">${money(price)}</strong>`;
  const name = esc(p.name);
  return `
  <article class="nm-card ${available ? '' : 'nm-card--out'}" data-nm-card data-category="${esc(cat)}" data-name="${name}" data-price="${price}">
    <a class="nm-card__stage" href="${esc(p.url)}" aria-label="${name}">
      <img src="${esc(image)}" alt="${name}" loading="lazy" decoding="async" width="600" height="750" data-nm-fly-src>
      ${second ? `<img src="${esc(second)}" alt="" loading="lazy" decoding="async" width="600" height="750">` : ''}
      <span class="nm-card__badges">
        ${promo ? `<span class="nm-label nm-label--solid">${esc(promo)}</span>` : ''}
        ${off ? `<span class="nm-label">${t('save', 'وفّر')} ${arabicDigits(off)}%</span>` : ''}
        ${available ? '' : `<span class="nm-label nm-label--muted">${t('soldOut', 'نفدت الكمية')}</span>`}
      </span>
    </a>
    <div class="nm-card__foot">

      <div class="nm-card__body">
        ${cat ? `<span class="nm-card__cat">${esc(cat)}</span>` : ''}
        <a class="nm-card__name" href="${esc(p.url)}">${name}</a>
        <span class="nm-card__rule" aria-hidden="true"></span>
        <div class="nm-card__price">${priceHTML}</div>
        <span class="nm-cups" data-nm-cups hidden></span>
        ${available ? `<button class="nm-addbtn nm-card__buy" type="button" data-nm-add="${p.id}" data-name="${name}" data-image="${esc(image)}" data-url="${esc(p.url)}" data-price="${price}" aria-label="${t('addToCart', 'أضف للسلة')}: ${name}">
          <span class="nm-addbtn__a"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.3 11.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>${t('addToCart', 'أضف للسلة')}</span>
          <span class="nm-addbtn__b"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>${t('addedShort', 'تمت الإضافة')}</span>
        </button>` : ''}
      </div>
    </div>
  </article>`;
}

/** <nm-product-card> — what Salla's product lists render for each product. */
export function defineCard() {
  if (customElements.get('nm-product-card')) return;
  customElements.define('nm-product-card', class extends HTMLElement {
    set product(p) { this._p = p; if (this.isConnected) this.render(); }
    get product() { return this._p; }
    connectedCallback() {
      /* a value set before this element was upgraded lands as an own property: adopt it */
      if (Object.prototype.hasOwnProperty.call(this, 'product')) {
        const v = this.product;
        delete this.product;
        this._p = v;
      }
      if (!this._p && this.getAttribute('product')) {
        try { this._p = JSON.parse(this.getAttribute('product')); } catch { /* ignore */ }
      }
      this.render();
    }
    render() {
      if (!this._p) return;
      this.style.display = 'contents';
      this.innerHTML = cardHTML(this._p);
      fillCups(this);
    }
  });
}
