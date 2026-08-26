import type { Locale } from '@ecwt/contracts';

/**
 * Investor demosining holat mashinasi.
 *
 * Demo ataylab backendsiz ishlaydi: butun holat brauzerning
 * `localStorage`ida saqlanadi. Sahnada Wi-Fi uzilsa yoki API javob
 * bermasa ham prezentatsiya to‘xtamaydi — bu pitch uchun eng muhim
 * texnik qaror.
 */

export const DEMO_STEPS = [
  'auth',
  'otp',
  'faceid',
  'segment',
  'funding',
  'marketplace',
  'profile',
  'logistics',
] as const;

export type DemoStep = (typeof DEMO_STEPS)[number];

/** Varonka tugaganidan keyingi natija ekrani */
export type DemoScreen = DemoStep | 'done';

export type AuthMode = 'register' | 'login';

export type SegmentId = 'artisan' | 'manufacturer' | 'textile' | 'agro' | 'other';

export type FundingId = 'subsidy' | 'self' | 'installment';

export type LogisticsId = 'fba' | 'fbm' | 'own';

export interface DemoState {
  screen: DemoScreen;
  /** Foydalanuvchi eng uzoq borgan qadam — orqaga qaytib, oldinga o‘tish uchun */
  furthest: number;
  mode: AuthMode;
  fullName: string;
  /** Faqat 9 ta raqam, `+998` prefiksisiz */
  phone: string;
  /** Kiritilayotgan 6 xonali SMS kodi */
  otp: string;
  /**
   * Demo rejimida serverdan qaytgan kod (SMS provayderi ulanmaganda).
   * Sahnadagi “Demo to‘ldirish” tugmasi aynan shuni qo‘yadi — kod har
   * safar tasodifiy bo‘lgani uchun qat‘iy qiymatga tayanib bo‘lmaydi.
   */
  demoOtp: string;
  otpVerified: boolean;
  faceVerified: boolean;
  segment: SegmentId | null;
  funding: FundingId | null;
  marketplaces: string[];
  business: {
    company: string;
    tin: string;
    product: string;
    monthlyVolume: string;
  };
  logistics: LogisticsId | null;
}

export const INITIAL_STATE: DemoState = {
  screen: 'auth',
  furthest: 0,
  mode: 'register',
  fullName: '',
  phone: '',
  otp: '',
  demoOtp: '',
  otpVerified: false,
  faceVerified: false,
  segment: null,
  funding: null,
  marketplaces: [],
  business: { company: '', tin: '', product: '', monthlyVolume: '' },
  logistics: null,
};

const STORAGE_KEY = 'ecwt-demo-v1';

export function stepIndex(screen: DemoScreen): number {
  return screen === 'done' ? DEMO_STEPS.length : DEMO_STEPS.indexOf(screen);
}

export function nextScreen(screen: DemoScreen): DemoScreen {
  const index = stepIndex(screen);
  return index >= DEMO_STEPS.length - 1 ? 'done' : (DEMO_STEPS[index + 1] as DemoScreen);
}

export function prevScreen(screen: DemoScreen): DemoScreen {
  const index = stepIndex(screen);
  return index <= 0 ? 'auth' : (DEMO_STEPS[index - 1] as DemoScreen);
}

export function loadState(): DemoState | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    // Saqlangan holat eski versiyadan qolgan bo‘lishi mumkin — shuning
    // uchun boshlang‘ich obyekt ustiga yoyamiz, yetishmagan kalitlar
    // standart qiymatini oladi.
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      business: { ...INITIAL_STATE.business, ...parsed.business },
    };
  } catch {
    return null;
  }
}

export function saveState(state: DemoState): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Shaxsiy rejimda `localStorage` yozishni rad etishi mumkin —
    // demo baribir xotirada ishlayveradi.
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Sahnada qo‘lda yozib o‘tirmaslik uchun tayyor ma’lumot */
export const DEMO_FIXTURE = {
  fullName: 'Dilshod Rahimov',
  phone: '901234567',
  otp: '123456',
} as const;

/** `901234567` -> `90 123 45 67` */
export function formatPhone(digits: string): string {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Investor rejimidagi izohlar — har qadamning biznes ma’nosi */
export interface InvestorNote {
  metric: Record<Locale, string>;
  value: string;
  note: Record<Locale, string>;
}

export const INVESTOR_NOTES: Record<DemoScreen, InvestorNote> = {
  auth: {
    metric: {
      uz: 'Ro‘yxatdan o‘tish konversiyasi',
      ru: 'Конверсия регистрации',
      en: 'Sign-up conversion',
    },
    value: '68%',
    note: {
      uz: 'Parol yo‘q — faqat telefon raqam. Parolli formaga nisbatan konversiya ~2,3 barobar yuqori.',
      ru: 'Без пароля — только номер телефона. Конверсия примерно в 2,3 раза выше формы с паролем.',
      en: 'No password — phone only. Roughly 2.3x the conversion of a password form.',
    },
  },
  otp: {
    metric: { uz: 'SMS tasdiqlash', ru: 'Подтверждение по SMS', en: 'SMS verification' },
    value: '94%',
    note: {
      uz: 'Bitta SMS narxi ~120 so‘m. Firibgar arizalarning birinchi filtri.',
      ru: 'Одна SMS стоит ~120 сумов. Первый фильтр против мошеннических заявок.',
      en: 'One SMS costs about 120 UZS. The first filter against fraudulent applications.',
    },
  },
  faceid: {
    metric: { uz: 'KYC narxi', ru: 'Стоимость KYC', en: 'KYC cost' },
    value: '$0,40',
    note: {
      uz: 'Bank hamkorlari bilan integratsiya uchun majburiy. Qo‘lda tekshiruvga nisbatan 30 barobar arzon.',
      ru: 'Обязательно для интеграции с банками-партнёрами. В 30 раз дешевле ручной проверки.',
      en: 'Required for partner-bank integration. 30x cheaper than manual review.',
    },
  },
  segment: {
    metric: { uz: 'Segmentlar bo‘yicha bozor', ru: 'Рынок по сегментам', en: 'Market by segment' },
    value: '112 000',
    note: {
      uz: 'O‘zbekistonda eksport salohiyatiga ega ro‘yxatdan o‘tgan tadbirkorlar soni.',
      ru: 'Число зарегистрированных предпринимателей с экспортным потенциалом в Узбекистане.',
      en: 'Registered Uzbek businesses with export potential.',
    },
  },
  funding: {
    metric: {
      uz: 'Subsidiya orqali daromad',
      ru: 'Доход от субсидий',
      en: 'Revenue from subsidies',
    },
    value: '8%',
    note: {
      uz: 'Davlat subsidiyasi tasdiqlansa, platforma agent sifatida komissiya oladi.',
      ru: 'При одобрении госсубсидии платформа получает комиссию как агент.',
      en: 'When a state subsidy is approved, the platform earns an agent commission.',
    },
  },
  marketplace: {
    metric: {
      uz: 'Ulangan marketplace',
      ru: 'Подключённые маркетплейсы',
      en: 'Connected marketplaces',
    },
    value: '7',
    note: {
      uz: 'Har bir yangi kanal o‘rtacha GMVni 22% oshiradi — takroriy daromad manbai.',
      ru: 'Каждый новый канал повышает средний GMV на 22% — источник повторного дохода.',
      en: 'Each new channel lifts average GMV by 22% — a recurring revenue source.',
    },
  },
  profile: {
    metric: { uz: 'Ma’lumot to‘ldirish', ru: 'Заполнение данных', en: 'Data completion' },
    value: '81%',
    note: {
      uz: 'Eng og‘ir bet ataylab oxirida — 6 qadam sarflagan foydalanuvchi tashlab ketmaydi.',
      ru: 'Самый тяжёлый шаг намеренно в конце — потративший 6 шагов пользователь не уходит.',
      en: 'The heaviest step sits last on purpose — six steps in, users do not abandon.',
    },
  },
  logistics: {
    metric: { uz: 'Yuk tashish marjasi', ru: 'Маржа логистики', en: 'Logistics margin' },
    value: '19%',
    note: {
      uz: 'FBA tanlagan mijoz ombor va yetkazib berish orqali platformaga bog‘lanib qoladi.',
      ru: 'Клиент, выбравший FBA, привязывается к платформе через склад и доставку.',
      en: 'An FBA customer stays locked into the platform through warehousing and delivery.',
    },
  },
  done: {
    metric: {
      uz: 'Mijozning yillik qiymati',
      ru: 'Годовая ценность клиента',
      en: 'Annual customer value',
    },
    value: '$14 200',
    note: {
      uz: 'Komissiya, logistika va obuna to‘lovlaridan iborat o‘rtacha yillik daromad.',
      ru: 'Средний годовой доход из комиссии, логистики и подписки.',
      en: 'Average yearly revenue from commission, logistics, and subscription.',
    },
  },
};
