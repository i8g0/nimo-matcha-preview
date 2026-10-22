/**
 * Salla simulator for the Vercel preview ONLY — never copy this into the Salla theme.
 * On a real Salla store, `window.salla` (Twilight SDK) and the <salla-*> web components are injected by Salla.
 * This file implements the small subset the theme uses, with a cart kept in the browser (localStorage).
 */
(function () {
  const DATA = window.__NM_PREVIEW__ || { products: [], menus: {}, comments: {}, categories: {} };
  const KEY = 'nm-preview-cart';
  const FREE_SHIPPING = 199;
  const COUPONS = { NIMO10: 0.1 };
  const byId = Object.fromEntries(DATA.products.map((p) => [String(p.id), p]));
  const listeners = {};
  const on = (name, cb) => { (listeners[name] = listeners[name] || []).push(cb); };
  const emit = (name, ...args) => (listeners[name] || []).forEach((cb) => { try { cb(...args); } catch (e) { console.error(e); } });

  const DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const ar = (s) => String(s).replace(/[0-9]/g, (d) => DIGITS[d]).replace(/,/g, '٬').replace(/\./g, '٫');
  const money = (n) => {
    const v = Math.round(Number(n) * 100) / 100;
    const s = v % 1 === 0 ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${ar(s)} ر.س`;
  };

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { lines: [], coupon: null }; } catch { return { lines: [], coupon: null }; } };
  const write = (state) => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } };
  const state = () => { const s = read(); return Array.isArray(s) ? { lines: s, coupon: null } : s; };

  function summary() {
    const st = state();
    const items = st.lines.filter((l) => byId[l.product_id]).map((l) => {
      const p = byId[l.product_id];
      return {
        id: l.id, product_id: p.id, product_name: p.name, product_image: p.image.url, url: p.url,
        product_price: p.price, price: p.price, quantity: l.quantity, total: p.price * l.quantity, is_available: true,
      };
    });
    const sub = items.reduce((s, i) => s + i.total, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const discount = st.coupon && COUPONS[st.coupon] ? Math.round(sub * COUPONS[st.coupon] * 100) / 100 : 0;
    return {
      id: 1, count, sub_total: sub, total: sub - discount, discount, items, coupon: st.coupon,
      free_shipping_bar: { minimum_amount: FREE_SHIPPING, has_free_shipping: sub >= FREE_SHIPPING, percent: Math.min(100, Math.round((sub / FREE_SHIPPING) * 100)), remaining: Math.max(0, FREE_SHIPPING - sub) },
    };
  }
  const respond = (extra) => {
    const cart = summary();
    setTimeout(() => emit('cart::updated', cart), 0);
    return Promise.resolve({ success: true, data: { cart, ...extra } });
  };
  const delay = (v) => new Promise((r) => setTimeout(() => r(v), 240));

  const cart = {
    details: () => delay().then(() => ({ success: true, data: { cart: summary() } })),
    latest: () => cart.details(),
    addItem: ({ id, quantity = 1 }) => delay().then(() => {
      const st = state();
      const line = st.lines.find((l) => String(l.product_id) === String(id));
      if (line) line.quantity = Math.min(10, line.quantity + Number(quantity));
      else st.lines.push({ id: Date.now() + Math.floor(Math.random() * 1000), product_id: Number(id), quantity: Number(quantity) });
      write(st);
      return respond({ product_id: id }).then((r) => { emit('cart::item.added', r, id); return r; });
    }),
    updateItem: ({ id, quantity }) => delay().then(() => {
      const st = state();
      st.lines = st.lines.map((l) => (String(l.id) === String(id) ? { ...l, quantity: Math.max(1, Math.min(10, Number(quantity))) } : l));
      write(st);
      return respond();
    }),
    deleteItem: (id) => delay().then(() => { const st = state(); st.lines = st.lines.filter((l) => String(l.id) !== String(id)); write(st); return respond(); }),
    addCoupon: (code) => delay().then(() => {
      const c = String(code || '').trim().toUpperCase();
      if (!COUPONS[c]) return Promise.reject(new Error('الكود غير صالح. جرّب NIMO10 في المعاينة'));
      const st = state(); st.coupon = c; write(st);
      return respond();
    }),
    submit: () => checkoutNotice(),
    event: {
      onUpdated: (cb) => on('cart::updated', cb),
      onItemAdded: (cb) => on('cart::item.added', cb),
      onItemAddedFailed: () => {},
    },
  };

  window.salla = {
    onReady(cb) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => cb()); else setTimeout(cb, 0); return Promise.resolve(); },
    money,
    cart,
    product: { getDetails: (id) => delay().then(() => ({ data: byId[String(id)] || null })) },
    config: { get: (k) => (k === 'theme.is_rtl' ? true : undefined) },
    event: { dispatch: (name, ...a) => emit(name, ...a), on },
    lang: { get: (k) => k },
    notify: { success: console.info, error: console.warn },
  };

  /* ---------- checkout stand-in ---------- */
  function checkoutNotice() {
    const el = document.createElement('div');
    el.className = 'pv-modal';
    el.innerHTML = `<div class="pv-modal__box"><span class="pv-modal__eyebrow">صفحة الدفع في سلة</span><h3>هنا ينتقل العميل للدفع</h3><p>في المتجر الحقيقي يفتح زر «إتمام الطلب» صفحة الدفع الرسمية في سلة: مدى، Apple Pay، البطاقات، تمارا وتابي. هذه نسخة معاينة فقط ولا يُنفَّذ أي طلب.</p><button type="button">تمام</button></div>`;
    el.addEventListener('click', (e) => { if (e.target === el || e.target.tagName === 'BUTTON') el.remove(); });
    document.body.appendChild(el);
    return Promise.resolve();
  }

  /* ---------- web component stand-ins ---------- */
  const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };

  define('salla-menu', class extends HTMLElement {
    connectedCallback() {
      this.classList.add('hydrated');
      const items = DATA.menus[this.getAttribute('source') || 'header'] || [];
      this.innerHTML = `<ul>${items.map((m) => `<li><a href="${m.url}">${m.title}</a></li>`).join('')}</ul>`;
    }
  });

  define('salla-installment', class extends HTMLElement {
    static get observedAttributes() { return ['price']; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { this.render(); }
    render() {
      const price = Number(this.getAttribute('price')) || 0;
      this.innerHTML = price ? `<span class="pv-tamara">أو ٤ دفعات بقيمة <b>${money(price / 4)}</b> بدون فوائد مع <i>tamara</i></span>` : '';
    }
  });

  /* lists render the theme's own card element, like Salla does with product-card-component */
  const makeCards = (host, list) => {
    const tag = host.getAttribute('product-card-component') || 'nm-product-card';
    host.innerHTML = '';
    list.forEach((p) => { const el = document.createElement(tag); el.product = p; host.appendChild(el); });
  };

  const SORTERS = {
    ourSuggest: () => 0,
    bestSell: (a, b) => (b.rating?.count || 0) - (a.rating?.count || 0),
    priceFromLowToTop: (a, b) => a.price - b.price,
    priceFromTopToLow: (a, b) => b.price - a.price,
  };
  define('salla-products-list', class extends HTMLElement {
    static get observedAttributes() { return ['sort-by']; }
    connectedCallback() { this.render(); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    reload() { this.render(); }
    render() {
      const key = this.getAttribute('source-value');
      const cat = DATA.categories[key];
      let list = DATA.products.filter((p) => !cat || p.category.name === cat.name);
      list = [...list].sort(SORTERS[this.getAttribute('sort-by')] || SORTERS.ourSuggest);
      if (!customElements.get('nm-product-card')) { customElements.whenDefined('nm-product-card').then(() => this.render()); return; }
      makeCards(this, list);
    }
  });

  define('salla-products-slider', class extends HTMLElement {
    connectedCallback() {
      const self = byId[this.getAttribute('source-value')];
      const others = DATA.products.filter((p) => !self || p.id !== self.id);
      const pool = [...others.filter((p) => self && p.category.name !== self.category.name), ...others.filter((p) => self && p.category.name === self.category.name)].slice(0, 8);
      this.innerHTML = '<div class="nm-rail" data-nm-rail><div class="nm-rail__track" data-nm-rail-track></div></div>';
      const track = this.querySelector('[data-nm-rail-track]');
      const go = () => makeCards(track, pool);
      if (customElements.get('nm-product-card')) go(); else customElements.whenDefined('nm-product-card').then(go);
    }
  });

  define('salla-comments', class extends HTMLElement {
    connectedCallback() {
      const p = byId[this.getAttribute('item-id')];
      const list = (p && DATA.comments[p.slug]) || [];
      if (!list.length) { this.innerHTML = '<p class="pv-empty">لا توجد تقييمات لهذا المنتج بعد. كن أول من يكتب رأيه بعد الطلب.</p>'; return; }
      this.innerHTML = `<div class="pv-comments">${list.map((c) => `
        <article class="nm-review">
          <span class="nm-stars" style="--s:${c.stars}" aria-label="${c.stars}/5">★★★★★</span>
          <p>${c.text}</p>
          <footer><span class="nm-review__avatar" aria-hidden="true">${c.name.slice(0, 1)}</span><span><strong>${c.name}</strong><small>${c.when}</small></span></footer>
          ${c.badge ? `<span class="nm-verified">${c.badge}</span>` : ''}
        </article>`).join('')}</div>`;
    }
  });

  define('salla-search', class extends HTMLElement {
    connectedCallback() {
      const hints = ['بوكس', 'فراولة', 'مانجو', 'سيروب', '80 جرام', 'كوب'];
      this.innerHTML = `
        <div class="pv-search" hidden>
          <div class="pv-search__box" role="dialog" aria-modal="true" aria-label="بحث">
            <div class="pv-search__bar"><input type="search" placeholder="ابحث عن ماتشا، نكهة، أداة…" aria-label="بحث"><button type="button" aria-label="إغلاق">✕</button></div>
            <div class="pv-search__hint">الأكثر بحثًا: ${hints.map((t) => `<button type="button" data-q="${t}">${t}</button>`).join('')}</div>
            <div class="pv-search__results"></div>
          </div>
        </div>`;
      const wrap = this.querySelector('.pv-search');
      const input = this.querySelector('input');
      const results = this.querySelector('.pv-search__results');
      const norm = (s) => String(s).replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();
      const run = () => {
        const q = norm(input.value.trim());
        const found = q ? DATA.products.filter((p) => norm(`${p.name} ${p.category.name}`).includes(q)) : [];
        results.innerHTML = found.map((p) => `<a href="${p.url}"><img src="${p.image.url}" alt=""><span><b>${p.name}</b><small>${p.category.name} · ${money(p.price)}</small></span></a>`).join('')
          || (q ? '<p>ما لقينا شي بهالاسم.. جرّب كلمة ثانية</p>' : '');
      };
      input.addEventListener('input', run);
      this.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.q; run(); }));
      const close = () => { wrap.classList.remove('is-open'); document.documentElement.classList.remove('nm-locked'); setTimeout(() => { wrap.hidden = true; }, 300); };
      this.querySelector('.pv-search__bar button').addEventListener('click', close);
      wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wrap.hidden) close(); });
      on('search::open', () => { wrap.hidden = false; document.documentElement.classList.add('nm-locked'); requestAnimationFrame(() => wrap.classList.add('is-open')); setTimeout(() => input.focus(), 60); });
    }
  });
})();
