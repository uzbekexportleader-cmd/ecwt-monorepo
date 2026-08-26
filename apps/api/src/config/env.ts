import { z } from 'zod';

/**
 * Muhit o'zgaruvchilari ilova ishga tushishida tekshiriladi.
 * Noto'g'ri sozlama bilan server ko'tarilmaydi — bu ishlab chiqarishda
 * yashirin xatolardan ko'ra yaxshiroq.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL kerak (Neon/Supabase Postgres ulanish satri)'),

    // Ikkalasi ham har xil bo'lishi shart — bittasi sizib chiqsa ikkinchisi himoya qiladi
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET kamida 32 belgi bo‘lsin'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET kamida 32 belgi bo‘lsin'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

    // Vergul bilan ajratilgan ro'yxat
    CORS_ORIGINS: z.string().default('http://localhost:3000'),

    // To'lov tizimlari — bo'sh bo'lsa o'sha provayder o'chirilgan holatda qoladi
    PAYME_MERCHANT_ID: z.string().optional(),
    PAYME_KEY: z.string().optional(),
    PAYME_CHECKOUT_URL: z.string().default('https://checkout.paycom.uz'),

    CLICK_MERCHANT_ID: z.string().optional(),
    CLICK_SERVICE_ID: z.string().optional(),
    CLICK_SECRET_KEY: z.string().optional(),

    UZUM_MERCHANT_ID: z.string().optional(),
    UZUM_SECRET_KEY: z.string().optional(),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Fayl yuklash (S3 mos keluvchi xotira)
    S3_ENDPOINT: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_PUBLIC_URL: z.string().optional(),

    // SMS (OTP uchun) — Eskiz.uz yoki Play Mobile
    SMS_PROVIDER: z.enum(['NONE', 'ESKIZ', 'PLAYMOBILE']).default('NONE'),
    SMS_API_URL: z.string().default('https://notify.eskiz.uz/api'),
    // Eskiz tokeni email+parol orqali olinadi va ~30 kun yashaydi.
    // Tayyor token qo'lda berilsa (SMS_API_TOKEN), u ustuvor bo'ladi.
    SMS_API_EMAIL: z.string().optional(),
    SMS_API_PASSWORD: z.string().optional(),
    SMS_API_TOKEN: z.string().optional(),
    SMS_SENDER: z.string().default('4546'),
    /**
     * SMS matni. `{code}` o'rniga kod qo'yiladi.
     *
     * MUHIM: Eskiz'da har bir matn oldindan moderatsiyadan o'tishi shart —
     * tasdiqlanmagan matn yuborilmaydi. Shuning uchun matn koddan alohida,
     * sozlama sifatida turadi: moderatsiyadan o'tgan variantni kod
     * o'zgartirmasdan qo'yish mumkin.
     */
    SMS_OTP_TEMPLATE: z
      .string()
      .default('ECWT tasdiqlash kodi: {code}. Hech kimga aytmang.')
      .refine((v) => v.includes('{code}'), {
        message: 'SMS_OTP_TEMPLATE ichida {code} bo‘lishi SHART',
      }),

    /** Kod amal qilish muddati va qayta yuborish oralig'i (soniya) */
    OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300),
    OTP_RESEND_SECONDS: z.coerce.number().int().min(15).max(300).default(60),
    /** Bitta kodni necha marta noto'g'ri kiritish mumkin */
    OTP_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  })
  .superRefine((env, ctx) => {
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_REFRESH_SECRET JWT_ACCESS_SECRET dan farq qilishi SHART',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(
      `Muhit o'zgaruvchilarida xato bor (.env faylini tekshiring):\n${lines.join('\n')}`,
    );
  }

  return parsed.data;
}

/** "http://a.com, http://b.com" -> ["http://a.com", "http://b.com"] */
export function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * SMS yuborish mumkinmi.
 *
 * `NONE` — bu xato emas, ataylab tanlangan holat: OTP demo rejimida
 * ishlaydi va kod ekranda ko'rsatiladi. Provayder tanlangan, lekin
 * kalitlari bo'lmasa ham `false` qaytadi — server ko'tariladi, faqat
 * SMS yuborilmaydi.
 */
export function isSmsConfigured(env: Env): boolean {
  switch (env.SMS_PROVIDER) {
    case 'ESKIZ':
      return Boolean(env.SMS_API_TOKEN || (env.SMS_API_EMAIL && env.SMS_API_PASSWORD));
    case 'PLAYMOBILE':
      return Boolean(env.SMS_API_TOKEN);
    default:
      return false;
  }
}

/** Provayder sozlangan-sozlanmaganini bilish uchun */
export function isProviderConfigured(env: Env, provider: string): boolean {
  switch (provider) {
    case 'PAYME':
      return Boolean(env.PAYME_MERCHANT_ID && env.PAYME_KEY);
    case 'CLICK':
      return Boolean(env.CLICK_MERCHANT_ID && env.CLICK_SERVICE_ID && env.CLICK_SECRET_KEY);
    case 'UZUM':
      return Boolean(env.UZUM_MERCHANT_ID && env.UZUM_SECRET_KEY);
    case 'STRIPE':
      return Boolean(env.STRIPE_SECRET_KEY);
    default:
      return false;
  }
}
