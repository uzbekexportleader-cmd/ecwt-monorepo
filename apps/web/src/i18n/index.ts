import { uz, type Dictionary } from './dictionaries/uz';
import { ru } from './dictionaries/ru';
import { en } from './dictionaries/en';
import { DEFAULT_LOCALE, type Locale } from './config';

const DICTIONARIES: Record<Locale, Dictionary> = { uz, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export type { Dictionary, Locale };
export { DEFAULT_LOCALE };
export * from './config';
