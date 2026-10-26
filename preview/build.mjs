/**
 * Renders the Salla theme (theme/) into a static site (dist/) for the Vercel preview.
 * It plays Salla's part: loads twilight.json defaults, fills them with the demo store,
 * provides Salla's Twig helpers (asset, money, trans, link, component, hook) and injects
 * the SDK stand-in. The theme folder itself stays untouched and ships to Salla as-is.
 *
 *   npm run build         one build
 *   npm run dev           rebuild on change + serve at http://localhost:5500
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Twig from 'twig';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME = path.join(ROOT, 'theme');
const VIEWS = path.join(THEME, 'src', 'views');
/* a fresh version on every build, so browsers never show yesterday's styles after a deploy */
const VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Date.now().toString(36);
const ASSETS = path.join(THEME, 'src', 'assets');
const PREVIEW = path.join(ROOT, 'preview');
const DIST = path.join(ROOT, 'dist');

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));

/* fs.cpSync kills the process on Windows paths with Arabic folder names, so copy by hand. */
const copyDir = (from, to) => walk(from).forEach((file) => {
  const dest = path.join(to, path.relative(from, file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
});

/* ---------- Salla's Twig dialect ---------- */

function sallaTwig(locale) {
  Twig.cache(false);
  Twig.extendFilter('asset', (name) => `/assets/${name}?v=${VERSION}`);
  Twig.extendFilter('cdn', (url) => url);
  Twig.extendFilter('money', (n) => {
    const v = Number(n) || 0;
    const s = v % 1 === 0 ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${s} ر.س`;
  });
  Twig.extendFunction('trans', (key) => key.split('.').reduce((o, k) => (o ? o[k] : undefined), locale) ?? key);
  Twig.extendFunction('link', (name) => ({ cart: '/cart', home: '/' }[name] ?? `/${name}`));
  Twig.extendFunction('__hook', (name) => HOOKS[name] || '');
  /* PHP Twig's include() function (Salla supports it); the preview only needs it for small helper partials */
  Twig.extendFunction('include', (name, ctx = {}) => Twig.twig({ ref: name }).render({ ...BASE, ...ctx }));
}

/* Salla tags → plain Twig the JS engine understands. */
const preprocess = (src) => src
  .replace(/{%\s*component\s+home\s*%}/g, '{% for __c in __home %}{% include __c.path with __c.ctx %}{% endfor %}')
  .replace(/{%\s*component\s+'([\w.-]+)'\s*%}/g, "{% include 'components.$1' %}")
  .replace(/{%\s*hook\s+'?([\w:.-]+)'?\s*%}/g, "{{ __hook('$1') }}");

function loadTemplates() {
  const files = walk(VIEWS).filter((f) => f.endsWith('.twig'));
  let loaded = 0;
  files.forEach((file) => {
    const id = path.relative(VIEWS, file).replace(/\.twig$/, '').split(path.sep).join('.');
    try {
      Twig.twig({ id, data: preprocess(fs.readFileSync(file, 'utf8')), allowInlineIncludes: true, rethrow: true });
      loaded += 1;
    } catch {
      /* Raed's pages the preview never renders may use PHP-Twig-only syntax (arrow functions): skip them */
    }
  });
  return loaded;
}

/* ---------- twilight.json defaults + merchant values ---------- */

const pickValue = (field) => {
  if (field.type === 'collection') {
    return (field.value || []).map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k.split('.').pop(), v])));
  }
  if (field.format === 'dropdown-list' && field.source === 'Manual') return field.selected?.[0]?.value ?? null;
  if (field.type === 'items') return field.value ?? [];
  return field.value ?? null;
};

function componentContext(def, values, index) {
  const component = {};
  def.fields.filter((f) => f.type !== 'static').forEach((f) => { component[f.id] = pickValue(f); });
  Object.entries(values).forEach(([k, v]) => {
    if (Array.isArray(v) && Array.isArray(component[k]) && v.length && typeof v[0] === 'object' && !v[0].id) {
      component[k] = v.map((row, i) => ({ ...(component[k][i] || {}), ...row }));
    } else {
      component[k] = v;
    }
  });
  return { component, componentId: `${def.path}-${index}`, position: index };
}

/* ---------- build ---------- */

let HOOKS = {};
let BASE = {};
const SORTS = [
  { id: 'ourSuggest', name: 'المقترح', is_selected: true },
  { id: 'bestSell', name: 'الأكثر مبيعًا', is_selected: false },
  { id: 'priceFromLowToTop', name: 'الأقل سعرًا', is_selected: false },
  { id: 'priceFromTopToLow', name: 'الأعلى سعرًا', is_selected: false },
];

async function build() {
  const started = Date.now();
  const twilight = JSON.parse(fs.readFileSync(path.join(THEME, 'twilight.json'), 'utf8'));
  const locale = JSON.parse(fs.readFileSync(path.join(THEME, 'src', 'locales', 'ar.json'), 'utf8'));
  const dataUrl = `${pathToFileURL(path.join(PREVIEW, 'store', 'data.mjs')).href}?t=${Date.now()}`;
  const { store, products, home, showcase, menus, comments, categories } = await import(dataUrl);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

  /* theme assets: same entry points as Raed (app/home/product/cart) */
  await esbuild.build({
    entryPoints: ['nm-app', 'nm-home', 'nm-product', 'nm-listing', 'nm-cart'].map((n) => path.join(ASSETS, 'js', `${n}.js`)),
    outdir: path.join(DIST, 'assets'),
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    logLevel: 'warning',
  });
  await esbuild.build({
    entryPoints: [path.join(ASSETS, 'styles', 'nm.css')],
    outfile: path.join(DIST, 'assets', 'nm-app.css'),
    bundle: true,
    minify: true,
    logLevel: 'warning',
  });
  copyDir(path.join(ASSETS, "images"), path.join(DIST, "assets", "images"));
  if (fs.existsSync(path.join(PREVIEW, 'store', 'media'))) copyDir(path.join(PREVIEW, 'store', 'media'), path.join(DIST, 'media'));
  fs.mkdirSync(path.join(DIST, 'preview'), { recursive: true });
  fs.copyFileSync(path.join(PREVIEW, 'salla-mock.js'), path.join(DIST, 'preview', 'salla-mock.js'));
  fs.copyFileSync(path.join(PREVIEW, 'salla-mock.css'), path.join(DIST, 'preview', 'salla-mock.css'));

  /* what Salla would inject through hooks */
  const catalog = products.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, url: p.url, image: p.image, images: p.images,
    price: p.price, sale_price: p.sale_price, regular_price: p.regular_price, is_on_sale: p.is_on_sale,
    is_available: p.is_available, category: p.category, promotion_title: p.promotion_title, rating: p.rating,
  }));
  HOOKS = {
    'head:start': [
      '<title>__TITLE__</title>',
      '<meta name="description" content="نيمو ماتشا: ماتشا يابانية احتفالية فاخرة، نكهات، بوكسات هدايا وأدوات تحضير. توصيل سريع لكل مدن المملكة.">',
      `<link rel="icon" href="${store.logo}">`,
      '<meta name="robots" content="noindex">',
      `<script>window.__NM_PREVIEW__=${JSON.stringify({ products: catalog, menus, comments, categories })};</script>`,
      `<script src="/preview/salla-mock.js?v=${VERSION}"></script>`,
      `<link rel="stylesheet" href="/preview/salla-mock.css?v=${VERSION}">`,
    ].join('\n    '),
    'body:end': '<span class="pv-badge" aria-hidden="true">معاينة · لم يُطبَّق على المتجر</span>',
  };

  sallaTwig(locale);
  const count = loadTemplates();

  /* values the manager would set in Salla's theme settings (preview only) */
  const PREVIEW_SETTINGS = {
    /* the live store has no announcement bar */
    announcement_1: '', announcement_2: '', announcement_3: '',
    whatsapp: 'https://wa.me/',
    footer_about: 'نأخذك في رحلة إلى عالم الماتشا اليابانية، من خلال منتجات مختارة بعناية تجمع بين الجودة العالية والمذاق الأصيل، لنمنحك تجربة تحضير سهلة ومتكاملة في كل كوب.',
    popup_enabled: true,
    popup_image: 'https://cdn.files.salla.network/other/1190649360/8fd78ea4-ffda-4b1c-85b4-80f0eedc12f0-original.webp',
    popup_badge: 'شكرًا لاختيارك نيمو',
    popup_title: 'احصل على العروض المميزة',
    popup_accent: 'اللي تحتاجها',
    popup_text: 'الحق العرض الحين: بوكس 3 ماتشا + سيروب بخصم 33%.',
    popup_product: [{ value: 1923600463, label: 'بوكس 3 ماتشا وسيروب فانيليا 50 مل' }],
    popup_button: 'تسوّق الآن',
    popup_url: '/category/offers',
    popup_delay: 4,
    popup_frequency: 'session',
    upsell_products: ['vanilla-syrup-50ml', 'nimo-cup-green', 'nimo-matcha-tin', 'salted-caramel-syrup-50ml']
      .map((slug) => products.find((p) => p.slug === slug)).map((p) => ({ value: p.id, label: p.name })),
  };
  const theme = {
    is_rtl: true,
    color: { primary: '#EB6A1F', reverse_text: '#FFFFFF', darker: () => '#C4520F', lighter: () => '#F49A5E' },
    settings: {
      get: (key, fallback = null) => {
        if (key in PREVIEW_SETTINGS) return PREVIEW_SETTINGS[key];
        const f = twilight.settings.find((s) => s.id === key);
        return f && f.value !== undefined && f.value !== null ? f.value : fallback;
      },
      set: () => '',
    },
  };
  /* __preview hides Raed's scripts (they need the real Salla SDK); Raed's compiled CSS is still used */
  const base = { store, theme, language: { code: 'ar' }, user: { type: 'guest' }, __preview: true };
  BASE = base;
  const raedCss = path.join(THEME, 'public', 'app.css');
  if (fs.existsSync(raedCss)) fs.copyFileSync(raedCss, path.join(DIST, 'assets', 'app.css'));

  const render = (id, ctx, out) => {
    const title = ctx.page.slug === 'index' ? `${store.name} — ماتشا يابانية احتفالية` : `${ctx.page.title} — ${store.name}`;
    const html = Twig.twig({ ref: id }).render({ ...base, ...ctx }).replace('__TITLE__', title);
    const file = path.join(DIST, out);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  };

  const __home = home.map((entry, i) => {
    const def = twilight.components.find((c) => c.path === entry.path);
    if (!def) throw new Error(`Unknown component ${entry.path}`);
    return { path: `components.${entry.path}`, ctx: componentContext(def, entry.values, i) };
  });
  render('pages.index', { page: { title: store.name, slug: 'index' }, __home }, 'index.html');
  /* showcase: every section with a numbered label and an index at the top (the popup stays off here) */
  Twig.twig({ id: 'pv.label', data: '<div class="pv-label" id="s-{{ n }}"><div class="nm-container"><span class="pv-label__n">{{ n }}</span><div><b>{{ name }}</b><small>{{ note }}</small></div><a href="#pv-top" aria-label="الفهرس">↑</a></div></div>' });
  Twig.twig({ id: 'pv.index', data: '<section class="pv-index" id="pv-top"><div class="nm-container"><span class="nm-eyebrow">NIMO MATCHA THEME</span><h1>كل أقسام <span>ثيم نيمو</span></h1><p>{{ count }} قسمًا يضيفها مدير المتجر من محرّر الثيم في سلة، ويغيّر نصوصها وصورها ومنتجاتها بدون كود. اضغط على أي قسم للانتقال له.</p><ol>{% for it in items %}<li><a href="#s-{{ loop.index }}"><i>{{ loop.index }}</i>{{ it.name }}</a></li>{% endfor %}</ol><div class="pv-index__extra"><b>ومعها في كل المتجر:</b> وضع فاتح وداكن، زر واتساب عائم، زر الرجوع للأعلى، سلة جانبية مع شريط الشحن المجاني، نافذة عروض منبثقة، حركة خفيفة تراعي الأجهزة الضعيفة، وفي صفحة المنتج: سعر الكوب الواحد، مدة التوصيل، تنبيه الكمية القليلة و«شاهدتها مؤخرًا».</div></div></section>' });
  const showTheme = { ...theme, settings: { ...theme.settings, get: (k, f) => (k === 'popup_enabled' ? false : theme.settings.get(k, f)) } };
  const __showcase = [{ path: 'pv.index', ctx: { items: showcase.map((e) => e.label), count: showcase.length } }];
  showcase.forEach((entry, i) => {
    const def = twilight.components.find((c) => c.path === entry.path);
    if (!def) throw new Error(`Unknown component ${entry.path}`);
    __showcase.push({ path: 'pv.label', ctx: { n: i + 1, ...entry.label } });
    __showcase.push({ path: `components.${entry.path}`, ctx: componentContext(def, entry.values, i) });
  });
  const showcaseCtx = { page: { title: 'كل أقسام الثيم', slug: 'index' }, __home: __showcase, theme: showTheme };
  render('pages.index', showcaseCtx, 'showcase.html');
  render('pages.index', showcaseCtx, 'components.html');

  products.forEach((product) => {
    render('pages.product.single', { page: { title: product.name, slug: 'product.single' }, product }, `product/${product.slug}.html`);
  });

  render('pages.product.index', { page: { title: 'كل المنتجات', slug: 'product.index', id: 'all' }, sort_options: SORTS }, 'products.html');
  Object.entries(categories).forEach(([key, cat]) => {
    render('pages.product.index', { page: { title: cat.name, slug: 'product.index', id: key }, category: cat, sort_options: SORTS }, `category/${key}.html`);
  });

  render('pages.cart', {
    page: { title: 'السلة', slug: 'cart' },
    cart: { items: [], sub_total: 0, total: 0, count: 0, free_shipping_bar: null },
  }, 'cart.html');

  fs.writeFileSync(path.join(DIST, '404.html'), fs.readFileSync(path.join(DIST, 'index.html')));
  if (process.env.VERCEL || process.argv.includes('--local-media')) await localMedia();
  console.log(`✓ built ${count} templates → ${products.length + Object.keys(categories).length + 3} pages in ${Date.now() - started}ms`);
}

/* ---------- local media ----------
   On Vercel the store's photos and films are downloaded once at build time and served from the preview
   itself (dist/media), so every page shows its pictures even when the store's CDN is slow or blocked.
   A file that cannot be fetched keeps its original address. */
async function localMedia() {
  const pages = walk(DIST).filter((f) => f.endsWith('.html'));
  const re = /https:\/\/cdn\.(?:files\.salla\.network|salla\.sa)\/[^"'\s)<>]+?\.(?:webp|jpe?g|png|mp4)/g;
  const urls = new Set();
  pages.forEach((f) => (fs.readFileSync(f, 'utf8').match(re) || []).forEach((u) => urls.add(u)));
  const dir = path.join(DIST, 'media', 'store');
  fs.mkdirSync(dir, { recursive: true });
  const map = new Map();
  const list = [...urls];
  const crypto = await import('node:crypto');
  const one = async (u) => {
    const name = `${crypto.createHash('sha1').update(u).digest('hex').slice(0, 16)}${path.extname(u)}`;
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) return;
      fs.writeFileSync(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
      map.set(u, `/media/store/${name}`);
    } catch { /* keep the CDN address */ }
  };
  for (let i = 0; i < list.length; i += 8) await Promise.all(list.slice(i, i + 8).map(one));
  if (!map.size) { console.log('local media: none fetched, CDN addresses kept'); return; }
  pages.forEach((f) => {
    const html = fs.readFileSync(f, 'utf8').replace(re, (u) => map.get(u) || u);
    fs.writeFileSync(f, html);
  });
  console.log(`local media: ${map.size}/${list.length} files served from the preview`);
}

/* ---------- dev server ---------- */

function serve(port = 5500) {
  const types = { '.webp': 'image/webp', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.svg': 'image/svg+xml', '.json': 'application/json' };
  http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = path.join(DIST, p);
    if (!path.extname(file) && fs.existsSync(`${file}.html`)) file = `${file}.html`;
    if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    const type = types[path.extname(file)] || 'application/octet-stream';
    const size = fs.statSync(file).size;
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (range) { /* videos need byte ranges to seek (loop points) */
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-store' });
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`→ http://localhost:${port}`));
}

await build();

if (process.argv.includes('--watch')) {
  serve(Number(process.env.PORT) || 5500);
  let timer;
  [THEME, PREVIEW].forEach((dir) => fs.watch(dir, { recursive: true }, (_event, file) => {
    /* Raed's toolchain output (node_modules, public/) is not a source: ignore it */
    if (file && /node_modules|(^|[\\/])public[\\/]/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((e) => console.error('✗', e.message)), 150);
  }));
}
