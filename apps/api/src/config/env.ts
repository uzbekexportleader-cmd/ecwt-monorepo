import { z } from 'zod';

/**
 * Environment validatsiyasi. Ilova noto'g'ri konfiguratsiya bilan ishga
 * tushmasligi kerak — xato bo'lsa startda tushuntirib to'xtaydi.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8081'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL majburiy'),
  /**
   * Ulanishlar pooli hajmi.
   * Lokal dev bazasi (PGlite) bir vaqtning o'zida bitta ulanishni qabul qiladi,
   * shuning uchun default = 1. Real PostgreSQL uchun 10–20 qo'ying.
   */
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(1),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET kamida 16 belgi'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET kamida 16 belgi'),
  /** '15m' / '3600' ko'rinishida beriladi, soniyaga aylantiriladi */
  JWT_ACCESS_TTL: z.string().default('15m').transform(parseDurationSeconds),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).default(30),

  SMS_PROVIDER: z.enum(['mock', 'eskiz', 'playmobile']).default('mock'),
  /** Ikki OTP so‘rovi orasidagi minimal kutish (soniya) */
  OTP_RESEND_COOLDOWN_SEC: z.coerce.number().int().min(0).optional(),
  /** Bir telefon raqamiga soatiga ruxsat etilgan OTP so‘rovlari soni */
  OTP_HOURLY_LIMIT: z.coerce.number().int().min(1).optional(),
  /** Endpoint bo‘yicha daqiqadagi so‘rovlar limiti */
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(10).optional(),
  EXPOSE_DEV_OTP: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  /** Elektron imzo tizimi (didox.uz) — kalitlar berilmasa ulanmaydi */
  ESIGN_API_URL: z.string().optional(),
  ESIGN_API_KEY: z.string().optional(),
  ESIGN_TIN: z.string().optional(),

  ESKIZ_EMAIL: z.string().optional(),
  ESKIZ_PASSWORD: z.string().optional(),
  ESKIZ_BASE_URL: z.string().optional(),
  /** Yuboruvchi nomi. Moderatsiyadan oldin Eskiz sinov raqami — 4546. */
  ESKIZ_FROM: z.string().default('4546'),
  PLAYMOBILE_LOGIN: z.string().optional(),
  PLAYMOBILE_PASSWORD: z.string().optional(),
  PLAYMOBILE_BASE_URL: z.string().optional(),

  IDENTITY_PROVIDER: z.enum(['mock', 'oneid']).default('mock'),
  ONEID_BASE_URL: z.string().optional(),
  /** Telegram bot: yangi ariza haqida xabar yuboriladigan kanal */
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  /** ECWT shartnoma namunasi fayli (yuridik bo'lim tayyorlaydi) */
  CONTRACT_TEMPLATE_PATH: z.string().optional(),

  ONEID_CLIENT_ID: z.string().optional(),
  ONEID_CLIENT_SECRET: z.string().optional(),
  ONEID_REDIRECT_URI: z.string().optional(),

  SIGNATURE_PROVIDER: z.enum(['mock', 'eimzo']).default('mock'),
  EIMZO_BASE_URL: z.string().optional(),
  EIMZO_API_KEY: z.string().optional(),

  REGISTRY_PROVIDER: z.enum(['mock', 'real']).default('mock'),
  TAX_REGISTRY_BASE_URL: z.string().optional(),
  TAX_REGISTRY_API_KEY: z.string().optional(),
  HUNARMAND_REGISTRY_BASE_URL: z.string().optional(),
  HUNARMAND_REGISTRY_API_KEY: z.string().optional(),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  MARKETPLACE_PROVIDER: z.enum(['mock', 'real']).default('mock'),

  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  /**
   * Sentry (xatolarni kuzatish). Bo'sh bo'lsa — o'chirilgan holda ishlaydi,
   * shuning uchun lokal ishlab chiqishda hech narsa sozlash shart emas.
   */
  SENTRY_DSN: z.string().optional(),
  /** Tranzaksiyalarning qancha qismi yig'iladi (0..1). Productionda 0.1 yetarli */
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

  SEED_ADMIN_PHONE: z.string().default('998900000001'),
  SEED_ADMIN_PASSWORD: z.string().default('Admin12345!'),
  SEED_DEMO_USER_PHONE: z.string().default('998901234567'),

  BHM: z.coerce.number().int().min(1).default(412_000),
});

/** '15m', '2h', '30s' yoki oddiy son (soniya) → soniya. */
function parseDurationSeconds(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) return 900;
  const amount = Number(match[1]);
  switch (match[2]) {
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86_400;
    default:
      return amount;
  }
}

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Namunaviy (`.env.example` dan ko'chirilgan) qiymatlar shu belgi bilan
 * boshlanadi. Ular ommaga ma'lum, shuning uchun productionda ishlatilishi
 * mumkin emas.
 */
const PLACEHOLDER_PREFIX = 'change-me';

/**
 * Productionda xavfli konfiguratsiya bilan ishga tushishni TO'XTATADI.
 *
 * Eng katta xavf — JWT kalitlari. Ular namunaviy holicha qolsa, kalit
 * ommaga ma'lum bo'lgani uchun istalgan odam o'zini admin qilib ko'rsatuvchi
 * token yasab, barcha hunarmandlarning pasport, JShShIR va bank
 * ma'lumotlariga kirib oladi.
 *
 * Sxema faqat uzunlikni tekshiradi — mazmunini emas. Shu sababli bu alohida
 * tekshiruv kerak. Xuddi shunday himoya `prisma/seed.ts` da ham bor
 * (`assertSafeToSeed`).
 */
function assertProductionSafe(env: Env): void {
  if (env.NODE_ENV !== 'production') return;

  const problems: string[] = [];

  if (env.JWT_ACCESS_SECRET.startsWith(PLACEHOLDER_PREFIX)) {
    problems.push('JWT_ACCESS_SECRET hali namunaviy qiymatda');
  }
  if (env.JWT_REFRESH_SECRET.startsWith(PLACEHOLDER_PREFIX)) {
    problems.push('JWT_REFRESH_SECRET hali namunaviy qiymatda');
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET va JWT_REFRESH_SECRET bir xil — ular farq qilishi shart');
  }
  if (env.EXPOSE_DEV_OTP) {
    problems.push('EXPOSE_DEV_OTP yoqiq — productionda SMS kodi javobda qaytmasligi kerak');
  }

  if (problems.length > 0) {
    throw new Error(
      'Production uchun xavfli konfiguratsiya — server ishga tushirilmadi:\n' +
        problems.map((p) => `  • ${p}`).join('\n') +
        '\n\nYangi kalit yaratish: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  /*
   * Kesh faqat haqiqiy `process.env` uchun ishlaydi — u ilova ishlashi
   * davomida o'zgarmaydi, shuning uchun qayta-qayta tekshirish ortiqcha.
   * Aniq berilgan boshqa manba (masalan testdagi sozlama) har safar
   * qaytadan tekshiriladi, aks holda birinchi chaqiruv natijasi
   * keyingilarini yashirib qo'yardi.
   */
  const useCache = source === process.env;
  if (useCache && cached) return cached;

  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Environment konfiguratsiyasi noto'g'ri:\n${lines.join('\n')}`);
  }
  assertProductionSafe(parsed.data);

  if (useCache) cached = parsed.data;
  return parsed.data;
}

export function corsOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Cheklovlar: productionda qat'iy, developmentda yumshoq.
 * Dev muhitida sinov paytida foydalanuvchi bloklanib qolmasligi kerak.
 */
export function limits(env: Env) {
  const dev = env.NODE_ENV !== 'production';
  return {
    otpResendCooldownSec: env.OTP_RESEND_COOLDOWN_SEC ?? (dev ? 10 : 60),
    otpHourlyLimit: env.OTP_HOURLY_LIMIT ?? (dev ? 200 : 5),
    ratePerMinute: env.RATE_LIMIT_PER_MINUTE ?? (dev ? 300 : 60),
  };
}

export const ENV = 'ENV_TOKEN';
