import type { Locale } from '@ecwt/contracts';
import type { ChatCopy } from './ChatWidget';

/**
 * Bosh sahifa matnlari.
 *
 * `i18n/dictionaries` ga qo'shilmadi: bosh sahifa ko'rinishi tez-tez
 * o'zgaradi va uni alohida ushlab turish umumiy lug'atlarni toza
 * saqlaydi. Tuzilma loyihadagi `demo-copy.ts` uslubiga mos.
 */

interface Feature {
  title: string;
  body: string;
}

interface Stat {
  value: string;
  label: string;
}

interface HomeCopy {
  /** Logotip yonidagi uch qatorli tavsif */
  companyLines: [string, string, string];
  /**
   * Sarlavhada ketma-ket aylanadigan gaplar (yozilib-o'chiriladi).
   *
   * Ilgari bu yerda bitta qat'iy gap bor edi (`titleLead` + rangli
   * `titleAccent` + `titleTail`). Endi bir nechta xabar ketma-ket
   * aytiladi, shuning uchun o'rtadagi so'zni alohida ranglash mantiqiy
   * emas — barchasi bir xil ranglanadi (`TypewriterHeadline`).
   * Kamida ikkita gap bo'lishi kerak, aks holda aylanish ma'nosiz.
   */
  heroRotating: readonly string[];
  subtitle: string;
  trustTitle: string;
  trustBody: string;
  cardTagline: string;
  origin: string;
  world: string;
  register: string;
  login: string;
  marketplacesTitle: string;
  /** Logotiplar lentasining yorlig'i — nima ko'rsatilayotganini aytadi */
  marketplacesLabel: string;
  /** Qavs ichidagi qo'lyozma shior — matnni "imzo"ga aylantiradi */
  bracketTagline: string;
  menu: string;
  features: Feature[];

  // ── Birinchi ekran ─────────────────────────────────────────────────
  /**
   * Sarlavha ostidagi izoh.
   *
   * Bir vaqtlar bu yerda "mahsulotlaringizni dunyoga olib chiqamiz"
   * degan gap turgandi — ya'ni sarlavhaning boshqa so'z bilan
   * takrori. U hech qanday yangi ma'lumot bermasdi va o'rnini bekorga
   * egallardi.
   *
   * Endi u ANIQ ish haqida gapiradi: qaysi marketplace'lar va nima
   * qilinadi. O'quvchi bir satrda kompaniya nima bilan shug'ullanishini
   * tushunadi.
   */
  heroLead: string;
  /** Asosiy tugma. "Ro'yxatdan o'tish" emas — foydalanuvchi NIMA
   *  qilishini aytadi. */
  ctaPrimary: string;
  /** Pastga aylantirishga ishora */
  scrollHint: string;

  // ── Ikkinchi ekran: raqamlar ───────────────────────────────────────
  /**
   * Birinchi raqamning QIYMATI bu yerda ishlatilmaydi — u
   * `MARKETPLACE_COUNT` dan olinadi, ya'ni lentaning o'zidan sanaladi.
   * Shunda raqam bilan lenta hech qachon bir-biridan farq qilmaydi.
   * Bu yerda faqat YORLIG'I kerak.
   */
  stats: [Stat, Stat, Stat];
  statsLine: string;
  /** Bozor raqami ostidagi izoh — o'sish istiqboli */
  marketNote: string;
  partnersTitle: string;
  /** Davlat muassasalari. Raqam emas, NOM ishonch beradi. */
  partners: [string, string, string, string];
  /**
   * Founder-ning shaxsiy eksport tajribasi — bitta halol jumla.
   *
   * Platformaning o'zi hali daromadsiz (MVP bosqichi), shuning uchun
   * bu yerda "mijozlarimiz mamnun" kabi soxta dalil YO'Q. Faqat
   * tekshiriladigan fakt: asoschi shaxsan eksport qilgan. Ishonch
   * shu orqali quriladi, o'ylab topilgan otzivlar orqali emas.
   */
  founderNote: string;

  // ── Uchinchi ekran: jarayon ────────────────────────────────────────
  processTitle: string;
  /** Listing -> Kontent -> Logistika -> Reklama -> Savdo */
  processSteps: [string, string, string, string, string];

  // ── To'rtinchi ekran: xizmatlar ────────────────────────────────────
  featuresTitle: string;

  // ── Beshinchi ekran: yakuniy chaqiruv ──────────────────────────────
  closingTitle: string;
  closingBody: string;
  closingCta: string;

  /** Pastki blok — minimal footer */
  footer: {
    about: string;
    services: string;
    marketplaces: string;
    help: string;
    rights: string;
  };

  /** O'ng pastki burchakdagi yordamchi oynasining matnlari */
  chat: ChatCopy;
}

export const HOME_COPY: Record<Locale, HomeCopy> = {
  uz: {
    companyLines: ['O‘ZBEKISTON', 'ELEKTRON TIJORAT', 'KOMPANIYASI'],
    heroRotating: [
      'Maxsulotingizni dunyo bozoriga olib chiqamiz!',
      'Milliardlab onlayn xaridorlar ko‘z oldiga chiqing!',
      '8 ta marketplace sizning ixtiyoringizda — tanlang!',
      'O‘z brendingiz bilan dunyo savdosiga chiqing!',
      'Savdongizni yangi bosqichga olib chiqing!',
      'Siz saytga joylang, biz avtomatik marketplace’larga joylaymiz!',
    ],
    subtitle:
      'O‘zbekiston maxsulotlarini global marketplace’larda soting, brendingizni dunyoga taniting',
    trustTitle: 'Xavfsiz va ishonchli platforma',
    trustBody: 'Ma’lumotlaringiz himoyalangan',
    cardTagline: 'Dunyoni bog‘laymiz, biznesingizni o‘stiramiz',
    origin: 'O‘zbekiston',
    world: 'Dunyo',
    register: 'Ro‘yxatdan o‘tish',
    login: 'Kirish',
    marketplacesTitle: 'Global marketplace’lar',
    marketplacesLabel: 'Biz chiqaradigan marketplace’lar',
    bracketTagline: 'o‘zbekistondan dunyoga',
    menu: 'MENYU',
    features: [
      { title: 'Global bozorlarga chiqish', body: '18 ta marketplace integratsiyasi' },
      { title: 'Professional kontent', body: 'Foto va video xizmati' },
      { title: 'Brend va do‘kon yaratish', body: 'Shopify va brend yechimlari' },
      { title: 'Marketing va tahlil', body: 'Reklama kampaniyalari va hisobot' },
      { title: 'Xavfsiz va ishonchli', body: 'Ma’lumotlaringiz himoyalangan' },
      { title: '24/7 qo‘llab-quvvatlash', body: 'Siz bilan doim aloqadamiz' },
    ],

    heroLead:
      'Amazon, eBay, Etsy, Walmart va boshqa global marketplace’larda savdoni siz uchun yo‘lga qo‘yamiz.',
    ctaPrimary: 'Maxsulotingizni soting',
    scrollHint: 'Pastga',

    stats: [
      { value: '20', label: 'Marketplace' },
      { value: '4', label: 'Hamkor' },
      { value: '$6.88T', label: 'Global e-commerce ulushi' },
    ],
    statsLine: 'Bir platforma. Butun dunyo.',
    marketNote: '2027 yilga borib $8 trillionga yetishi kutilmoqda',
    partnersTitle: 'Hamkorlarimiz',
    partners: [
      'Iqtisodiyot va moliya vazirligi',
      'Kambag‘allikni qisqartirish va bandlik vazirligi',
      'IT Park',
      'Innovatsion rivojlanish vazirligi',
    ],
    founderNote:
      'Asoschining shaxsiy eksport tajribasi: AQSH — 2018 yildan, Italiya — 2021 yildan',

    processTitle: 'Biz hammasini qilamiz.',
    processSteps: ['E’lon', 'Kontent', 'Logistika', 'Reklama', 'Savdo'],

    featuresTitle: 'Biz nima qilamiz',

    closingTitle: 'O‘zbekistondan dunyoga.',
    closingBody: 'Siz ishlab chiqaring — qolganini biz bajaramiz.',
    closingCta: 'Boshlash',

  footer: {
    about: 'Biz haqimizda',
    services: 'Xizmatlar',
    marketplaces: 'Marketplace’lar',
    help: 'Yordam',
    rights: 'Barcha huquqlar himoyalangan.',
  },
    chat: {
      open: 'Yordamchi bilan suhbat',
      title: 'ECWT yordamchisi',
      subtitle: 'ChatGPT bilan ishlaydi',
      placeholder: 'Savolingizni yozing…',
      send: 'Yuborish',
      close: 'Yopish',
      greeting:
        'Salom! Men ECWT yordamchisiman. Maxsulotni marketplace’ga chiqarish haqida so‘rang.',
      suggestions: [
        'Qanday boshlayman?',
        'Qaysi marketplace’larga chiqarasiz?',
        'Menga nima kerak bo‘ladi?',
      ],
      errorGeneric: 'Javob olib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.',
      errorNotConfigured:
        'ChatGPT hali ulanmagan — kalit kiritilishi kerak. Shu orada ECWT jamoasiga yozing.',
      errorRate: 'Juda ko‘p so‘rov yuborildi. Bir necha daqiqadan so‘ng urinib ko‘ring.',
    },
  },

  ru: {
    companyLines: ['УЗБЕКСКАЯ КОМПАНИЯ', 'ЭЛЕКТРОННОЙ', 'КОММЕРЦИИ'],
    heroRotating: [
      'Выведите свой товар в мир.',
      'Продавайте бренд в Америке.',
      'Производите — остальное на нас.',
      'Из Узбекистана — на мировой рынок.',
    ],
    subtitle:
      'Продавайте товары Узбекистана на глобальных маркетплейсах и покажите свой бренд миру',
    trustTitle: 'Безопасная и надёжная платформа',
    trustBody: 'Ваши данные под защитой',
    cardTagline: 'Связываем мир, растим ваш бизнес',
    origin: 'Узбекистан',
    world: 'Мир',
    register: 'Регистрация',
    login: 'Войти',
    marketplacesTitle: 'Глобальные маркетплейсы',
    marketplacesLabel: 'Маркетплейсы, на которые мы выводим',
    bracketTagline: 'из узбекистана в мир',
    menu: 'МЕНЮ',
    features: [
      { title: 'Выход на мировые рынки', body: 'Интеграция с 18 маркетплейсами' },
      { title: 'Профессиональный контент', body: 'Фото- и видеосъёмка' },
      { title: 'Бренд и магазин', body: 'Решения на Shopify и брендинг' },
      { title: 'Маркетинг и аналитика', body: 'Рекламные кампании и отчёты' },
      { title: 'Безопасно и надёжно', body: 'Ваши данные под защитой' },
      { title: 'Поддержка 24/7', body: 'Мы всегда на связи' },
    ],

    heroLead:
      'Налаживаем для вас продажи на Amazon, eBay, Etsy, Walmart и других глобальных маркетплейсах.',
    ctaPrimary: 'Продавайте свой товар',
    scrollHint: 'Вниз',

    stats: [
      { value: '20', label: 'Маркетплейсов' },
      { value: '4', label: 'Партнёра' },
      { value: '$6.88T', label: 'Доля глобального e-commerce' },
    ],
    statsLine: 'Одна платформа. Весь мир.',
    marketNote: 'К 2027 году ожидается рост до $8 трлн',
    partnersTitle: 'Наши партнёры',
    partners: [
      'Министерство экономики и финансов',
      'Министерство по сокращению бедности и занятости',
      'IT Park',
      'Министерство инновационного развития',
    ],
    founderNote:
      'Личный опыт основателя в экспорте: США — с 2018 года, Италия — с 2021 года',

    processTitle: 'Мы делаем всё.',
    processSteps: ['Листинг', 'Контент', 'Логистика', 'Реклама', 'Продажи'],

    featuresTitle: 'Что делаем мы',

    closingTitle: 'Из Узбекистана — в мир.',
    closingBody: 'Вы производите, остальное берём на себя.',
    closingCta: 'Начать',

  footer: {
    about: 'О нас',
    services: 'Услуги',
    marketplaces: 'Маркетплейсы',
    help: 'Помощь',
    rights: 'Все права защищены.',
  },
    chat: {
      open: 'Чат с помощником',
      title: 'Помощник ECWT',
      subtitle: 'Работает на ChatGPT',
      placeholder: 'Напишите вопрос…',
      send: 'Отправить',
      close: 'Закрыть',
      greeting:
        'Здравствуйте! Я помощник ECWT. Спросите о выводе товара на маркетплейсы.',
      suggestions: [
        'С чего начать?',
        'На какие маркетплейсы выводите?',
        'Что от меня потребуется?',
      ],
      errorGeneric: 'Не удалось получить ответ. Попробуйте чуть позже.',
      errorNotConfigured:
        'ChatGPT ещё не подключён — нужен ключ. Пока напишите команде ECWT.',
      errorRate: 'Слишком много запросов. Попробуйте через несколько минут.',
    },
  },

  en: {
    companyLines: ['UZBEKISTAN', 'E-COMMERCE', 'COMPANY'],
    heroRotating: [
      'Take your product to the world.',
      'Sell your brand in America.',
      'You manufacture — we handle the rest.',
      'From Uzbekistan to the global market.',
    ],
    subtitle:
      'Sell Uzbek products on global marketplaces and put your brand in front of the world',
    trustTitle: 'Secure and reliable platform',
    trustBody: 'Your data is protected',
    cardTagline: 'We connect the world and grow your business',
    origin: 'Uzbekistan',
    world: 'World',
    register: 'Create an account',
    login: 'Sign in',
    marketplacesTitle: 'Global marketplaces',
    marketplacesLabel: 'Marketplaces we sell on',
    bracketTagline: 'from uzbekistan to the world',
    menu: 'MENU',
    features: [
      { title: 'Reach global markets', body: '18 marketplace integrations' },
      { title: 'Professional content', body: 'Photo and video production' },
      { title: 'Brand and storefront', body: 'Shopify and branding solutions' },
      { title: 'Marketing and analytics', body: 'Ad campaigns and reporting' },
      { title: 'Secure and reliable', body: 'Your data is protected' },
      { title: '24/7 support', body: 'We are always in touch' },
    ],

    heroLead:
      'We set up and run your sales on Amazon, eBay, Etsy, Walmart and other global marketplaces.',
    ctaPrimary: 'Sell your product',
    scrollHint: 'Scroll',

    stats: [
      { value: '20', label: 'Marketplaces' },
      { value: '4', label: 'Partners' },
      { value: '$6.88T', label: 'Global e-commerce share' },
    ],
    statsLine: 'One platform. The whole world.',
    marketNote: 'Expected to reach $8 trillion by 2027',
    partnersTitle: 'Our partners',
    partners: [
      'Ministry of Economy and Finance',
      'Ministry of Poverty Reduction and Employment',
      'IT Park',
      'Ministry of Innovative Development',
    ],
    founderNote:
      "Founder's personal export track record: US since 2018, Italy since 2021",

    processTitle: 'We handle all of it.',
    processSteps: ['Listing', 'Content', 'Logistics', 'Ads', 'Sales'],

    featuresTitle: 'What we do',

    closingTitle: 'From Uzbekistan to the world.',
    closingBody: 'You manufacture — we take care of the rest.',
    closingCta: 'Get started',

  footer: {
    about: 'About us',
    services: 'Services',
    marketplaces: 'Marketplaces',
    help: 'Help',
    rights: 'All rights reserved.',
  },
    chat: {
      open: 'Chat with the assistant',
      title: 'ECWT assistant',
      subtitle: 'Powered by ChatGPT',
      placeholder: 'Type your question…',
      send: 'Send',
      close: 'Close',
      greeting: 'Hi! I am the ECWT assistant. Ask me about selling on global marketplaces.',
      suggestions: [
        'How do I start?',
        'Which marketplaces do you sell on?',
        'What will you need from me?',
      ],
      errorGeneric: 'Could not get an answer. Please try again shortly.',
      errorNotConfigured:
        'ChatGPT is not connected yet — a key is required. In the meantime, contact the ECWT team.',
      errorRate: 'Too many requests. Please try again in a few minutes.',
    },
  },
};
