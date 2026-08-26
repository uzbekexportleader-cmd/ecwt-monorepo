/**
 * O'zbekcha lug'at — BOSHQA TILLAR UCHUN ETALON.
 *
 * `as const` ataylab qo'yilmagan: aks holda tur literal qiymatlarga
 * bog'lanib qolardi va ru/en lug'atlari unga mos kelmasdi.
 * Endi `Dictionary` — tuzilma, ya'ni ru.ts yoki en.ts da kalit
 * tushib qolsa TypeScript darhol xato beradi.
 */
export const uz = {
  meta: {
    title: 'ECWT — O‘zbek mahsulotlarini AQSH bozoriga chiqaramiz',
    description:
      'E-commerce World Trade: O‘zbekiston ishlab chiqaruvchilarini Amazon, Etsy va boshqa AQSH marketplace’lariga chiqaramiz. Ro‘yxatdan o‘tish, logistika, sotuv — hammasini biz bajaramiz.',
  },

  nav: {
    home: 'Bosh sahifa',
    services: 'Xizmatlar',
    marketplaces: 'Marketplace’lar',
    howItWorks: 'Qanday ishlaydi',
    pricing: 'Narxlar',
    about: 'Biz haqimizda',
    contact: 'Aloqa',
    login: 'Kirish',
    register: 'Hamkor bo‘lish',
    dashboard: 'Kabinet',
  },

  hero: {
    badge: 'AQSH bozoriga to‘g‘ridan-to‘g‘ri yo‘l',
    ribbon: 'Amazon va Etsy’da sotuvchi akkauntlarimiz o‘zbek ishlab chiqaruvchilariga ochiq',
    title: 'Mahsulotingiz Amerikada sotilsin',
    titleLead: 'Mahsulotingiz Amerikada',
    titleAccent: 'sotilsin',
    subtitle:
      'Siz ishlab chiqarasiz — biz Amazon va boshqa AQSH marketplace’larida sotamiz. Akkaunt, e’lon, logistika, mijoz bilan muloqot va to‘lov bizning zimmamizda.',
    ctaPrimary: 'Hamkor bo‘lish',
    ctaSecondary: 'Qanday ishlaydi',
    haveAccount: 'Hisobingiz bormi?',
    displayOver: 'MAHSULOTINGIZ',
    displayMain: 'AMERIKADA',
    displayUnder: 'SOTILSIN',
    scroll: 'PASTGA',
    mapFrom: 'Toshkent',
    mapTo: 'Nyu-York',
    marketplacesLabel: 'Mahsulotingiz shu yerlarda sotiladi',
    marketplacesNote: '2 tasi faol, qolgani ulanmoqda',
    stats: {
      marketplaces: 'Marketplace',
      suppliers: 'Hamkor ishlab chiqaruvchi',
      market: 'AQSH e-tijorat bozori',
    },
  },

  problem: {
    title: 'Nega mustaqil chiqish qiyin?',
    subtitle: 'AQSH marketplace’lariga o‘zbek ishlab chiqaruvchisi duch keladigan to‘siqlar',
    items: [
      {
        title: 'Kompaniya va soliq raqami',
        body: 'Amazon Seller akkaunti uchun AQSH yuridik shaxsi, EIN va bank hisobi talab qilinadi.',
      },
      {
        title: 'To‘lovni qabul qilish',
        body: 'Marketplace pulni AQSH bank hisobiga o‘tkazadi. O‘zbekistondagi hisobga to‘g‘ridan-to‘g‘ri tushmaydi.',
      },
      {
        title: 'Logistika va ombor',
        body: 'FBA uchun tovar avval AQSH omboriga yetib borishi kerak — eksport hujjatlari, boj, yetkazib berish.',
      },
      {
        title: 'Til va e’lon sifati',
        body: 'Inglizcha tavsif, kalit so‘zlar, professional fotosurat bo‘lmasa e’lon qidiruvda ko‘rinmaydi.',
      },
    ],
  },

  services: {
    title: 'Biz nima qilamiz',
    subtitle: 'Ishlab chiqarishdan boshqa hamma narsa bizda',
    items: [
      {
        title: 'Marketplace akkaunti',
        body: 'Bizning AQSH kompaniyamiz va tasdiqlangan seller akkauntlarimiz orqali sotasiz — o‘zingiz kompaniya ochishingiz shart emas.',
      },
      {
        title: 'E’lon tayyorlash',
        body: 'Inglizcha nom va tavsif, SEO kalit so‘zlar, raqobat tahlili asosida narx belgilash, professional fotosuratlar.',
      },
      {
        title: 'Logistika',
        body: 'Eksport hujjatlari, yig‘ma yuk, AQSH omboriga yetkazish va FBA ga joylashtirish.',
      },
      {
        title: 'Sotuv boshqaruvi',
        body: 'Mijozlar bilan muloqot, sharhlar, qaytarishlar, reklama kampaniyalari va qoldiq nazorati.',
      },
      {
        title: 'Shaffof hisobot',
        body: 'Har bir buyurtma, komissiya va to‘lov kabinetingizda real vaqtda ko‘rinadi.',
      },
      {
        title: 'To‘lov O‘zbekistonga',
        body: 'Sotuvdan tushgan pul rasmiy yo‘l bilan hisobingizga o‘tkaziladi — hujjatlari bilan.',
      },
    ],
  },

  howItWorks: {
    title: 'Qanday ishlaydi',
    subtitle: 'Ro‘yxatdan o‘tishdan birinchi sotuvgacha',
    steps: [
      {
        title: 'Ro‘yxatdan o‘ting',
        body: 'Kompaniya ma’lumotlari va rekvizitlarni kiriting. Tekshiruv odatda 1-3 ish kunida yakunlanadi.',
      },
      {
        title: 'Mahsulot qo‘shing',
        body: 'Nom, tavsif, narx, rasm va ishlab chiqarish quvvatini kiriting. Biz bozorga mosligini baholaymiz.',
      },
      {
        title: 'Biz e’lon qilamiz',
        body: 'Inglizcha e’lon tayyorlanadi, narx hisoblanadi va marketplace’ga joylashtiriladi.',
      },
      {
        title: 'Tovarni jo‘nating',
        body: 'Kelishilgan partiyani ko‘rsatamiz. Logistikani biz tashkil qilamiz.',
      },
      {
        title: 'Sotuv va to‘lov',
        body: 'Mahsulot sotiladi, buyurtmalar kabinetda ko‘rinadi, pul kelishilgan muddatda o‘tkaziladi.',
      },
    ],
  },

  marketplaces: {
    title: 'Qaysi platformalarda ishlaymiz',
    subtitle: 'Hozirgi va rejadagi marketplace’lar',
    active: 'Faol',
    planned: 'Rejada',
  },

  pricing: {
    title: 'Hamkorlik shartlari',
    subtitle: 'Yashirin to‘lov yo‘q — daromaddan foiz',
    note: 'Aniq shartlar mahsulot turi, hajm va logistikaga qarab belgilanadi. Batafsil ma’lumot uchun ariza qoldiring.',
    plans: [
      {
        name: 'Boshlang‘ich',
        commission: '20%',
        forWho: 'Birinchi marta eksport qilayotganlar uchun',
        popular: false,
        features: [
          'Bitta marketplace (Amazon US)',
          '5 tagacha mahsulot e’loni',
          'E’lon tayyorlash va tarjima',
          'Asosiy sotuv hisoboti',
          'Oylik to‘lov',
        ],
      },
      {
        name: 'Standart',
        commission: '15%',
        forWho: 'Doimiy hajmga ega ishlab chiqaruvchilar',
        popular: true,
        features: [
          '2 ta marketplace',
          '25 tagacha mahsulot e’loni',
          'Professional fotosurat',
          'Reklama kampaniyalari',
          'Logistika tashkil etish',
          '2 haftada bir to‘lov',
        ],
      },
      {
        name: 'Korporativ',
        commission: 'Kelishuv',
        forWho: 'Katta hajm va o‘z brendi bo‘lganlar',
        popular: false,
        features: [
          'Barcha marketplace’lar',
          'Cheklanmagan mahsulot',
          'Brend ro‘yxatdan o‘tkazish',
          'Alohida menejer',
          'Maxsus logistika sxemasi',
          'Haftalik to‘lov',
        ],
      },
    ],
    cta: 'Ariza qoldirish',
  },

  about: {
    title: 'ECWT haqida',
    body: 'E-commerce World Trade — O‘zbekiston ishlab chiqaruvchilarini xalqaro elektron tijorat bozoriga olib chiqadigan kompaniya. Bizda AQSH marketplace’larida faoliyat yuritayotgan sotuvchi akkauntlari bor va biz ularni mahalliy ishlab chiqaruvchilar uchun ochiq qilamiz.',
    mission: {
      title: 'Maqsadimiz',
      body: 'O‘zbek mahsuloti — paxta tekstili, gilam, hunarmandchilik, quruq meva — jahon bozorida munosib o‘rin egallashi. Buning uchun eng katta to‘siq bilim va infratuzilma, mahsulot sifati emas.',
    },
    values: [
      { title: 'Shaffoflik', body: 'Har bir buyurtma va komissiya kabinetda ko‘rinadi.' },
      { title: 'Rasmiylik', body: 'Barcha to‘lovlar hujjat bilan, eksport qonunchiligiga muvofiq.' },
      { title: 'Uzoq muddat', body: 'Bir martalik bitim emas, doimiy hamkorlik quramiz.' },
    ],
  },

  contact: {
    title: 'Ariza qoldiring',
    subtitle: 'Mahsulotingiz AQSH bozoriga mosligini bepul baholab beramiz',
    form: {
      name: 'Ism-familiya',
      namePlaceholder: 'Alisher Karimov',
      phone: 'Telefon',
      phonePlaceholder: '+998 90 123 45 67',
      email: 'Email (ixtiyoriy)',
      emailPlaceholder: 'siz@kompaniya.uz',
      company: 'Kompaniya nomi',
      companyPlaceholder: 'Ipak Yo‘li Tekstil MChJ',
      category: 'Mahsulot turi',
      categoryPlaceholder: 'Masalan: paxta futbolka, gilam, quruq meva',
      message: 'Qo‘shimcha ma’lumot',
      messagePlaceholder: 'Oylik ishlab chiqarish hajmi, eksport tajribangiz bor-yo‘qligi...',
      submit: 'Arizani yuborish',
      submitting: 'Yuborilmoqda...',
      success: 'Arizangiz qabul qilindi! 1-2 ish kunida bog‘lanamiz.',
      error: 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring yoki telefon orqali murojaat qiling.',
      privacy: 'Ma’lumotlaringiz uchinchi shaxslarga berilmaydi.',
    },
    direct: {
      title: 'To‘g‘ridan-to‘g‘ri aloqa',
      phone: 'Telefon',
      email: 'Email',
      telegram: 'Telegram',
      address: 'Manzil',
      addressValue: 'Toshkent shahri, O‘zbekiston',
      hours: 'Ish vaqti',
      hoursValue: 'Dushanba–Juma, 9:00–18:00',
    },
  },

  cta: {
    title: 'Mahsulotingiz Amerikada sotilishga tayyormi?',
    body: 'Bepul baholash uchun ariza qoldiring — mahsulotingiz AQSH bozorida qanday narxda va qanday talab bilan sotilishi mumkinligini aytamiz.',
    button: 'Hoziroq ariza qoldirish',
  },

  footer: {
    tagline: 'O‘zbek mahsulotlarini jahon bozoriga chiqaramiz',
    company: 'Kompaniya',
    services: 'Xizmatlar',
    legal: 'Hujjatlar',
    terms: 'Foydalanish shartlari',
    privacy: 'Maxfiylik siyosati',
    offer: 'Ommaviy oferta',
    rights: 'Barcha huquqlar himoyalangan.',
  },

  common: {
    loading: 'Yuklanmoqda...',
    error: 'Xatolik yuz berdi',
    retry: 'Qayta urinish',
    save: 'Saqlash',
    saving: 'Saqlanmoqda...',
    cancel: 'Bekor qilish',
    delete: 'O‘chirish',
    edit: 'Tahrirlash',
    back: 'Orqaga',
    next: 'Keyingi',
    search: 'Qidirish',
    filter: 'Filtr',
    all: 'Barchasi',
    noData: 'Ma’lumot yo‘q',
    required: 'Majburiy maydon',
  },
};

export type Dictionary = typeof uz;
