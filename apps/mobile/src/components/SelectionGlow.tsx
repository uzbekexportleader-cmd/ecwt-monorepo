import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Tanlangan karta ostidan ko'tariladigan oltin nur — Xush kelibsiz betidagi kabi */
const GOLD_CORE = '#FFD874';
const GOLD_SOFT = '#F5B942';

/** Nur paydo bo'lish va "nafas olish" tezligi */
const FADE_MS = 260;
const BREATHE_MS = 1300;

/**
 * Tanlangan kartaning ostidan ko'tariladigan nur.
 *
 * Foydalanuvchi javobi qabul qilinganini darhol ko'rsatadi: nur yumshoq
 * paydo bo'ladi va yonib-o'chib turadi. Tanlov olib tashlansa — so'nadi.
 *
 * Ota-elementga `position: relative` va `overflow: hidden` kerak, aks holda
 * nur karta chetidan tashqariga chiqib ketadi.
 */
export function SelectionGlow({ selected }: { selected: boolean }) {
  const glow = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Bir ekranda bir nechta karta bo'ladi — gradient identifikatori
  // takrorlanmasligi kerak, aks holda hammasi bitta gradientni ulashadi.
  const gradientId = `glow${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    if (!selected) {
      Animated.timing(glow, {
        toValue: 0,
        duration: FADE_MS,
        // Rang/gradient animatsiyasi native driver bilan ishlamaydi
        useNativeDriver: false,
      }).start();
      return;
    }

    // Avval to'liq yonadi, so'ng yumshoq nafas oladi
    const animation = Animated.sequence([
      Animated.timing(glow, {
        toValue: 1,
        duration: FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, {
            toValue: 0.55,
            duration: BREATHE_MS,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(glow, {
            toValue: 1,
            duration: BREATHE_MS,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
        // Standart holatda `loop` har aylanish oldidan qiymatni boshlang'ich
        // holatga (0 ga) qaytaradi — natijada tanlangan karta har safar bir
        // lahzaga butunlay so'nardi. Bu yerda nur 0.55 dan pastga tushmasligi
        // kerak: javob tanlangani doim ko'rinib tursin.
        { resetBeforeIteration: false },
      ),
    ]);

    animation.start();
    return () => animation.stop();
  }, [selected, glow]);

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: glow }]}
      pointerEvents="none"
      onLayout={onLayout}
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor={GOLD_CORE} stopOpacity="0.55" />
              <Stop offset="40%" stopColor={GOLD_SOFT} stopOpacity="0.22" />
              <Stop offset="100%" stopColor={GOLD_SOFT} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${gradientId})`} />
        </Svg>
      ) : null}
    </Animated.View>
  );
}
