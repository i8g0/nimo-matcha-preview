/** Product page: gallery, quantity, value-per-cup, sticky buy bar. */
import { cupsInfo } from './card.js';
import { money, arabicDigits } from './store.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function gallery() {
  const root = $('[data-nm-gallery]');
  if (!root) return;
  const track = $('[data-nm-gallery-track]', root);
  const thumbs = $$('[data-nm-thumb]', root);
  const dots = $$('.nm-gallery__dots i', root);
  const slides = $$('.nm-gallery__slide', track);
  if (slides.length < 2) return;
  const go = (k) => slides[k]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  const mark = (k) => {
    thumbs.forEach((t, j) => t.classList.toggle('is-active', j === k));
    dots.forEach((d, j) => d.classList.toggle('is-active', j === k));
  };
  thumbs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.nmThumb))));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > 0.6) mark(slides.indexOf(e.target)); });
  }, { root: track, threshold: [0.6] });
  slides.forEach((s) => io.observe(s));
  track.addEventListener('keydown', (e) => {
    const cur = thumbs.findIndex((t) => t.classList.contains('is-active'));
    const rtl = document.dir === 'rtl';
    if (e.key === 'ArrowLeft') go(Math.max(0, Math.min(slides.length - 1, cur + (rtl ? 1 : -1))));
    if (e.key === 'ArrowRight') go(Math.max(0, Math.min(slides.length - 1, cur + (rtl ? -1 : 1))));
  });
}

export function quantity() {
  const box = $('[data-nm-qty]');
  if (!box) return;
  const input = $('[data-nm-qty-input]', box);
  const max = Number(input.max) || 10;
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    input.value = Math.max(1, Math.min(max, (Number(input.value) || 1) + Number(b.dataset.step)));
  });
  input.addEventListener('change', () => { input.value = Math.max(1, Math.min(max, Number(input.value) || 1)); });
}

/** "~40 cups" and "2.2 SAR per cup", from the weight in the product name. */
export function value() {
  const root = $('[data-nm-product]');
  const box = $('[data-nm-value]');
  if (!root || !box) return;
  const info = cupsInfo(root.dataset.name, root.dataset.price);
  if (!info) return;
  $('[data-nm-value-cups]', box).textContent = `~${arabicDigits(info.cups)}`;
  $('[data-nm-value-per]', box).textContent = money(info.perCup.toFixed(2));
  box.hidden = false;
}

/** Buy bar slides in once the main add button scrolls away. */
export function buybar() {
  const bar = $('[data-nm-buybar]');
  const main = $('[data-nm-main-add]');
  if (!bar || !main) return;
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0;
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', on ? 'false' : 'true');
    $$('button', bar).forEach((b) => (on ? b.removeAttribute('tabindex') : b.setAttribute('tabindex', '-1')));
  }).observe(main);
}
