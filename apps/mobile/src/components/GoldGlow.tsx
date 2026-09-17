import React, { useRef, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Ichidan oltin nur ko'tarilib turadigan ramka.
 *
 * Nur PASTDAN yuqoriga so'nib boradi, chegara esa oltin rangda turadi.
 *
 * DOIMIY yonadi — yonib-o'chmaydi. Avval "nafas oladigan" animatsiya
 * qilingan edi, lekin ikki sababga ko'ra o'zgartirildi:
 *
 *   1. Ko'z charchatadi — ekranda bir nechta ramka bo'lsa, hammasi
 *      miltillab turadi;
 *   2. Uzluksiz animatsiya arzon telefonni sekinlashtiradi va batareyani
 *      yeydi. Doimiy nurda bu xarajat umuman yo'q, shuning uchun uni
 *      istalgan miqdordagi ramkaga qo'yish mumkin.
 *
 * ISHLATISH
 *   <GoldGlow style={styles.card}>
 *     <Text>...</Text>
 *   </GoldGlow>
 *
 * `style` ichida `borderWidth` va `borderRadius` bering — chegara rangi
 * bu yerda qo'yiladi.
 */

/** Nurning yorqin yadrosi — chegara rangi ham shu */
const GOLD_CORE = '#FFD874';
/** Yumshoq, so'nib boruvchi qismi */
const GOLD_SOFT = '#F5B942';

let hisoblagich = 0;

/**
 * Faqat nurning o'zi — ramkasiz.
 *
 * Ota-element ichiga qo'yiladi va uni to'liq qoplaydi. Tayyor
 * komponentlarga (tugma, maydon) qo'shish uchun qulay: ularning o'z
 * ramkasi va foni bor, faqat ichki nur yetishmaydi.
 *
 * Ota-elementda `overflow: 'hidden'` bo'lishi kerak, aks holda nur
 * yumaloq burchaklardan chiqib ketadi.
 */
export function GoldSheen({ intensity = 1 }: { intensity?: number }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const gradientId = useRef(`goldSheen${hisoblagich++}`).current;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor={GOLD_CORE} stopOpacity={0.6 * intensity} />
              <Stop offset="35%" stopColor={GOLD_SOFT} stopOpacity={0.26 * intensity} />
              <Stop offset="100%" stopColor={GOLD_SOFT} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${gradientId})`} />
        </Svg>
      ) : null}
    </View>
  );
}

export function GoldGlow({
  children,
  style,
  /** Nurning kuchi: 1 — to'liq, 0.5 — ikki barobar yengil */
  intensity = 1,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  /*
   * Gradient identifikatori butun hujjatda YAGONA bo'lishi shart: bir xil
   * bo'lsa, brauzerda ikkinchi ramka birinchisining gradientini oladi va
   * nur noto'g'ri joyda chiqadi.
   */
  const gradientId = useRef(`goldGlow${hisoblagich++}`).current;

  return (
    <View
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      // Chegara rangi oldin qo'yiladi — chaqiruvchi uni bekor qila oladi
      // (masalan maydon fokusda yoki xato holatida boshqa rangga o'tadi)
      style={[{ borderColor: GOLD_CORE }, style]}
    >
      {size.w > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={size.w} height={size.h}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor={GOLD_CORE} stopOpacity={0.6 * intensity} />
                <Stop offset="35%" stopColor={GOLD_SOFT} stopOpacity={0.26 * intensity} />
                <Stop offset="100%" stopColor={GOLD_SOFT} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${gradientId})`} />
          </Svg>
        </View>
      ) : null}

      {children}
    </View>
  );
}
