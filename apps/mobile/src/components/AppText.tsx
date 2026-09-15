import React from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { fontFamilyFor } from '../fonts';

/**
 * Ilovaning o'z `Text` va `TextInput` komponentlari.
 *
 * NEGA KERAK: shrift ko'rsatilmasa, Android telefonning TIZIM shriftini
 * oladi. Xiaomi/MIUI, Samsung One UI kabi qobiqlarda foydalanuvchi tizim
 * shriftini almashtirgan bo'lsa, ilova butunlay boshqacha ko'rinadi.
 *
 * Shu sababli barcha ekranlar `react-native` o'rniga shu yerdan `Text`
 * import qiladi — shrift bir joyda beriladi, uslubda `fontFamily` ko'rsatilgan
 * bo'lsa o'shanisi ustun turadi.
 */
/**
 * Uslubni tayyorlaydi: qalinlikka mos shrift oilasi qo'yiladi va `fontWeight`
 * OLIB TASHLANADI.
 *
 * Android'da qadalgan shrift oilasi bilan `fontWeight` birga berilsa, tizim
 * o'sha oilaning qalin variantini qidiradi, topolmaydi va standart tizim
 * shriftiga qaytib ketadi — natijada qalin yozuvlar boshqa shriftda chiqadi.
 * Qalinlik allaqachon oila nomida (masalan Inter_700Bold), shuning uchun
 * `fontWeight` keraksiz.
 */
function withFont(style: TextProps['style']): TextStyle[] {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight: _weight, ...rest } = flat;
  return [rest, { fontFamily: fontFamilyFor(flat) }];
}

export const Text = React.forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  return <RNText ref={ref} {...props} style={withFont(style)} />;
});

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...props },
  ref,
) {
  return <RNTextInput ref={ref} {...props} style={withFont(style)} />;
});
