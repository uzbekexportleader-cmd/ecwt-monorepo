import { type TextStyle } from 'react-native';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { Tinos_700Bold } from '@expo-google-fonts/tinos';

/**
 * Ilova shriftlari.
 *
 * NEGA KERAK: shrift ko'rsatilmasa, Android telefonning TIZIM shriftini
 * oladi. Xiaomi/MIUI, Samsung One UI kabi qobiqlarda foydalanuvchi tizim
 * shriftini o'zgartirgan bo'lsa, ilova butunlay boshqacha ko'rinadi.
 * Shriftni ilovaga qadash — buni hal qilishning yagona ishonchli yo'li.
 *
 * Inter — barcha interfeys yozuvlari uchun.
 * Tinos — ECWT logotipi uchun (Times bilan bir xil o'lchamli serif).
 */
export const APP_FONTS = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
  Tinos_700Bold,
};

/** Interfeys shriftlari — Animated.Text kabi joylarda ochiq ishlatiladi */
export const UI_FONT_REGULAR = 'Inter_400Regular';
export const UI_FONT_SEMIBOLD = 'Inter_600SemiBold';
export const UI_FONT_BOLD = 'Inter_700Bold';

/** Logotipdagi harflar shrifti */
export const LOGO_FONT = 'Tinos_700Bold';

/** Qalinlik -> Inter oilasi */
const FAMILY_BY_WEIGHT: Record<string, string> = {
  '100': 'Inter_400Regular',
  '200': 'Inter_400Regular',
  '300': 'Inter_400Regular',
  '400': 'Inter_400Regular',
  normal: 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  bold: 'Inter_700Bold',
  '800': 'Inter_900Black',
  '900': 'Inter_900Black',
};

/**
 * Uslubdagi qalinlikka mos Inter oilasini qaytaradi.
 *
 * Android'da bitta shrift oilasining qalinliklari avtomatik almashmaydi —
 * har bir qalinlik alohida fayl, shuning uchun oilani o'zimiz tanlaymiz.
 */
export function fontFamilyFor(style: TextStyle | undefined): string {
  const weight = style?.fontWeight;
  return FAMILY_BY_WEIGHT[String(weight ?? '400')] ?? FAMILY_BY_WEIGHT['400'];
}
