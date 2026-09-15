import * as SecureStore from 'expo-secure-store';

import { DEFAULT_LOCALE, setLocale, type Locale } from '../i18n';

const KEY_LOCALE = 'ecwt.locale';

const SUPPORTED: readonly Locale[] = ['uz', 'ru', 'en', 'kaa'];

function isLocale(value: string | null): value is Locale {
  return value !== null && (SUPPORTED as readonly string[]).includes(value);
}

/**
 * Ilova ochilganda tilni tiklaydi.
 *
 * Tartib: foydalanuvchi tanlagan til → o'zbekcha.
 *
 * Qurilma tiliga ATAYLAB qaramaymiz: ECWT — O'zbekiston kompaniyasi, ilova
 * o'zbek tilida ochilishi kerak. Telefoni ruscha yoki inglizcha bo'lgan
 * foydalanuvchi tilni birinchi ekrandayoq bir teginishda almashtira oladi.
 */
export async function restoreLocale(): Promise<Locale> {
  try {
    const saved = await SecureStore.getItemAsync(KEY_LOCALE);
    if (isLocale(saved)) {
      setLocale(saved);
      return saved;
    }
  } catch {
    // Xotira o'qilmasa — standart tilga tushamiz
  }

  setLocale(DEFAULT_LOCALE);
  return DEFAULT_LOCALE;
}

/**
 * Foydalanuvchi tanlagan tilni qo'llaydi va saqlaydi.
 *
 * Saqlash muvaffaqiyatsiz bo'lsa ham til darhol o'zgaradi — ekran kutib
 * turmaydi, faqat keyingi ochilishda tanlov esda qolmaydi.
 */
export async function changeLocale(locale: Locale): Promise<void> {
  setLocale(locale);
  try {
    await SecureStore.setItemAsync(KEY_LOCALE, locale);
  } catch {
    // saqlanmadi — jim o'tamiz
  }
}

export { DEFAULT_LOCALE };
