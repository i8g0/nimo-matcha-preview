/** The frame around every page: announcement, header, side menu, category tabs, search. */
import { openSearch } from './store.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** The announcement is a CSS marquee; nothing to run. Kept so older entry points keep working. */
export function announce() {}

/** Sticky header that steps aside while reading down and returns on the way up. */
export function header() {
  const el = $('[data-nm-header]');
  if (!el) return;
  let last = scrollY;
  let ticking = false;
  const update = () => {
    const y = scrollY;
    el.classList.toggle('is-scrolled', y > 8);
    const menuOpen = !$('[data-nm-menu]')?.hidden;
    if (!menuOpen && y > 240 && y > last + 4) el.classList.add('is-hidden');
    else if (y < last - 4 || y < 240) el.classList.remove('is-hidden');
    last = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

export function menu() {
  const m = $('[data-nm-menu]');
  if (!m) return;
  let lastFocus;
  const open = () => {
    lastFocus = document.activeElement;
    m.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('is-open')));
    document.documentElement.classList.add('nm-locked');
    $$('[data-nm-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => $('[data-nm-menu-close]', m)?.focus(), 80);
  };
  const close = () => {
    m.classList.remove('is-open');
    document.documentElement.classList.remove('nm-locked');
    $$('[data-nm-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    setTimeout(() => { m.hidden = true; }, 480);
    lastFocus?.focus?.();
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-nm-menu-open]')) { e.preventDefault(); open(); }
    else if (e.target.closest('[data-nm-menu-close]')) close();
    else if (!m.hidden && e.target.closest('.nm-menu__nav a')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !m.hidden) close(); });
}

export function search() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-nm-search]')) { e.preventDefault(); openSearch(); }
  });
}

/** Turns the Salla menu links inside [data-nm-catbar] into tabs and marks the current one. */
export function catbars() {
  const here = decodeURI(location.pathname).replace(/\/$/, '');
  const style = (bar) => {
    const links = $$('a', bar);
    if (!links.length) return false;
    links.forEach((a) => {
      a.classList.add('nm-tab');
      let path = '';
      try { path = decodeURI(new URL(a.href, location.href).pathname).replace(/\/$/, ''); } catch { /* ignore */ }
      const active = path && path === here;
      a.classList.toggle('is-active', active);
      if (active) {
        a.setAttribute('aria-current', 'page');
        requestAnimationFrame(() => a.scrollIntoView({ inline: 'center', block: 'nearest' }));
      }
    });
    return true;
  };
  $$('[data-nm-catbar]').forEach((bar) => {
    if (style(bar)) return;
    /* <salla-menu> renders after its data loads */
    const mo = new MutationObserver(() => { if (style(bar)) mo.disconnect(); });
    mo.observe(bar, { childList: true, subtree: true });
  });
}
