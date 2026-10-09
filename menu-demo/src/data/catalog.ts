import type { Category, Product } from '../types/catalog'

/**
 * The shared catalog.
 *
 * `DECIDED`: every theme renders this exact data — same products, categories,
 * prices, availability and option groups. Themes are presentation only, so a
 * theme switch is provably a pure visual change.
 *
 * Prices follow the founders' supplied examples (Toman). The platform currency
 * unit remains an `OPEN QUESTION` — Docs/governance/open-questions.md (B-1).
 */

export type { Category, Product } from '../types/catalog'

export const categories: Category[] = [
  { id: 'hot', name: 'قهوه گرم', latin: 'Espresso Bar' },
  { id: 'cold', name: 'قهوه سرد', latin: 'Cold Brew' },
  { id: 'special', name: 'نوشیدنی ویژه', latin: 'Signature' },
  { id: 'bakery', name: 'نان و شیرینی', latin: 'Bakery' },
  { id: 'dessert', name: 'دسر', latin: 'Desserts' },
  { id: 'breakfast', name: 'صبحانه', latin: 'Breakfast' },
]

/** Shared option groups — the reserved modifier structure, shown visually. */
const milkOptions = {
  id: 'milk',
  label: 'نوع شیر',
  required: true,
  choices: [
    { id: 'full', label: 'شیر کامل', price: 0 },
    { id: 'skim', label: 'شیر بی‌چرب', price: 0 },
    { id: 'almond', label: 'شیر بادام‌زمینی', price: 25000 },
    { id: 'oat', label: 'شیر جو', price: 20000 },
  ],
}

const sweetOptions = {
  id: 'sweet',
  label: 'میزان شیرینی',
  required: true,
  choices: [
    { id: 'normal', label: 'معمولی', price: 0 },
    { id: 'less', label: 'کم‌شیرین', price: 0 },
    { id: 'zero', label: 'بدون شکر', price: 0 },
  ],
}

export const products: Product[] = [
  // ── قهوه گرم ────────────────────────────────────────────────────────────
  {
    id: 'espresso',
    categoryId: 'hot',
    name: 'اسپرسو',
    latinName: 'Espresso',
    description: 'تک‌شات اسپرسو، غلیظ و کرک‌دار، از دانه‌های تازه‌رست ویتنام',
    price: 95000,
    image: 'coffee-espresso',
    available: true,
    options: [sweetOptions],
    variants: [
    { id: 'single', label: 'تک‌نما', price: 95000 },
    { id: 'double', label: 'دبل', price: 125000 }
    ],
  },
  {
    id: 'cappuccino',
    categoryId: 'hot',
    name: 'کاپوچینو',
    latinName: 'Cappuccino',
    description: 'اسپرسو دوبل با شیر بخارپز و فوم مخملی، تعادل کامل طعم',
    price: 145000,
    image: 'coffee-cappuccino',
    available: true,
    badge: 'پرفروش',
    options: [milkOptions],
  },
  {
    id: 'flat-white',
    categoryId: 'hot',
    name: 'فلت وایت',
    latinName: 'Flat White',
    description: 'ریستِرتوی دوبل، شیر مخملی و فوم ظریف، طعمی لطیف و پایدار',
    price: 155000,
    image: 'coffee-flatwhite',
    available: true,
    options: [milkOptions],
  },
  {
    id: 'latte',
    categoryId: 'hot',
    name: 'لاته',
    latinName: 'Caffè Latte',
    description: 'اسپرسو با شیر گرم فراوان، نوشیدنی ملایم برای شروع روز',
    price: 135000,
    image: 'coffee-latte',
    available: true,
    options: [milkOptions, sweetOptions],
  },
  {
    id: 'americano',
    categoryId: 'hot',
    name: 'آمریکانو',
    latinName: 'Americano',
    description: 'اسپرسو رقیق‌شده با آب داغ، خالص و بدون شیر',
    price: 105000,
    image: 'coffee-brew-black',
    available: true,
    variants: [
    { id: 'small', label: 'کوچک', price: 105000 },
    { id: 'large', label: 'بزرگ', price: 135000 }
    ],
  },
  {
    id: 'macchiato',
    categoryId: 'hot',
    name: 'ماکیاتو',
    latinName: 'Macchiato',
    description: 'اسپرسو غلیظ که با کف شیر دو شاخه گرفته شده است',
    price: 165000,
    image: 'sig-cappuccino',
    available: true,
  },

  // ── قهوه سرد ────────────────────────────────────────────────────────────
  {
    id: 'cold-brew',
    categoryId: 'cold',
    name: 'کلدبرو',
    latinName: 'Cold Brew',
    description: 'عصاره‌گیری سرد ۱۸ ساعته، بدون تلخی، یخ‌مغذی و نت‌های شکلاتی',
    price: 155000,
    image: 'coffee-brew-black',
    available: true,
    options: [milkOptions, sweetOptions],
    variants: [
    { id: 'small', label: 'کوچک', price: 155000 },
    { id: 'large', label: 'بزرگ', price: 195000 }
    ],
  },
  {
    id: 'iced-latte',
    categoryId: 'cold',
    name: 'آیس‌لیته',
    latinName: 'Iced Latte',
    description: 'اسپرسو، شیر سرد و یخ فراوان؛ پرطرفدارترین نوشیدنی تابستان',
    price: 150000,
    image: 'coffee-variety',
    available: true,
    badge: 'پرفروش',
    options: [milkOptions, sweetOptions],
    variants: [
    { id: 'small', label: 'کوچک', price: 150000 },
    { id: 'large', label: 'بزرگ', price: 190000 }
    ],
  },
  {
    id: 'affogato',
    categoryId: 'cold',
    name: 'آفوگاتو',
    latinName: 'Affogato',
    description: 'بستنی وانیلی که با اسپرسوی داغ غسل داده شده است',
    price: 185000,
    image: 'dessert-icecream',
    available: false,
  },

  // ── نوشیدنی ویژه ───────────────────────────────────────────────────────
  {
    id: 'spanish-latte',
    categoryId: 'special',
    name: 'لاته اسپانیایی',
    latinName: 'Spanish Latte',
    description: 'شیر سرد با گلاب و دارچین، طعمی گرم و کریمی که هر میزی را می‌برد',
    price: 175000,
    image: 'sig-brew',
    available: true,
    badge: 'امضای نواره',
    options: [{ ...sweetOptions, label: 'غلظت شیر' }],
  },
  {
    id: 'matcha',
    categoryId: 'special',
    name: 'ماچا لیته',
    latinName: 'Matcha Latte',
    description: 'چای سبز ژاپنی با شیر، بدون کافئین‌زدایی و سرشار از آنتی‌اکسیدان',
    price: 185000,
    image: 'coffee-matcha',
    available: true,
    variants: [
    { id: 'hot', label: 'گرم', price: 185000 },
    { id: 'iced', label: 'سرد', price: 215000 }
    ],
  },
  {
    id: 'chai',
    categoryId: 'special',
    name: 'چای ماسالا',
    latinName: 'Chai Latte',
    description: 'چای هندی با هل، دارچین و زنجبیل؛ همراه همیشگی عصرانه‌ها',
    price: 135000,
    image: 'tea-chai',
    available: true,
    options: [milkOptions],
    variants: [
    { id: 'small', label: 'کوچک', price: 135000 },
    { id: 'large', label: 'بزرگ', price: 175000 }
    ],
  },
  {
    id: 'signature-shake',
    categoryId: 'special',
    name: 'میلک‌شیک شکلاتی',
    latinName: 'Signature Shake',
    description: 'بستنی وانیلی، شکلات تلخ ۷۰٪ و فوم خامه؛ نوشیدنی امضای نواره',
    price: 195000,
    image: 'cold-shake',
    available: true,
  },

  // ── نان و شیرینی ────────────────────────────────────────────────────────
  {
    id: 'croissant',
    categoryId: 'bakery',
    name: 'کرواسان',
    latinName: 'Croissant',
    description: 'لایه‌دار با کره فرانسوی، پخت روزانه ساعت ۷ صبح',
    price: 125000,
    image: 'bakery-croissant',
    available: true,
  },
  {
    id: 'croissant-pistachio',
    categoryId: 'bakery',
    name: 'کرواسان پسته',
    latinName: 'Pistachio Croissant',
    description: 'کرواسان کره‌ای با کره پسته و خلال؛ شیرینی صبحانه ما',
    price: 165000,
    image: 'bakery-croissant',
    available: true,
  },
  {
    id: 'tahini-cookie',
    categoryId: 'bakery',
    name: 'کوکی کنجد',
    latinName: 'Tahini Cookie',
    description: 'کره بادام‌زمینی تائبه و چیپ شکلات تلخ؛ نرم وchewy',
    price: 85000,
    image: 'texture-beans',
    available: false,
  },

  // ── دسر ─────────────────────────────────────────────────────────────────
  {
    id: 'tiramisu',
    categoryId: 'dessert',
    name: 'تیرامیسو',
    latinName: 'Tiramisu',
    description: 'ماسکارپونه، اسپرسوی تازه و پودر کاکائو؛ لایه‌های دست‌ساز',
    price: 185000,
    image: 'dessert-tiramisu',
    available: true,
    badge: 'محبوب',
  },
  {
    id: 'cheesecake',
    categoryId: 'dessert',
    name: 'چیزکیک راسپبری',
    latinName: 'Raspberry Cheesecake',
    description: 'چیزکیک نیویورکی با سس توت‌فرنگی تازه و بیسکویت کره‌ای',
    price: 175000,
    image: 'dessert-cheesecake',
    available: true,
  },
  {
    id: 'pannacotta',
    categoryId: 'dessert',
    name: 'پاناکوتای توت',
    latinName: 'Berry Pannacotta',
    description: 'ژله خامه‌ای نرم با مخلوط توت و وانیل ماداگاسکار',
    price: 165000,
    image: 'dessert-pannacotta',
    available: true,
  },
  {
    id: 'cake-salted-caramel',
    categoryId: 'dessert',
    name: 'کیک کارامل نمکی',
    latinName: 'Salted Caramel Cake',
    description: 'کیک شکلات تیره، کارامل سفید و بیسکویت بادامی؛ پایان شیرین وعده',
    price: 195000,
    image: 'sig-dessert-caramel',
    available: true,
  },
  {
    id: 'fruit-cake',
    categoryId: 'dessert',
    name: 'کیک میوه‌ای',
    latinName: 'Fruit Cake',
    description: 'کیک اسفنجی با لایه میوه‌های تازه فصل و کاستارد خانگی',
    price: 190000,
    image: 'dessert-cake',
    available: false,
  },

  // ── صبحانه ──────────────────────────────────────────────────────────────
  {
    id: 'eggs-toast',
    categoryId: 'breakfast',
    name: 'تخم‌مرغ و آووکادو',
    latinName: 'Eggs & Avocado',
    description: 'دو عدد تخم‌مرغ آب‌پز روی نان سوردو، آووکادو و سبزیجات تازه',
    price: 265000,
    image: 'breakfast-eggs',
    available: true,
  },
  {
    id: 'pancakes',
    categoryId: 'breakfast',
    name: 'پنکیک توت‌فرنگی',
    latinName: 'Berry Pancakes',
    description: 'سه لایه پنکیک نرم با توت‌فرنگی، خامه و شربت افرا',
    price: 285000,
    image: 'breakfast-pancakes',
    available: true,
    badge: 'سرو تا ۱۱:۳۰',
  },
]

export const signatureIds = ['spanish-latte', 'cake-salted-caramel'] as const

export const productsByCategory = categories.map((category) => ({
  category,
  items: products.filter((product) => product.categoryId === category.id),
}))

export const getProduct = (id: string) => products.find((product) => product.id === id)