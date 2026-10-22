/** Home sections with behaviour: cinematic scenes, shop tabs, flavour picker, bundle builder. */
import * as store from './store.js';
import { addOne, openDrawer } from './cart-ui.js';
import { reveals } from './motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export { scenes as hero } from './scenes.js';

/* ---------- shop tabs ---------- */
export function shop() {
  $$('[data-nm-shop]').forEach((root) => {
    const grid = $('[data-nm-shop-grid]', root);
    const tabs = $$('[data-nm-filter]', root);
    if (!grid || !tabs.length) return;
    tabs.forEach((tab) => tab.addEventListener('click', () => {
      const f = tab.dataset.nmFilter;
      tabs.forEach((b) => { const on = b === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      $$('[data-nm-card]', grid).forEach((card, k) => {
        const show = f === '*' || card.dataset.category === f;
        if (!show) { card.classList.add('is-hidden'); return; }
        const wasHidden = card.classList.contains('is-hidden');
        card.classList.remove('is-hidden');
        if (wasHidden && !reduced()) {
          card.classList.add('is-entering');
          card.style.transitionDelay = `${Math.min(k, 8) * 30}ms`;
          requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-entering')));
        }
        card.classList.add('is-in');
        card.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
      });
      const bar = tab.closest('.nm-shop__bar');
      if (bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' });
    }));
  });
}

/* ---------- flavour picker ---------- */
export function flavors() {
  $$('[data-nm-flavors]').forEach((root) => {
    const btns = $$('[data-nm-flavor]', root);
    const panels = $$('[data-flavor-panel]', root);
    const imgs = $$('[data-flavor-img]', root);
    btns.forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.nmFlavor;
      if (b.getAttribute('aria-pressed') === 'true') return;
      btns.forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      imgs.forEach((im) => im.classList.toggle('is-active', im.dataset.flavorImg === k));
      root.classList.add('is-switching');
      setTimeout(() => {
        panels.forEach((p) => { p.hidden = p.dataset.flavorPanel !== k; });
        root.classList.remove('is-switching');
      }, reduced() ? 0 : 220);
    }));
  });
}

/* ---------- bundle builder ---------- */
export function bundle() {
  $$('[data-nm-bundle]').forEach((root) => {
    const boxes = $$('[data-nm-bundle-item]', root);
    const totalEl = $('[data-nm-bundle-total]', root);
    const saveEl = $('[data-nm-bundle-save]', root);
    const countEl = $('[data-nm-bundle-count]', root);
    const btn = $('[data-nm-bundle-add]', root);
    const sync = () => {
      const on = boxes.filter((b) => b.checked);
      const total = on.reduce((s, b) => s + Number(b.dataset.price), 0);
      const regular = on.reduce((s, b) => s + Number(b.dataset.regular), 0);
      totalEl.textContent = store.money(total);
      countEl.textContent = store.arabicDigits(on.length);
      const saved = regular - total;
      saveEl.hidden = saved < 1;
      saveEl.textContent = saved >= 1 ? `${saveEl.dataset.label || 'وفّرت'} ${store.money(saved)}` : '';
      btn.disabled = !on.length;
    };
    boxes.forEach((b) => b.addEventListener('change', sync));
    btn.addEventListener('click', async () => {
      const on = boxes.filter((b) => b.checked);
      if (!on.length || btn.classList.contains('is-busy')) return;
      btn.classList.add('is-busy');
      try {
        for (const b of on) {
          const fake = document.createElement('button');
          Object.assign(fake.dataset, { nmAdd: b.dataset.id, name: b.dataset.name, image: b.dataset.image, url: b.dataset.url, price: b.dataset.price });
          // eslint-disable-next-line no-await-in-loop
          await addOne(fake, { silent: true });
        }
        btn.classList.add('is-done');
        setTimeout(() => btn.classList.remove('is-done'), 1400);
        openDrawer();
      } finally {
        btn.classList.remove('is-busy');
      }
    });
    sync();
  });
}

export { reveals };
