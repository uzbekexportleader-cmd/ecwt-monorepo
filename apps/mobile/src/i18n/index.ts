import { useSyncExternalStore } from 'react';

import { uz } from './uz';
import { ru } from './ru';
import { en } from './en';
import { kaa } from './kaa';

/**
 * ECWT ilovasining tili.
 *
 * To'rt til qo'llab-quvvatlanadi. Har bir lug'atda kalitlar bir xil bo'lishi
 * shart — TypeScript buni `Record<keyof typeof uz, string>` orqali tekshiradi,
 * shu sababli tarjima tushib qolsa kod yig'ilmaydi va ekranda aralash matn
 * paydo bo'lmaydi.
 */
export type Locale = 'uz' | 'ru' | 'en' | 'kaa';
export type TranslationKey = keyof typeof uz;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { uz, ru, en, kaa };

export const DEFAULT_LOCALE: Locale = 'uz';

/** Sozlamalar ekranida ko'rsatiladigan ro'yxat — har biri o'z tilida */
export const LOCALES: { code: Locale; label: string; short: string; english: string }[] = [
  { code: 'uz', label: 'O‘zbekcha', short: 'O‘zb', english: 'Uzbek' },
  { code: 'ru', label: 'Русский', short: 'Рус', english: 'Russian' },
  { code: 'en', label: 'English', short: 'Eng', english: 'English' },
  { code: 'kaa', label: 'Qaraqalpaqsha', short: 'Qrq', english: 'Karakalpak' },
];

/* --------------------------- joriy til (holat) --------------------------- */

let current: Locale = DEFAULT_LOCALE;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/**
 * Tilni almashtiradi.
 *
 * Bu yerda faqat xotiradagi qiymat o'zgaradi — diskka saqlash va serverga
 * yuborish `store/locale.ts` ning ishi. Shu sababli lug'at moduli boshqa
 * narsalarga bog'lanib qolmaydi.
 */
export function setLocale(locale: Locale): void {
  if (current === locale) return;
  current = locale;
  emit();
}

export function getLocale(): Locale {
  return current;
}

/** Til o'zgarganda komponentlar qayta chizilishi uchun */
export function useLocale(): Locale {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getLocale,
    getLocale,
  );
}

/* ------------------------------- tarjima -------------------------------- */

export function translate(
  key: TranslationKey,
  locale: Locale = current,
  vars?: Record<string, string | number>,
): string {
  // Tarjima topilmasa o'zbekchaga qaytamiz — bo'sh matn ko'rinmasin
  const raw = dictionaries[locale]?.[key] ?? uz[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), raw);
}

/** Komponentlarda: const t = useT(); t('home.greeting', { name }) */
export function useT(): (key: TranslationKey, vars?: Record<string, string | number>) => string {
  const locale = useLocale();
  return (key, vars) => translate(key, locale, vars);
}
