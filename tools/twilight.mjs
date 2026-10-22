/**
 * Writes the Nimo Matcha components and settings into theme/twilight.json.
 * Raed's own settings, components and features (used by the store's other pages) are kept as they are.
 * Every section of the home page is a component the store manager adds, orders, hides and edits
 * from Salla's theme editor; nothing needs code.
 *   node tools/twilight.mjs
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const key = () => crypto.randomUUID();
const text = (id, label, value = null, extra = {}) => ({ type: 'string', format: 'text', id, label, value, multilanguage: true, required: false, icon: 'sicon-format-text-alt', ...extra });
const area = (id, label, value = null) => ({ type: 'string', format: 'textarea', id, label, value, multilanguage: true, required: false, icon: 'sicon-typography' });
const url = (id, label, value = null) => ({ type: 'string', format: 'text', id, label, value, multilanguage: false, required: false, icon: 'sicon-link' });
const image = (id, label, description = null) => ({ type: 'string', format: 'image', id, label, value: null, required: false, icon: 'sicon-image', description });
const toggle = (id, label, value = true, description = null) => ({ type: 'boolean', format: 'switch', id, label, value, selected: value, required: false, icon: 'sicon-toggle-off', description });
const number = (id, label, value, min = 0, max = 100000, description = null) => ({ type: 'number', format: 'integer', id, label, value, minimum: min, maximum: max, required: false, icon: 'sicon-hashtag', description });
const date = (id, label, description = null) => ({ type: 'string', format: 'date', inputType: 'date', id, label, value: null, required: false, icon: 'sicon-calendar-date', description });
const products = (id, label, max, min = 1, required = true) => ({ type: 'items', format: 'dropdown-list', id, label, source: 'products', multichoice: max > 1, searchable: true, minLength: min, maxLength: max, required, options: [], selected: [], value: [], icon: 'sicon-keyboard_arrow_down' });
const LINK_SOURCES = [
  ['منتج', 'products'], ['تصنيف', 'categories'], ['منتجات مع وسم', 'products_tags'], ['صفحة تعريفية', 'pages'],
  ['التخفيضات', 'offers_link'], ['رابط خارجي', 'custom'],
].map(([label, v]) => ({ label, key: v, value: v }));
const link = (id, label) => ({ type: 'items', format: 'variable-list', id, label, source: 'custom', sources: LINK_SOURCES, searchable: true, value: null, required: false, icon: 'sicon-link' });
const manual = (id, label, options, value) => {
  const opts = options.map(([l, v]) => ({ label: l, value: v, key: key() }));
  return { type: 'items', format: 'dropdown-list', id, label, source: 'Manual', options: opts, selected: opts.filter((o) => o.value === value), required: true, icon: 'sicon-list' };
};
const collection = (id, label, item_label, fields, value, min = 1, max = 12) => ({
  type: 'collection', format: 'collection', id, label, item_label, required: true, minLength: min, maxLength: max,
  fields: fields.map((f) => ({ ...f, id: `${id}.${f.id}`, key: key() })),
  value: value.map((v) => Object.fromEntries(Object.entries(v).map(([k, val]) => [`${id}.${k}`, val]))),
});
const note = (value) => ({ type: 'static', format: 'description', id: `note-${key().slice(0, 8)}`, value: `<div>${value}</div>` });
const component = (path, ar, en, icon, fields) => ({ key: key(), title: { ar, en }, icon, path, fields });

/* The brand palette, named the way the merchant thinks about it. Used by every "tone" dropdown. */
const TONES = [['أخضر نيمو (داكن)', 'green'], ['وردي', 'pink'], ['برتقالي', 'orange'], ['كريمي فاتح', 'cream'], ['أخضر ماتشا فاتح', 'leaf']];
const tone = (id, label, value) => manual(id, label, TONES, value);
const head = (eyebrow, title, accent) => [text('eyebrow', 'سطر صغير فوق العنوان', eyebrow), text('title', 'العنوان', title), text('accent', 'الكلمة الملوّنة في العنوان', accent)];

const components = [
  component('home.nm-hero', 'البنر الرئيسي (شرائح)', 'Hero slides', 'sicon-image-carousel', [
    note('أول ما يشوفه العميل. كل شريحة: صورة (أو فيديو mp4 صامت) + عنوان + زرين. الصورة تظهر داخل شكل نيمو العضوي، والخلفية بلون الطابع المختار.'),
    collection('slides', 'الشرائح', 'شريحة', [
      tone('tone', 'لون الشريحة', 'green'),
      image('image', 'الصورة', 'مربعة أو عمودية بجودة عالية (1200×1400 تقريبًا)'),
      url('video', 'رابط فيديو mp4 (اختياري، صامت، أقل من ٤ ميغا)'),
      text('eyebrow', 'سطر صغير'),
      text('title', 'العنوان'),
      text('accent', 'الكلمة الملوّنة'),
      area('text', 'وصف قصير'),
      text('button', 'نص الزر الأساسي'),
      link('url', 'رابط الزر الأساسي'),
      text('button_2', 'نص الزر الثاني (اختياري)'),
      link('url_2', 'رابط الزر الثاني'),
      text('sticker', 'ملصق دائري على الصورة (مثال: خصم ٤٧٪)'),
    ], [
      { tone: 'green', eyebrow: 'ماتشا يابانية احتفالية', title: 'كوبك الأخضر', accent: 'يبدأ من هنا', text: 'ماتشا ناعمة بلون حي ونكهة بدون مرارة. تتحضّر في دقيقة، بالبيت، على ذوقك.', button: 'تسوّق البوكسات', button_2: 'كيف أحضّرها؟', sticker: 'الأكثر طلبًا' },
      { tone: 'pink', eyebrow: 'نكهات نيمو', title: 'فراولة، مانجو،', accent: 'وفانيليا', text: 'ماتشا بنكهات فاكهية لكوب لاتيه بارد يفتح النفس.', button: 'اكتشف النكهات', sticker: '٥٩ ر.س' },
      { tone: 'orange', eyebrow: 'بوكس الهدية', title: 'هدية تفرّح', accent: 'محبّين الماتشا', text: 'ماتشا وسيروب وأكواب نيمو وكرت شكر، في بوكس جاهز للإهداء.', button: 'شوف البوكس', sticker: 'وفّر ٤٧٪' },
    ], 1, 6),
    toggle('autoplay', 'تقليب تلقائي للشرائح', true),
    text('rating_text', 'شارة التقييم (اتركها فارغة لإخفائها)', '٤٫٩ من تقييمات عملائنا في سلة'),
  ]),
  component('home.nm-categories', 'دوائر التصنيفات', 'Category circles', 'sicon-layout-grid', [
    note('اختصارات سريعة للأقسام. تظهر كدوائر يمكن سحبها على الجوال.'),
    collection('items', 'التصنيفات', 'تصنيف', [image('image', 'الصورة (مربعة)'), text('title', 'الاسم'), link('url', 'الرابط'), tone('tone', 'لون الخلفية', 'cream')],
      [{ title: 'العروض', tone: 'pink' }, { title: 'البوكسات', tone: 'orange' }, { title: 'الماتشا', tone: 'leaf' }, { title: 'النكهات', tone: 'cream' }, { title: 'السيروب', tone: 'pink' }, { title: 'الأدوات', tone: 'cream' }], 2, 10),
  ]),
  component('home.nm-usp', 'شريط المزايا', 'Benefits strip', 'sicon-star', [
    collection('items', 'المزايا', 'ميزة', [
      manual('icon', 'الأيقونة', [['شاحنة', 'truck'], ['ورقة شاي', 'leaf'], ['هدية', 'gift'], ['بطاقة', 'card'], ['درع', 'shield'], ['كوب', 'cup']], 'truck'),
      text('title', 'العنوان'), text('text', 'سطر توضيحي'),
    ], [
      { icon: 'leaf', title: 'درجة احتفالية', text: 'ماتشا يابانية ناعمة وبدون مرارة' },
      { icon: 'truck', title: 'توصيل سريع', text: 'لكل مدن المملكة' },
      { icon: 'card', title: 'قسّطها مع تمارا', text: '٤ دفعات بدون فوائد' },
      { icon: 'gift', title: 'تغليف يفرّح', text: 'جاهز للإهداء' },
    ], 2, 6),
  ]),
  component('home.nm-spotlight', 'المنتج الأكثر طلبًا + عداد العرض', 'Best seller spotlight', 'sicon-alarm', [
    note('يعرض منتجًا واحدًا بصورة كبيرة، ومحتوياته، وعداد ينتهي في التاريخ المحدد. عند انتهاء التاريخ يختفي العداد تلقائيًا ويبقى المنتج.'),
    ...head('الأكثر طلبًا', 'بوكس الماتشا', 'اللي الكل يطلبه'),
    products('product', 'المنتج', 1),
    image('image', 'صورة جانبية (لايف ستايل)'),
    collection('contents', 'محتويات المنتج', 'سطر', [text('text', 'السطر')], [
      { text: '٢ × ماتشا احتفالية فاخرة ٤٠ جرام' }, { text: 'سيروب فانيليا ٥٠ مل' }, { text: '٢ × كوب نيمو ماتشا' }, { text: 'كرت شكر وملصقات نيمو' },
    ], 0, 8),
    date('ends_at', 'نهاية العرض (يظهر العداد حتى هذا التاريخ)'),
    text('timer_label', 'عبارة فوق العداد', 'ينتهي العرض بعد'),
    text('proof', 'سطر إثبات اجتماعي (اختياري)', 'أكثر من ١٥٠ عميل طلبوه'),
  ]),
  component('home.nm-shop', 'المتجر (منتجات مع تبويبات)', 'Shop grid with tabs', 'sicon-store', [
    note('التبويبات تتكوّن تلقائيًا من تصنيفات المنتجات المختارة، فالعميل يتنقّل بين الأقسام بدون ما يطلع من الصفحة.'),
    ...head('تسوّق نيمو', 'اختر', 'ماتشتك'),
    area('description', 'وصف قصير', 'كل المنتجات في مكان واحد. اضغط على القسم اللي يهمّك.'),
    text('all_label', 'اسم تبويب الكل', 'الكل'),
    products('products', 'المنتجات', 24),
    text('more_label', 'نص زر عرض الكل', 'كل المنتجات'),
    link('more_url', 'رابط زر عرض الكل'),
  ]),
  component('home.nm-flavors', 'مختار النكهات التفاعلي', 'Flavor picker', 'sicon-sparkles', [
    note('العميل يضغط على النكهة فيتغيّر لون القسم والصورة والمنتج. رتّب النكهات كما تحب.'),
    ...head('نكهات نيمو', 'وش', 'نكهتك اليوم؟'),
    collection('items', 'النكهات', 'نكهة', [
      text('name', 'اسم النكهة'),
      tone('tone', 'لون النكهة', 'green'),
      area('line', 'عبارة النكهة'),
      image('image', 'صورة النكهة (لايف ستايل)'),
      products('product', 'المنتج', 1),
    ], [
      { name: 'كلاسيك', tone: 'green', line: 'الماتشا الاحتفالية كما هي: ناعمة، خضراء، وبدون مرارة.' },
      { name: 'فراولة', tone: 'pink', line: 'آيس لاتيه وردي بطعم فراولة يذكّرك بالصيف.' },
      { name: 'مانجو', tone: 'orange', line: 'استوائية ومنعشة، تحبها من أول رشفة.' },
      { name: 'فانيليا', tone: 'cream', line: 'دافئة وناعمة، لكوب الصبح الهادي.' },
    ], 2, 6),
  ]),
  component('home.nm-ritual', 'طريقة التحضير بخطوات', 'How to prepare', 'sicon-list-play', [
    ...head('سهلة جدًا', 'حضّرها في', 'دقيقة'),
    collection('steps', 'الخطوات', 'خطوة', [text('title', 'العنوان'), area('text', 'الشرح'), text('measure', 'رقم بارز (مثال: ٢ جم)')], [
      { measure: '٢ جم', title: 'ملعقة ماتشا', text: 'ضع ملعقة صغيرة من الماتشا في الكوب أو الوعاء.' },
      { measure: '٨٠°', title: 'ماء دافئ', text: 'أضف قليلًا من الماء الدافئ، لا تستخدم ماء يغلي.' },
      { measure: '٣٠ ث', title: 'اخفق جيدًا', text: 'اخفق بحركة حرف W حتى تتكوّن رغوة ناعمة.' },
      { measure: '❄', title: 'حليب وثلج', text: 'أضف الحليب والثلج وسيروب نيمو حسب ذوقك.' },
    ], 2, 6),
    image('image', 'صورة أو غلاف الفيديو'),
    url('video', 'رابط فيديو mp4 للتحضير (اختياري)'),
    text('button', 'نص الزر', 'جهّز أدواتك'), link('url', 'رابط الزر'),
  ]),
  component('home.nm-bundle', 'كمّل كوبك (اشترِ معًا)', 'Bundle builder', 'sicon-cart-add', [
    note('العميل يختار من المنتجات ويضيفها كلها للسلة بضغطة. يرفع متوسط قيمة الطلب.'),
    ...head('اشترِها مع بعض', 'كمّل', 'كوبك'),
    area('description', 'وصف قصير', 'ماتشا + سيروب + كوب = تجربة كاملة. اختر وأضف الكل بضغطة.'),
    products('products', 'المنتجات (من ٢ إلى ٤)', 4, 2),
    text('button', 'نص الزر', 'أضف المختار للسلة'),
  ]),
  component('home.nm-rail', 'شريط منتجات أفقي', 'Product rail', 'sicon-list', [
    note('شريط منتجات قابل للسحب. استخدمه أكثر من مرة لأقسام مختلفة (الأدوات، السيروب، الجديد…).'),
    ...head('', 'أدوات', 'التحضير'),
    tone('tone', 'لون الخلفية', 'cream'),
    products('products', 'المنتجات', 16),
    text('more_label', 'نص رابط عرض الكل', 'عرض الكل'), link('more_url', 'رابط عرض الكل'),
  ]),
  component('home.nm-banner', 'بنر صورة (كمبيوتر وجوال)', 'Image banner', 'sicon-image', [
    note('لبنرات العروض الجاهزة من المصمم. صورة للكمبيوتر وصورة للجوال، تظهر كاملة بدون قص.'),
    image('image', 'صورة الكمبيوتر', 'أفقية، مثال 1600×600'), image('image_mobile', 'صورة الجوال', 'عمودية أو مربعة، مثال 900×1100'),
    text('alt', 'وصف الصورة (للبحث وقارئ الشاشة)'), link('url', 'الرابط'),
  ]),
  component('home.nm-moments', 'لحظات نيمو (معرض صور)', 'Moments gallery', 'sicon-image-carousel', [
    ...head('من مطبخ نيمو', 'لحظات', 'خضراء'),
    collection('images', 'الصور', 'صورة', [image('image', 'الصورة'), text('caption', 'وصف قصير'), link('url', 'رابط (اختياري)')], [
      { caption: 'آيس لاتيه فانيليا' }, { caption: 'ماتشا الصباح' }, { caption: 'كيك الماتشا' }, { caption: 'سموذي بول' }, { caption: 'ماتشا فراولة' }, { caption: 'مانجو ماتشا' },
    ], 3, 16),
    text('button', 'نص الزر', 'تابعنا على إنستقرام'), url('button_url', 'رابط الزر', 'https://www.instagram.com/nimomatcha'),
  ]),
  component('home.nm-reviews', 'آراء العملاء', 'Reviews', 'sicon-chat-bubbles', [
    ...head('قالوا عن نيمو', 'كلامهم', 'يكفي'),
    text('score', 'التقييم العام', '٤٫٩'), text('score_label', 'وصف التقييم', 'متوسط تقييمات عملائنا في سلة'),
    collection('reviews', 'الآراء', 'رأي', [area('text', 'الرأي'), text('name', 'الاسم'), text('city', 'المدينة'), text('product', 'المنتج (اختياري)'), toggle('verified', 'مشتري موثّق (كتب الرأي بعد طلب)', false)], [], 1, 16),
  ]),
  component('home.nm-story', 'قصة نيمو', 'Brand story', 'sicon-align-right', [
    image('image', 'الصورة'), ...head('من مزارع اليابان', 'رحلة إلى عالم', 'الماتشا'),
    area('text', 'النص', 'نأخذك في رحلة إلى عالم الماتشا اليابانية، من خلال منتجات مختارة بعناية تجمع بين الجودة العالية والمذاق الأصيل، لنمنحك تجربة تحضير سهلة ومتكاملة في كل كوب.'),
    collection('facts', 'أرقام', 'رقم', [text('value', 'الرقم'), text('label', 'الوصف')], [
      { value: '١٠٠٪', label: 'ماتشا يابانية' }, { value: '٢ جم', label: 'لكل كوب' }, { value: '+٤٠', label: 'كوب في البوكس' },
    ], 0, 4),
    text('button', 'نص الزر', 'تعرّف علينا'), link('url', 'رابط الزر'),
  ]),
  component('home.nm-faq', 'الأسئلة الشائعة', 'FAQ', 'sicon-help', [
    ...head('عندك سؤال؟', 'أسئلة', 'تتكرر'),
    collection('items', 'الأسئلة', 'سؤال', [text('q', 'السؤال'), area('a', 'الإجابة')], [
      { q: 'وش الفرق بين الماتشا الاحتفالية والعادية؟', a: 'الاحتفالية من أوراق أصغر وأنعم، لونها أخضر حي وطعمها ناعم بدون مرارة، ومناسبة تنشرب بالماء أو مع الحليب.' },
      { q: 'كم كوب يطلع من ٤٠ جرام؟', a: 'تقريبًا ٢٠ كوب، على أساس ٢ جرام لكل كوب. البوكس ٨٠ جرام يعطيك حوالي ٤٠ كوب.' },
      { q: 'كيف أحفظ الماتشا؟', a: 'في مكان بارد وجاف بعيد عن الشمس، وسكّر الكيس جيدًا بعد كل استخدام. حافظة نيمو المعدنية تحميها من الضوء والرطوبة.' },
      { q: 'متى يوصلني الطلب؟', a: 'نجهّز الطلب بسرعة ويوصلك خلال أيام عمل حسب مدينتك، وتوصلك رسالة برقم التتبع.' },
      { q: 'هل أقدر أقسّط؟', a: 'نعم، مع تمارا على ٤ دفعات بدون فوائد، ويتوفر مدى وأبل باي والبطاقات.' },
    ], 1, 12),
  ]),
  component('home.nm-cta', 'دعوة للتواصل', 'Call to action', 'sicon-whatsapp', [
    tone('tone', 'لون الخلفية', 'pink'),
    text('title', 'العنوان', 'محتار وش تختار؟'), area('text', 'النص', 'كلّمنا على واتساب ونرشّح لك الأنسب لذوقك.'),
    text('button', 'نص الزر', 'كلّمنا على واتساب'), url('button_url', 'رابط الزر', 'https://wa.me/'),
  ]),
];

const settings = [
  { type: 'static', format: 'title', id: 'nm-top', value: 'الشريط العلوي' },
  text('announcement_1', 'رسالة ١', 'توصيل سريع لكل مدن المملكة'),
  text('announcement_2', 'رسالة ٢', 'قسّطها على ٤ دفعات مع تمارا'),
  text('announcement_3', 'رسالة ٣', 'ادفع بمدى أو أبل باي'),
  { type: 'static', format: 'title', id: 'nm-nav', value: 'التنقّل' },
  toggle('show_catbar', 'شريط الأقسام تحت الهيدر (من قائمة الهيدر في سلة)', true),
  toggle('show_bottom_nav', 'شريط تنقّل سفلي في الجوال', true),
  { type: 'static', format: 'title', id: 'nm-sell', value: 'البيع' },
  toggle('show_cost_per_cup', 'إظهار «يكفي كم كوب» و«سعر الكوب» في منتجات الماتشا', true, 'يُحسب تلقائيًا من الوزن المكتوب في اسم المنتج (مثال: 80 جرام)'),
  number('grams_per_cup', 'جرامات الكوب الواحد', 2, 1, 10),
  products('upsell_products', 'منتجات «كمّل كوبك» داخل السلة', 4, 0, false),
  text('upsell_title', 'عنوان اقتراحات السلة', 'كمّل كوبك'),
  toggle('enable_sound', 'نغمة خفيفة عند الإضافة للسلة', true),
  { type: 'static', format: 'title', id: 'nm-footer', value: 'الفوتر' },
  area('footer_about', 'نبذة', 'نختص بتوفير الماتشا اليابانية المختارة بعناية لعشاق الجودة والطعم الأصيل، مع كل ما تحتاجه لتحضير كوبك في البيت.'),
  text('payment_line', 'وسائل الدفع', 'mada · Apple Pay · VISA · tamara · tabby'),
  url('whatsapp', 'رابط واتساب', 'https://wa.me/'),
];

const file = new URL('../theme/twilight.json', import.meta.url);
const current = JSON.parse(fs.readFileSync(file, 'utf8'));
const ourIds = new Set(settings.map((s) => s.id));
const oldIds = new Set(['ej-top', 'ej-motion', 'ej-footer', 'enable_intro', 'enable_cursor']);
const twilight = {
  ...current,
  name: { ar: 'نيمو ماتشا', en: 'Nimo Matcha' },
  description: { ar: 'ثيم نيمو ماتشا: فخم، سريع، وسهل الشراء', en: 'Nimo Matcha theme: premium, fast and easy to buy from' },
  repository: 'https://github.com/i8g0/nimo-matcha-preview',
  author_email: current.author_email === 'support@salla.sa' ? '' : current.author_email,
  settings: [...settings, ...current.settings.filter((s) => !ourIds.has(s.id) && !oldIds.has(s.id))],
  components: [...components, ...current.components.filter((c) => !c.path.startsWith('home.nm-') && !c.path.startsWith('home.ej-'))],
};

fs.writeFileSync(file, `${JSON.stringify(twilight, null, 2)}\n`);
console.log('nm components:', components.length, '| total components:', twilight.components.length, '| settings:', twilight.settings.length);
