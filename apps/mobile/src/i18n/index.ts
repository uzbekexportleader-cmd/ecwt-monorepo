import { getLocales } from 'expo-localization';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@ecwt/contracts';

/**
 * Mobil ilova matnlari.
 *
 * Saytdagidek: uchinchi tomon kutubxonasisiz, oddiy obyektlar.
 * `Strings` turi uz lug'atidan olinadi — ru/en da kalit tushib qolsa
 * TypeScript darhol xato beradi.
 */
const uz = {
  common: {
    loading: 'Yuklanmoqda...',
    error: 'Xatolik yuz berdi',
    retry: 'Qayta urinish',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    empty: 'Hozircha ma’lumot yo‘q',
    offline: 'Internet aloqasi yo‘q',
  },
  welcome: {
    tagline: 'O‘zbekiston mahsulotlarini dunyoga olib chiqamiz',
    lead: 'Amazon, eBay, Etsy, Walmart va boshqa global marketplace’larda savdoni siz uchun yo‘lga qo‘yamiz.',
    partners: 'Hamkorlarimiz: Iqtisodiyot va moliya vazirligi · IT Park · Innovatsion rivojlanish vazirligi',
    start: 'Ro‘yxatdan o‘tish',
    haveAccount: 'Akkauntim bor — kirish',
  },
  auth: {
    loginTitle: 'Kabinetga kirish',
    loginSubtitle: 'ECWT hamkor akkauntingiz bilan',
    registerTitle: 'Hamkor bo‘lish',
    registerSubtitle: 'Mahsulotingizni AQSH bozoriga chiqaring',
    email: 'Email',
    password: 'Parol',
    fullName: 'Ism-familiya',
    companyName: 'Kompaniya nomi',
    phone: 'Telefon',
    login: 'Kirish',
    register: 'Ro‘yxatdan o‘tish',
    noAccount: 'Akkauntingiz yo‘qmi?',
    haveAccount: 'Akkauntingiz bormi?',
    logout: 'Chiqish',
    logoutConfirm: 'Akkauntdan chiqmoqchimisiz?',
  },
  tabs: {
    home: 'Bosh sahifa',
    products: 'Mahsulotlar',
    orders: 'Buyurtmalar',
    profile: 'Profil',
  },
  home: {
    greeting: 'Xush kelibsiz',
    balance: 'Hisobdagi mablag‘',
    pendingPayout: 'To‘lanmagan',
    revenue: 'Umumiy savdo',
    orders: 'Buyurtmalar',
    liveListings: 'Sotuvdagi e’lonlar',
    products: 'Mahsulotlar',
    profileIncomplete: 'Profilni to‘ldiring',
    profileIncompleteBody:
      'Mahsulot qo‘shish uchun kompaniya ma’lumotlarini to‘ldirib, tekshiruvdan o‘tkazing. Buni saytdan bajarish qulayroq.',
    profilePending: 'Profil tekshiruvda',
    profilePendingBody: 'Odatda 1–3 ish kuni ichida javob beramiz.',
    profileRejected: 'Profil rad etildi',
  },
  products: {
    title: 'Mahsulotlar',
    sku: 'SKU',
    stock: 'Qoldiq',
    price: 'Narx',
    addHint: 'Yangi mahsulotni saytdagi kabinetdan qo‘shing.',
  },
  orders: {
    title: 'Buyurtmalar',
    yourShare: 'Sizga',
    quantity: 'Soni',
  },
  profile: {
    title: 'Profil',
    company: 'Kompaniya',
    status: 'Holat',
    stir: 'STIR',
    phone: 'Telefon',
    email: 'Email',
    bank: 'Bank',
    account: 'Hisob raqami',
    balance: 'Balans',
    editHint: 'Ma’lumotlarni o‘zgartirish uchun saytdagi kabinetga kiring.',
    language: 'Til',
  },
};

export type Strings = typeof uz;

const ru: Strings = {
  common: {
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    retry: 'Повторить',
    cancel: 'Отмена',
    save: 'Сохранить',
    empty: 'Пока нет данных',
    offline: 'Нет соединения с интернетом',
  },
  welcome: {
    tagline: 'Выводим товары Узбекистана в мир',
    lead: 'Налаживаем для вас продажи на Amazon, eBay, Etsy, Walmart и других глобальных маркетплейсах.',
    partners: 'Наши партнёры: Министерство экономики и финансов · IT Park · Министерство инновационного развития',
    start: 'Регистрация',
    haveAccount: 'У меня есть аккаунт — войти',
  },
  auth: {
    loginTitle: 'Вход в кабинет',
    loginSubtitle: 'С вашим партнёрским аккаунтом ECWT',
    registerTitle: 'Стать партнёром',
    registerSubtitle: 'Выведите товар на рынок США',
    email: 'Email',
    password: 'Пароль',
    fullName: 'Имя и фамилия',
    companyName: 'Название компании',
    phone: 'Телефон',
    login: 'Войти',
    register: 'Зарегистрироваться',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    logout: 'Выйти',
    logoutConfirm: 'Выйти из аккаунта?',
  },
  tabs: {
    home: 'Главная',
    products: 'Товары',
    orders: 'Заказы',
    profile: 'Профиль',
  },
  home: {
    greeting: 'Добро пожаловать',
    balance: 'Баланс',
    pendingPayout: 'К выплате',
    revenue: 'Общая выручка',
    orders: 'Заказов',
    liveListings: 'Активные листинги',
    products: 'Товары',
    profileIncomplete: 'Заполните профиль',
    profileIncompleteBody:
      'Чтобы добавлять товары, заполните данные компании и пройдите проверку. Удобнее сделать это на сайте.',
    profilePending: 'Профиль на проверке',
    profilePendingBody: 'Обычно отвечаем в течение 1–3 рабочих дней.',
    profileRejected: 'Профиль отклонён',
  },
  products: {
    title: 'Товары',
    sku: 'Артикул',
    stock: 'Остаток',
    price: 'Цена',
    addHint: 'Новый товар добавляется в кабинете на сайте.',
  },
  orders: {
    title: 'Заказы',
    yourShare: 'Вам',
    quantity: 'Кол-во',
  },
  profile: {
    title: 'Профиль',
    company: 'Компания',
    status: 'Статус',
    stir: 'ИНН',
    phone: 'Телефон',
    email: 'Email',
    bank: 'Банк',
    account: 'Расчётный счёт',
    balance: 'Баланс',
    editHint: 'Чтобы изменить данные, войдите в кабинет на сайте.',
    language: 'Язык',
  },
};

const en: Strings = {
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
    cancel: 'Cancel',
    save: 'Save',
    empty: 'No data yet',
    offline: 'No internet connection',
  },
  welcome: {
    tagline: 'We take Uzbek products to the world',
    lead: 'We set up and run your sales on Amazon, eBay, Etsy, Walmart and other global marketplaces.',
    partners: 'Our partners: Ministry of Economy and Finance · IT Park · Ministry of Innovative Development',
    start: 'Create an account',
    haveAccount: 'I already have an account',
  },
  auth: {
    loginTitle: 'Sign in',
    loginSubtitle: 'With your ECWT partner account',
    registerTitle: 'Become a partner',
    registerSubtitle: 'Bring your product to the US market',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    companyName: 'Company name',
    phone: 'Phone',
    login: 'Sign in',
    register: 'Create account',
    noAccount: 'Don’t have an account?',
    haveAccount: 'Already have an account?',
    logout: 'Sign out',
    logoutConfirm: 'Sign out of your account?',
  },
  tabs: {
    home: 'Home',
    products: 'Products',
    orders: 'Orders',
    profile: 'Profile',
  },
  home: {
    greeting: 'Welcome',
    balance: 'Balance',
    pendingPayout: 'Awaiting payout',
    revenue: 'Total revenue',
    orders: 'Orders',
    liveListings: 'Live listings',
    products: 'Products',
    profileIncomplete: 'Complete your profile',
    profileIncompleteBody:
      'To add products, fill in your company details and get verified. This is easier to do on the website.',
    profilePending: 'Profile under review',
    profilePendingBody: 'We usually respond within 1–3 business days.',
    profileRejected: 'Profile rejected',
  },
  products: {
    title: 'Products',
    sku: 'SKU',
    stock: 'Stock',
    price: 'Price',
    addHint: 'Add new products from the dashboard on the website.',
  },
  orders: {
    title: 'Orders',
    yourShare: 'Your share',
    quantity: 'Qty',
  },
  profile: {
    title: 'Profile',
    company: 'Company',
    status: 'Status',
    stir: 'Tax ID',
    phone: 'Phone',
    email: 'Email',
    bank: 'Bank',
    account: 'Account',
    balance: 'Balance',
    editHint: 'To change your details, sign in to the dashboard on the website.',
    language: 'Language',
  },
};

const DICTIONARIES: Record<Locale, Strings> = { uz, ru, en };

export function getStrings(locale: Locale): Strings {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Telefon tilidan mos tilni tanlaydi, topilmasa o'zbekcha */
export function detectDeviceLocale(): Locale {
  const deviceLocales = getLocales();

  for (const entry of deviceLocales) {
    const code = entry.languageCode?.toLowerCase();
    if (code && (LOCALES as readonly string[]).includes(code)) {
      return code as Locale;
    }
  }

  return DEFAULT_LOCALE;
}
