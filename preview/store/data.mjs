/**
 * Demo store for the Vercel preview, filled with Nimo Matcha's real catalogue (names, prices, discounts,
 * photos, categories, published reviews) read from the Salla store on 2026-10-22. Shapes follow Salla's Twig
 * variables (store.*, product.*), so the theme renders exactly as it will on Salla.
 * None of this ships with the theme: on Salla, products and media come from the dashboard.
 */

const CDN = 'https://cdn.salla.sa/dPArAy/';
const FILES = 'https://cdn.files.salla.network/other/1190649360/';
const img = (f) => `${CDN}${f}`;
const life = (f) => `${FILES}${f}-original.webp`;

export const media = {
  logo: life('a39e1b76-3b69-445b-a3b1-96a0e85c1d5a'),
  darkStone: life('b31847c3-aaa9-4070-aa18-c8e9cb386a97'),
  pinkDip: life('8cb75d43-4c60-460d-ab53-b5d145b3991e'),
  mangoPops: life('e5c9d086-56d4-47ee-882c-e929fb9548fb'),
  bedTray: life('5a54bb7d-c6a7-4bfc-a384-462ebc91c0b5'),
  mangoLatte: life('b130d878-951b-424f-bad8-b37b8906664d'),
  vanillaLatte: life('9ece52ae-55c7-4e24-8758-22de0f79104a'),
  sifting: life('06b7af37-207f-4668-bfb4-795619d3bc8a'),
  jarLatte: 'https://cdn.files.salla.network/homepage/1190649360/f02f20ce-f217-4951-8a74-ad4197f97a37-original.webp',
  bowl: life('26cf741d-4af9-4e11-965a-648354b61d4b'),
  blueCup: 'https://cdn.files.salla.network/homepage/1190649360/57658d24-6117-4afa-9dd2-fee3dc445f6d-original.webp',
  handCup: life('b5c46603-456f-4d5d-bb0d-24676cb4b5fa'),
  coconutBowl: life('8d1e2719-2106-4a80-8d0e-ee99c559b9fa'),
  cake: life('e42307b5-083a-48e4-8813-1f6cf8a7c870'),
  field: 'https://cdn.files.salla.network/homepage/1190649360/ea1e7d78-992c-4476-834e-dca982861958_599x900.webp',
  syrups: img('MJFblqy3jsnq5n5QoSseAiVSOXf6GfhyN1P3Ilfv.jpg'),
  bannerWide: life('b43f4d1b-7c22-4090-b36f-055d3078b5b9'),
  bannerMobile: life('c2ea6c3e-d9c7-4746-9235-e00da0ccf82d'),
};

export const store = {
  id: 1190649360,
  name: 'نيمو ماتشا',
  url: '/',
  logo: media.logo,
  settings: { tax: { number: '' } },
  social: { instagram: 'https://www.instagram.com/nimomatcha', tiktok: 'https://www.tiktok.com/@nimomatcha' },
};

export const categories = {
  offers: { name: 'عروض نيمو', url: '/category/offers' },
  boxes: { name: 'بوكسات الماتشا', url: '/category/boxes' },
  matcha: { name: 'اختيارات الماتشا', url: '/category/matcha' },
  tools: { name: 'أدوات التحضير', url: '/category/tools' },
};

export const menus = {
  header: [
    { title: 'كل المنتجات', url: '/products' },
    { title: 'عروض نيمو', url: '/category/offers' },
    { title: 'البوكسات', url: '/category/boxes' },
    { title: 'الماتشا', url: '/category/matcha' },
    { title: 'أدوات التحضير', url: '/category/tools' },
  ],
  footer: [
    { title: 'من نحن', url: '/#about' },
    { title: 'طريقة التحضير', url: '/#ritual' },
    { title: 'الأسئلة الشائعة', url: '/#faq' },
    { title: 'سياسة الاستبدال والاسترجاع', url: '#' },
    { title: 'تواصل معنا', url: 'mailto:info@nimomatcha-sa.com' },
  ],
};

const prep = '<h3>طريقة التحضير</h3><ol><li>ضع حوالي 2 جرام من الماتشا في وعاء التحضير.</li><li>أضف كمية مناسبة من الماء الدافئ، ويفضل ألا يكون مغليًا.</li><li>اخفق الماتشا جيدًا حتى تتكوّن رغوة خفيفة.</li><li>أضف الحليب حسب الرغبة لتحضير ماتشا لاتيه، وللبارد أضف الثلج.</li></ol><h3>طريقة الحفظ</h3><p>تُحفظ في مكان بارد وجاف بعيدًا عن أشعة الشمس والرطوبة، مع إغلاق العبوة جيدًا بعد كل استخدام.</p>';
const syrupDesc = (flavor) => `<p>سيروب ${flavor} بحجم 50 مل لإضافة نكهة ${flavor} إلى الماتشا لاتيه والمشروبات الباردة والساخنة. أضف الكمية حسب ذوقك.</p><ul><li>مناسب مع الماتشا وماتشا لاتيه.</li><li>للمشروبات الساخنة والباردة.</li><li>الحجم: 50 مل.</li></ul>`;

const product = (id, slug, name, cat, price, regular, images, extra = {}) => {
  const list = images.map((f, i) => ({ url: img(f), alt: i ? `${name} ${i + 1}` : name }));
  const onSale = regular > price;
  return {
    id,
    slug,
    name,
    subtitle: '',
    price,
    regular_price: regular,
    sale_price: onSale ? price : 0,
    is_on_sale: onSale,
    is_available: true,
    status: 'sale',
    type: 'product',
    max_quantity: 10,
    url: `/product/${slug}`,
    image: list[0],
    images: list,
    category: categories[cat],
    promotion_title: '',
    rating: null,
    options: [],
    description: '',
    ...extra,
  };
};

export const products = [
  product(416141256, 'nimo-matcha-gift-box', 'بوكس الماتشا 80 جرام + سيروب فانيليا 50 مل', 'boxes', 89, 168,
    ['88e807df-a131-4078-b187-9ad120462413-1000x1000-oYIa4S9s7BLGYbLk1JR7GDh8lRpQ5rsIBvXpw0V3.jpg', 'b96f2b31-165f-47e3-9e07-f4421ddcdb78-1000x1000-SU9o3Xt8nL5T2HcxCBOEaPcSSWfDbE3x6BVaqEAf.png', '837b57b2-5ca7-4fae-901c-bfd60ea52fe9-1000x1000-a50nkPT4vBZfNtDXBpMua0vpZ56qCVGfzgkXdUnu.jpg'],
    { promotion_title: 'الأكثر طلبًا', rating: { stars: 5, count: 5 }, description: `<p>تجربة ماتشا متكاملة في بوكس نيمو: ماتشا احتفالية فاخرة وسيروب فانيليا مع أكواب نيمو وإضافات مميزة. مناسب لك وللإهداء.</p><h3>محتويات البوكس</h3><ul><li>2 × ماتشا احتفالية فاخرة 40 جرام</li><li>1 × سيروب فانيليا 50 مل</li><li>2 × كوب نيمو ماتشا</li><li>كرت شكر وملصقات نيمو</li></ul><h3>عدد الأكواب التقريبي</h3><p>80 جرام تكفي لحوالي 40 كوبًا عند استخدام 2 جرام لكل كوب.</p>${prep}` }),
  product(1923600463, 'matcha-box-3', 'بوكس 3 ماتشا وسيروب فانيليا 50 مل', 'boxes', 139, 210,
    ['e2e987e9-4e5f-4b0a-91fb-17def39cf547-1000x1000-Estk1HtzYfxhqhYT9adKnmKYwp2d6L2i8m3phNpp.jpg'],
    { rating: { stars: 5, count: 1 }, description: `<p>بوكس متكامل لعشاق الماتشا يحتوي على 3 أكياس ماتشا احتفالية فاخرة (40 جرام لكل كيس) مع سيروب فانيليا وكوبين نيمو.</p><h3>محتويات البوكس</h3><ul><li>3 × ماتشا احتفالية فاخرة 40 جرام</li><li>1 × سيروب فانيليا 50 مل</li><li>2 × كوب نيمو ماتشا</li><li>كرت شكر وملصقات</li></ul><p>إجمالي 120 جرام تكفي لحوالي 60 كوبًا.</p>${prep}` }),
  product(334017696, 'ceremonial-matcha-80g', 'ماتشا احتفالية فاخرة 80 جرام', 'offers', 79, 118,
    ['970a33fc-9c0a-4dc1-a5bc-f66787cd2b70-1000x1000-OH1DpeujUZNOMsHuYXd9jjo5MJnsjB6okO1jMoXu.jpg'],
    { rating: { stars: 5, count: 1 }, description: `<p>ماتشا احتفالية فاخرة في كيسين منفصلين (40 جرام لكل كيس) بإجمالي 80 جرام. مسحوق ناعم ولون أخضر طبيعي ونكهة متوازنة.</p><ul><li>ماتشا يابانية</li><li>مناسبة للماتشا التقليدية واللاتيه</li><li>تكفي لحوالي 40 كوبًا</li></ul>${prep}` }),
  product(1377414495, 'ceremonial-matcha-120g', 'ماتشا احتفالية فاخرة 120 جرام', 'offers', 99, 177,
    ['0ac2f5aa-f077-4c5a-8110-f6043e7b9e27-1000x1000-DZilnznYWaRWk1FJlaJSI8XKUsyhzNqgWP74s4es.jpg'],
    { rating: { stars: 5, count: 2 }, description: `<p>3 أكياس ماتشا احتفالية فاخرة (40 جرام لكل كيس) بإجمالي 120 جرام، تكفي لحوالي 60 كوبًا.</p>${prep}` }),
  product(524482394, 'matcha-40g-vanilla-50ml', 'ماتشا احتفالية فاخرة 40 جرام سيروب فانيليا 50 مل', 'offers', 77, 92,
    ['c37e9223-05bc-4bc6-bf6d-ee2bc980d6e5-1000x1000-gH9DeCKNznndeZhVpSHhWLGEFympNXPdg9hBhMUc.png'],
    { description: `<p>ماتشا احتفالية فاخرة 40 جرام مع سيروب فانيليا 50 مل، لتحضير ماتشا لاتيه بالفانيليا في البيت. مع كاسات وملصقات وكرت شكر.</p>${prep}` }),
  product(1664834602, 'organic-ceremonial-matcha-40g', 'ماتشا احتفالية فاخرة عضوية 40 جرام', 'matcha', 59, 59,
    ['01743e1a-a510-4e04-9379-fd8d9d142e8a-1000x1000-dwVIOmxTvqyBOW3thJeyzTglZyTDDFylmzHWDlYh.jpg'],
    { description: `<p>ماتشا يابانية احتفالية فاخرة عضوية بمسحوق ناعم ولون أخضر طبيعي. تكفي لحوالي 20 كوبًا.</p>${prep}` }),
  product(1052151098, 'strawberry-matcha-40g', 'ماتشا الفراولة اللذيذة 40 جرام', 'matcha', 59, 59,
    ['c0f4d762-2671-45d3-9a92-6914ca0903e1-1000x1000-57KcYBZPgG3zbhh2H3bpEWM9DVupxWceQ1tm16MS.jpg'],
    { description: `<p>ماتشا بنكهة الفراولة لتحضير آيس ماتشا لاتيه وردي بطعم فاكهي.</p>${prep}` }),
  product(1799906578, 'mango-matcha-40g', 'ماتشا المانجو اللذيذة 40 جرام', 'matcha', 59, 59,
    ['0700b22e-fc5a-44f0-a9d3-beb7729abf23-1000x1000-rJe6BVq29C3PvaNvQ5iKakJSjxBYCeMhTDNe6kwG.jpg'],
    { description: `<p>ماتشا بنكهة المانجو الاستوائية، مثالية للماتشا لاتيه البارد.</p>${prep}` }),
  product(131309257, 'vanilla-matcha-40g', 'ماتشا الفانيليا اللذيذة 40 جرام', 'matcha', 59, 59,
    ['c1f7163b-6da8-4347-8a91-5531dd26cdaf-1000x1000-5DKefctthVXRhogPG49WqIkLoOziJ4AuHFvw22my.jpg'],
    { description: `<p>ماتشا بنكهة الفانيليا الناعمة، لكوب صباح هادئ ساخن أو بارد.</p>${prep}` }),
  product(1249092586, 'organic-ceremonial-matcha-250g', 'ماتشا احتفالية فاخرة عضوية 250 جرام', 'matcha', 300, 300,
    ['b952860a-f8e1-4548-99f0-381e94bdc7e2-1000x1000-8rcJy7nB44bywp8xd2n4Ftnyjp94A4HSXSitqBoB.png'],
    { description: `<p>كمية اقتصادية لعشاق الماتشا والاستخدام اليومي: 250 جرام ماتشا احتفالية فاخرة.</p>${prep}` }),
  product(583055059, 'organic-ceremonial-matcha-1kg', 'ماتشا احتفالية فاخرة 1كيلو', 'matcha', 1250, 1250,
    ['9607302c-92a5-485d-bbe5-61818d124e0e-1000x1000-NYMIL2T1odvnLJo0xmNLIsyJipTDdwo8vBqGZNFZ.png'],
    { description: `<p>ماتشا احتفالية فاخرة عضوية 1 كيلو، مناسبة للمقاهي والمشاريع والاستخدام المتكرر. تكفي لحوالي 500 كوب.</p>${prep}` }),
  product(1664975696, 'vanilla-syrup-50ml', 'سيروب فانيليا Vanilla Syrup 50ml', 'tools', 33, 50,
    ['b1df3214-7532-4033-868a-a642621d471d-1000x1000-Sh8AA89aF0ULRvp1Eu3iAEyVZijYxeoorwsmkcuI.png'], { description: syrupDesc('الفانيليا') }),
  product(583525335, 'salted-caramel-syrup-50ml', 'سيروب كراميل مملح 50ml', 'tools', 33, 50,
    ['eab22691-d296-4370-9c11-95a1248a24c4-1000x1000-GMitz5zTPgiI4lFzllEJGjwVv4D9fpAuYmoIUdel.png'], { rating: { stars: 5, count: 1 }, description: syrupDesc('الكراميل المملح') }),
  product(587783590, 'strawberry-syrup-50ml', 'سيروب فراولة 50مل', 'tools', 33, 50,
    ['ba179060-6861-40e9-a619-d218725f4e24-1000x1000-UU8qvN5XvZmy6GbKxlQ9kUenBEsjlQVY5NyAkkXj.jpg'], { description: syrupDesc('الفراولة') }),
  product(1075574796, 'berry-syrup-50ml', 'سيروب توت 50مل', 'tools', 50, 50,
    ['fa4c197e-21db-4fbb-9424-57df16aec0a4-1000x1000-2ecjt4FO87VKo5OUHuxU545Vjmgkt1Yb5I85aZn7.jpg'], { description: syrupDesc('التوت') }),
  product(2059728866, 'nimo-matcha-tin', 'حافظة نيمو للماتشا', 'tools', 24, 24,
    ['b77bd929-3dc6-4208-9ea5-182eccb0b54c-1000x1000-RhstZGjWGrdGmWsb18LeKbH2HD47Fll4dzCiGalM.png', '59ba9088-ed27-45e8-874f-fdbec4a6d880-1000x1000-eEjISqrVaChwADDSOZRc0HlvRcopO24S6kWkyR1L.png'],
    { description: '<p>علبة حفظ ماتشا معدنية بلمسة مطفية فاخرة وغطاء داخلي محكم، تحمي الماتشا من الرطوبة والضوء وتحافظ على نكهتها ولونها. السعة: حتى 200 جرام.</p>' }),
  product(1672093788, 'verde-tools', 'ادوات فيردي - VERDE', 'tools', 80, 80,
    ['72ebdab4-2bbc-47c4-8483-5c5ca418a726-1000x1000-bu9wgnNc8VhHyF9Ow6JYLhx7Mo2D409ylTYvJe8i.png']),
  product(1219518966, 'nimo-cup-green', 'كوب نيمو جرين - Zo12', 'tools', 15, 15,
    ['b365082e-8a84-44f0-9c57-a6ca1aea4557-1000x1000-9Y1M6jVfE8VIPkr20EsgAxE6HSHyJ24p1UAkBn4t.jpg']),
  product(465103932, 'nimo-cup-classic', 'كوب نيمو كلاسيك – Zo12', 'tools', 15, 15,
    ['af5638db-0125-439d-8e0c-f2d883bfc698-1000x1000-yk4vCEiWcRvrl5aK5aA6ivQmLX1JwWXjc2H36IMt.jpg']),
];

const by = (slug) => products.find((p) => p.slug === slug);
const pick = (...slugs) => slugs.map(by);

/* Published Salla reviews (verified = written after an order). */
export const reviews = [
  { text: 'لذيييذة تجنن والله وطعمها واضح ومافيها مرارة ابداً أنصحكم فيهاا', name: 'Tala', city: 'جدة', verified: true },
  { text: 'البوكس رهيببب والماتشا لذيذذذ مره واللون مره ماشاء الله يجننن، الذ ماتشا جربته لازم تجرّبوه', name: 'شهد خالد', city: 'الطائف', verified: true },
  { text: 'مره يميي وربي لذيذه طعمها وجودتها حتى لون يقتل، والبكجنق خيال 🤩 الماتشا ماتحتاج سيروب لذيذه', name: 'آلاء محمد', city: 'المسيجيد' },
  { text: 'لذيذ وسعره حلو ويستاهل', name: 'مريم مجرشي', city: 'مكة المكرمة', verified: true },
  { text: 'تستاهلون ماشاء الله، ماتشا لذيذه وتوصيل سريع', name: 'نورة صالح', city: 'الرياض' },
  { text: 'لذييييذه ورووووووعه وكل شي حلووو', name: 'عبدالله الشهراني', city: 'خيبر الجنوب', verified: true },
  { text: 'ماتشا رهيبة رهيبة رهيبة', name: 'هند الدوسري', city: 'الرياض' },
];

export const comments = {
  'nimo-matcha-gift-box': [
    { name: 'شهد خالد', when: 'سبتمبر ٢٠٢٦', stars: 5, text: 'البوكس رهيببب والماتشا لذيذذذ مره واللون مره ماشاء الله يجننن', badge: 'مشتري موثّق' },
    { name: 'Tala', when: 'أغسطس ٢٠٢٦', stars: 5, text: 'لذيييذة تجنن والله وطعمها واضح ومافيها مرارة ابداً', badge: 'مشتري موثّق' },
    { name: 'مريم مجرشي', when: 'سبتمبر ٢٠٢٦', stars: 5, text: 'لذيذ وسعره حلو ويستاهل', badge: 'مشتري موثّق' },
  ],
};

/* The home page, exactly as the manager would arrange it in Salla's theme editor. */
export const home = [
  { path: 'home.nm-hero', values: {
    slides: [
      { tone: 'green', image: media.darkStone, eyebrow: 'ماتشا يابانية احتفالية', title: 'كوبك الأخضر', accent: 'يبدأ من هنا', text: 'ماتشا ناعمة بلون حي ونكهة بدون مرارة. تتحضّر في دقيقة، بالبيت، على ذوقك.', button: 'تسوّق البوكسات', url: '/category/boxes', button_2: 'كيف أحضّرها؟', url_2: '/#ritual', sticker: 'بدون مرارة' },
      { tone: 'pink', image: media.pinkDip, eyebrow: 'نكهات نيمو', title: 'فراولة، مانجو،', accent: 'وفانيليا', text: 'ماتشا بنكهات فاكهية لكوب لاتيه بارد يفتح النفس.', button: 'اكتشف النكهات', url: '/#flavors', button_2: 'كل الماتشا', url_2: '/category/matcha', sticker: '٥٩ ر.س' },
      { tone: 'orange', image: img('88e807df-a131-4078-b187-9ad120462413-1000x1000-oYIa4S9s7BLGYbLk1JR7GDh8lRpQ5rsIBvXpw0V3.jpg'), eyebrow: 'بوكس الهدية', title: 'هدية تفرّح', accent: 'محبّين الماتشا', text: 'ماتشا وسيروب وأكواب نيمو وكرت شكر، في بوكس جاهز للإهداء.', button: 'شوف البوكس', url: '/product/nimo-matcha-gift-box', sticker: 'وفّر ٤٧٪' },
    ],
  } },
  { path: 'home.nm-categories', values: {
    items: [
      { title: 'العروض', tone: 'pink', image: by('ceremonial-matcha-120g').image.url, url: '/category/offers' },
      { title: 'البوكسات', tone: 'orange', image: by('nimo-matcha-gift-box').image.url, url: '/category/boxes' },
      { title: 'الماتشا', tone: 'leaf', image: by('organic-ceremonial-matcha-40g').image.url, url: '/category/matcha' },
      { title: 'النكهات', tone: 'pink', image: by('strawberry-matcha-40g').image.url, url: '/#flavors' },
      { title: 'السيروب', tone: 'cream', image: media.syrups, url: '/category/tools' },
      { title: 'الأدوات', tone: 'cream', image: by('verde-tools').image.url, url: '/category/tools' },
    ],
  } },
  { path: 'home.nm-usp', values: {} },
  { path: 'home.nm-spotlight', values: { product: [by('nimo-matcha-gift-box')], image: media.bedTray, ends_at: '2026-10-31' } },
  { path: 'home.nm-shop', values: { products: products, more_url: '/products' } },
  { path: 'home.nm-flavors', values: {
    items: [
      { name: 'كلاسيك', tone: 'green', line: 'الماتشا الاحتفالية كما هي: ناعمة، خضراء، وبدون مرارة.', image: media.jarLatte, product: [by('ceremonial-matcha-80g')] },
      { name: 'فراولة', tone: 'pink', line: 'آيس لاتيه وردي بطعم فراولة يذكّرك بالصيف.', image: media.pinkDip, product: [by('strawberry-matcha-40g')] },
      { name: 'مانجو', tone: 'orange', line: 'استوائية ومنعشة، تحبها من أول رشفة.', image: media.mangoLatte, product: [by('mango-matcha-40g')] },
      { name: 'فانيليا', tone: 'cream', line: 'دافئة وناعمة، لكوب الصبح الهادي.', image: media.vanillaLatte, product: [by('vanilla-matcha-40g')] },
    ],
  } },
  { path: 'home.nm-ritual', values: { image: media.sifting, url: '/category/tools' } },
  { path: 'home.nm-bundle', values: { products: pick('ceremonial-matcha-80g', 'vanilla-syrup-50ml', 'nimo-cup-green', 'nimo-matcha-tin') } },
  { path: 'home.nm-rail', values: { products: pick('verde-tools', 'nimo-matcha-tin', 'salted-caramel-syrup-50ml', 'vanilla-syrup-50ml', 'strawberry-syrup-50ml', 'berry-syrup-50ml', 'nimo-cup-green', 'nimo-cup-classic'), more_url: '/category/tools' } },
  { path: 'home.nm-banner', values: { image: media.bannerWide, image_mobile: media.bannerMobile, alt: 'نكهتك المفضلة بانتظارك', url: '/category/offers' } },
  { path: 'home.nm-moments', values: {
    images: [
      { image: media.vanillaLatte, caption: 'آيس لاتيه فانيليا' },
      { image: media.bedTray, caption: 'ماتشا الصباح' },
      { image: media.cake, caption: 'كيك الماتشا' },
      { image: media.coconutBowl, caption: 'سموذي بول' },
      { image: media.jarLatte, caption: 'ماتشا الورد' },
      { image: media.mangoPops, caption: 'آيس مانجو ماتشا' },
      { image: media.blueCup, caption: 'ماتشا ميلك شيك' },
      { image: media.handCup, caption: 'كوب نيمو على الطريق' },
    ],
  } },
  { path: 'home.nm-reviews', values: { reviews } },
  { path: 'home.nm-story', values: { image: media.field, url: '/#faq' } },
  { path: 'home.nm-faq', values: {} },
  { path: 'home.nm-cta', values: {} },
];
