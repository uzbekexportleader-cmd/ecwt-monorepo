import { loadEnv } from './env';

/**
 * Productionda xavfli konfiguratsiya bilan ishga tushishning oldini olish.
 *
 * Eng katta xavf — JWT kalitlari namunaviy holicha qolishi. Kalit ommaga
 * ma'lum bo'lgani uchun istalgan odam o'zini admin qilib ko'rsatuvchi token
 * yasab, barcha hunarmandlarning pasport, JShShIR va bank ma'lumotlariga
 * kirib oladi. Sxemaning o'zi faqat uzunlikni tekshiradi — shuning uchun bu
 * alohida himoya kerak.
 */

/** Har bir sinovda to'liq va o'zi-o'zicha yetarli sozlama */
function env(extra: Record<string, string>): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_ACCESS_SECRET: 'aVAmT9k2QeXr7sLpZbNfHjWdYcRgUiOaKtMvEwQxZnBl',
    JWT_REFRESH_SECRET: 'bQwErTyUiOpAsDfGhJkLzXcVbNm1234567890QwErTyU',
    ...extra,
  } as NodeJS.ProcessEnv;
}

describe('Production konfiguratsiya himoyasi', () => {
  it('namunaviy access kalit bilan ishga tushmaydi', () => {
    expect(() =>
      loadEnv(
        env({
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'change-me-access-secret-min-32-characters-long',
        }),
      ),
    ).toThrow(/JWT_ACCESS_SECRET hali namunaviy/);
  });

  it('namunaviy refresh kalit bilan ishga tushmaydi', () => {
    expect(() =>
      loadEnv(
        env({
          NODE_ENV: 'production',
          JWT_REFRESH_SECRET: 'change-me-refresh-secret-min-32-characters-long',
        }),
      ),
    ).toThrow(/JWT_REFRESH_SECRET hali namunaviy/);
  });

  it('ikkala kalit bir xil bo‘lsa ishga tushmaydi', () => {
    const same = 'zXcVbNmAsDfGhJkLqWeRtYuIoP1234567890zXcVbNm';
    expect(() =>
      loadEnv(
        env({ NODE_ENV: 'production', JWT_ACCESS_SECRET: same, JWT_REFRESH_SECRET: same }),
      ),
    ).toThrow(/bir xil/);
  });

  it('productionda SMS kodini javobda qaytarishga ruxsat bermaydi', () => {
    expect(() => loadEnv(env({ NODE_ENV: 'production', EXPOSE_DEV_OTP: 'true' }))).toThrow(
      /EXPOSE_DEV_OTP/,
    );
  });

  it('xato xabarida yangi kalit yaratish usuli ko‘rsatiladi', () => {
    expect(() =>
      loadEnv(env({ NODE_ENV: 'production', JWT_ACCESS_SECRET: 'change-me-xxxxxxxxxxxxxxxx' })),
    ).toThrow(/randomBytes/);
  });

  it('haqiqiy kalitlar bilan production ishga tushadi', () => {
    expect(() => loadEnv(env({ NODE_ENV: 'production' }))).not.toThrow();
  });

  it('development muhitida namunaviy kalitlarga xalaqit bermaydi', () => {
    expect(() =>
      loadEnv(
        env({
          NODE_ENV: 'development',
          JWT_ACCESS_SECRET: 'change-me-access-secret-min-32-characters-long',
          JWT_REFRESH_SECRET: 'change-me-refresh-secret-min-32-characters-long',
          EXPOSE_DEV_OTP: 'true',
        }),
      ),
    ).not.toThrow();
  });
});
