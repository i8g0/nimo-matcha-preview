/** Light motion shared by every page: scroll reveals, product rails, lazy videos, countdowns. */
import { arabicDigits } from './store.js';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let io;
export function reveals(root = document) {
  const items = $$('[data-reveal]:not(.is-in)', root);
  if (!('IntersectionObserver' in window) || reduced()) { items.forEach((el) => el.classList.add('is-in')); return; }
  io = io || new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => io.observe(el));
}

/** Rails: arrows (anywhere in the same section) scroll by one viewport of cards; arrows disable at the ends. */
export function rails(root = document) {
  $$('[data-nm-rail]:not([data-ready])', root).forEach((rail) => {
    rail.dataset.ready = '1';
    const track = rail.querySelector('[data-nm-rail-track]');
    const scope = rail.closest('section') || rail;
    const prev = scope.querySelector('[data-nm-rail-prev]');
    const next = scope.querySelector('[data-nm-rail-next]');
    if (!track) return;
    const rtl = getComputedStyle(track).direction === 'rtl';
    const max = () => track.scrollWidth - track.clientWidth;
    const pos = () => Math.abs(track.scrollLeft);
    const sync = () => {
      if (prev) prev.disabled = pos() < 4;
      if (next) next.disabled = pos() > max() - 4;
    };
    const go = (dir) => {
      const step = track.clientWidth * 0.85 * dir * (rtl ? -1 : 1);
      track.scrollBy({ left: step, behavior: reduced() ? 'auto' : 'smooth' });
    };
    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    addEventListener('resize', sync);
    sync();
  });
}

/** Videos load and play only while on screen. */
export function videos(root = document) {
  const list = $$('video[data-nm-video]:not([data-ready])', root);
  if (!list.length) return;
  const vio = new IntersectionObserver((entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        if (!reduced()) v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { threshold: 0.25 });
  list.forEach((v) => { v.dataset.ready = '1'; vio.observe(v); });
}

/** Countdown to the end of the given day (store time ≈ Riyadh, UTC+3). Hides itself when the date passes. */
export function timers(root = document) {
  $$('[data-nm-timer]:not([data-ready])', root).forEach((el) => {
    el.dataset.ready = '1';
    const raw = el.dataset.nmTimer;
    const end = Date.parse(/T/.test(raw) ? raw : `${raw}T23:59:59+03:00`);
    if (!end) return;
    const pad = (n) => arabicDigits(String(n).padStart(2, '0'));
    const part = (k) => el.querySelector(`[data-${k}]`);
    const tick = () => {
      const left = end - Date.now();
      if (left <= 0) { el.hidden = true; clearInterval(timer); return; }
      el.hidden = false;
      const s = Math.floor(left / 1000);
      part('d').textContent = pad(Math.floor(s / 86400));
      part('h').textContent = pad(Math.floor((s % 86400) / 3600));
      part('m').textContent = pad(Math.floor((s % 3600) / 60));
      part('s').textContent = pad(s % 60);
    };
    const timer = setInterval(tick, 1000);
    tick();
  });
}
