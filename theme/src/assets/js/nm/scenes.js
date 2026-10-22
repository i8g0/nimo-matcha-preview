/**
 * Cinematic scenes (home hero). Every scene is one screen tall; while you scroll, the next scene is
 * uncovered from beneath with depth parallax, the leaving one sinks into shadow, and the scene that owns
 * the stage gets its title (word by word), a warm light sweep and its film playing.
 * Films load lazily (desktop or portrait file) and only the one on screen plays.
 */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const portrait = matchMedia('(orientation: portrait)');

/** Wraps every word of [data-words] so titles can rise one word at a time. */
function splitWords(root) {
  let n = 0;
  $$('[data-words]', root).forEach((line) => {
    const words = line.textContent.trim().split(/\s+/);
    line.setAttribute('aria-label', line.textContent.trim());
    line.innerHTML = words.map((w) => {
      const i = n; n += 1;
      return `<span class="nm-w" aria-hidden="true"><span style="--wi:${i}">${w.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</span></span>`;
    }).join(' ');
  });
}

export function scenes() {
  const root = $('[data-nm-scenes]');
  if (!root) return;
  const list = $$('.nm-scene', root);
  const dots = $$('[data-scene-go]', root);
  const progress = $('[data-scene-progress]', root);
  const nav = $('[data-scene-dots]', root);
  let current = -1;
  let ticking = false;

  list.forEach(splitWords); /* word delays restart in every scene */

  /* each scene fills the screen under the sticky header */
  const header = $('[data-nm-header]');
  const fit = () => root.style.setProperty('--nm-chrome', `${header ? header.offsetHeight : 0}px`);
  fit();
  addEventListener('resize', fit);

  /* ---------- films ---------- */
  const videos = list.map((s) => $('video', s));
  const pickSrc = (v) => (portrait.matches && v.dataset.srcMobile) || v.dataset.src;
  const pickPoster = (v) => (portrait.matches && v.dataset.posterMobile) || v.dataset.poster || '';
  videos.forEach((v) => { if (v) v.poster = pickPoster(v); });
  const load = (v) => {
    if (!v || v.dataset.loaded || reduced) return;
    const src = pickSrc(v);
    if (!src) return;
    v.dataset.loaded = '1';
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.src = src;
    v.preload = 'auto';
    v.addEventListener('playing', () => v.closest('.nm-scene').classList.add('has-video'), { once: true });
  };
  const play = (v) => {
    if (!v || reduced) return;
    load(v);
    if (!v.paused || !root.classList.contains('is-ready')) return;
    const p = v.play();
    if (p) p.catch(() => {});
  };
  const pause = (v) => { if (v && !v.paused) v.pause(); };

  const setCurrent = (i) => {
    if (i === current) return;
    current = i;
    list.forEach((s, j) => s.classList.toggle('is-current', j === i));
    dots.forEach((d, j) => {
      d.classList.toggle('is-active', j === i);
      d.setAttribute('aria-current', j === i ? 'true' : 'false');
    });
    load(videos[i + 1]);
  };

  /* ---------- per-frame choreography ---------- */
  const parts = list.map((s) => ({ media: $('.nm-scene__media', s), shade: $('.nm-scene__shade', s), copy: $('.nm-scene__copy', s) }));
  const frame = () => {
    ticking = false;
    const vh = innerHeight;
    let best = 0;
    let bestDist = Infinity;
    list.forEach((scene, i) => {
      const r = scene.getBoundingClientRect().top / vh; /* 1 waiting below, 0 on stage, -1 gone above */
      const dist = Math.abs(r);
      if (dist < bestDist) { bestDist = dist; best = i; }
      if (r >= 0.98 || r <= -0.98) pause(videos[i]); else play(videos[i]);
      if (r > 1.05 || r < -1.05 || reduced) return;
      const { media, shade: shadeEl, copy } = parts[i];
      let y = 0;
      let scale = 1;
      let shade = 0;
      if (r > 0) { y = -r * vh * 0.72; scale = 1 + r * 0.14; } else { y = -r * vh * 0.42; scale = 1 - r * 0.06; shade = Math.min(0.72, -r * 0.9); }
      media.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      if (shadeEl) shadeEl.style.opacity = shade.toFixed(3);
      const lift = Math.max(0, -r);
      if (copy) {
        copy.style.transform = `translate3d(0, ${(lift * -90).toFixed(1)}px, 0)`;
        copy.style.opacity = Math.max(0, 1 - lift * 1.6).toFixed(3);
      }
    });
    setCurrent(best);
    const rect = root.getBoundingClientRect();
    const span = rect.height - vh;
    const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
    if (progress) progress.style.transform = `scaleY(${p.toFixed(4)})`;
    nav?.classList.toggle('is-on', rect.top < vh * 0.5 && rect.bottom > vh * 0.5);
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);

  dots.forEach((dot) => dot.addEventListener('click', () => {
    list[Number(dot.dataset.sceneGo)].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  /* the picture drifts gently toward the cursor (desktop) */
  if (finePointer && !reduced) {
    let mx = 0; let my = 0; let cx = 0; let cy = 0; let raf = 0;
    const drift = () => {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      root.style.setProperty('--dx', `${cx.toFixed(2)}px`);
      root.style.setProperty('--dy', `${cy.toFixed(2)}px`);
      raf = Math.abs(mx - cx) + Math.abs(my - cy) > 0.05 ? requestAnimationFrame(drift) : 0;
    };
    root.addEventListener('pointermove', (e) => {
      mx = (e.clientX / innerWidth - 0.5) * -26;
      my = (e.clientY / innerHeight - 0.5) * -18;
      if (!raf) raf = requestAnimationFrame(drift);
    });
  }

  setTimeout(() => { root.classList.add('is-ready'); frame(); }, 60);
  frame();
  dust($('[data-nm-dust]', root));
}

/** Fine matcha dust floating up through the light of the first scene (desktop only). */
function dust(canvas) {
  if (!canvas || reduced || !finePointer) { canvas?.remove(); return; }
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  let w = 0; let h = 0; let parts = []; let running = true;
  const COLORS = ['244, 154, 94', '201, 220, 160', '255, 226, 196'];
  const spawn = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: Math.random() * 1.6 + 0.4,
    v: Math.random() * 0.35 + 0.12,
    drift: (Math.random() - 0.5) * 0.25,
    a: Math.random() * 0.5 + 0.15,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
    phase: Math.random() * Math.PI * 2,
  });
  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: Math.round(Math.min(70, (w * h) / 14000)) }, () => spawn(true));
  };
  const frame = (t) => {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    parts.forEach((p, i) => {
      p.y -= p.v;
      p.x += p.drift + Math.sin(t / 1600 + p.phase) * 0.15;
      if (p.y < -10) parts[i] = spawn(false);
      const tw = 0.6 + 0.4 * Math.sin(t / 700 + p.phase);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.c}, ${(p.a * tw).toFixed(3)})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(frame);
  };
  resize();
  addEventListener('resize', resize);
  new IntersectionObserver(([e]) => {
    const was = running;
    running = e.isIntersecting;
    if (running && !was) requestAnimationFrame(frame);
  }).observe(canvas);
  requestAnimationFrame(frame);
}
