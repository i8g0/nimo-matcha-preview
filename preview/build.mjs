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
  const DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const ar = (s) => String(s).replace(/[0-9]/g, (d) => DIGITS[d]);
  Twig.extendFilter('asset', (name) => `/assets/${name}`);
  Twig.extendFilter('cdn', (url) => url);
  Twig.extendFilter('money', (n) => {
    const v = Number(n) || 0;
    const s = v % 1 === 0 ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${ar(s).replace(/,/g, '٬').replace(/\./g, '٫')} ر.س`;
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
  const { store, products, home, menus, comments, categories } = await import(dataUrl);

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
      '<script src="/preview/salla-mock.js"></script>',
      '<link rel="stylesheet" href="/preview/salla-mock.css">',
    ].join('\n    '),
    'body:end': '<span class="pv-badge" aria-hidden="true">معاينة · لم يُطبَّق على المتجر</span>',
  };

  sallaTwig(locale);
  const count = loadTemplates();

  /* values the manager would set in Salla's theme settings (preview only) */
  const PREVIEW_SETTINGS = {
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
  console.log(`✓ built ${count} templates → ${products.length + Object.keys(categories).length + 3} pages in ${Date.now() - started}ms`);
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
