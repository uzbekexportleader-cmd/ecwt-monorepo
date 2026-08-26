import { LOCALES, DEFAULT_LOCALE, type Locale } from '@ecwt/contracts';

export { LOCALES, DEFAULT_LOCALE };
export type { Locale };

/**
 * Uchinchi tomon i18n kutubxonasi ishlatilmayapti — 3 ta til va statik
 * lug'atlar uchun bu ortiqcha bo'lardi. Lug'atlar oddiy TS obyektlari,
 * ya'ni TypeScript yetishmayotgan kalitni o'zi topib beradi.
 */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Brauzer `Accept-Language` sarlavhasidan mos tilni tanlaydi.
 * Topilmasa — o'zbekcha.
 */
export function resolveLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const requested = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', q = 'q=1'] = part.trim().split(';');
      return { tag: tag.toLowerCase(), q: Number(q.replace('q=', '')) || 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of requested) {
    const base = tag.split('-')[0] ?? '';
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}
