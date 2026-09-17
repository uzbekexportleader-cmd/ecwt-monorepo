import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * "Ipak" dizayn yo'nalishi — tilla → atirgul → ko'k gradient.
 *
 * Ikkita shakli bor:
 *
 *   SilkFrame — gradient CHEGARA. Ichi to'q, faqat chetlari rangli.
 *               Kartalar, maydonlar, ikkinchi darajali tugmalar uchun.
 *
 *   SilkFill  — gradient TO'LDIRISH. Butun yuza rangli.
 *               Faqat asosiy tugma uchun — ekranda bittadan ko'p
 *               bo'lmasligi kerak, aks holda ko'z qayerga qarashni
 *               bilmay qoladi.
 *
 * NEGA SVG
 * React Native'da CSS'dagi `border-image` yo'q, `expo-linear-gradient`
 * esa loyihada o'rnatilmagan. `react-native-svg` allaqachon ishlatilgani
 * uchun gradient shu orqali chiziladi: tashqi qatlam — gradient, ustiga
 * bir piksel ichkarida to'q fon qo'yiladi va chetda faqat rangli chiziq
 * qoladi.
 */

/* Ipak ranglari */
const GOLD = '#E3B64B';
const ROSE = '#E2758F';
const BLUE = '#7FA6E8';

/** Asosiy tugma matni — gradient ustida o'qilishi uchun juda to'q */
export const SILK_ON_FILL = '#241019';

/** Chegara qalinligi */
const EDGE = 1;

/**
 * SVG uchun radiusni cheklaydi.
 *
 * SVG'da `rx` qiymati tomonning yarmidan katta bo'lsa, to'rtburchak
 * ELLIPSga aylanadi — tabletka shakli o'rniga qovun chiqadi. CSS bunday
 * qiymatni o'zi cheklaydi, SVG esa cheklamaydi, shuning uchun qo'lda
 * qisqartiramiz.
 */
function xavfsizRadius(radius: number, w: number, h: number): number {
  return Math.max(0, Math.min(radius, w / 2, h / 2));
}

let hisoblagich = 0;

/* ------------------------------ chegara ------------------------------ */

export function SilkFrame({
  children,
  style,
  radius = 18,
  /** Ichki fon — chegara ichida ko'rinadigan rang */
  fill = '#121A2C',
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  radius?: number;
  fill?: string;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useRef(`silkEdge${hisoblagich++}`).current;

  return (
    <View
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
    >
      {size.w > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={size.w} height={size.h}>
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={GOLD} />
                <Stop offset="52%" stopColor={ROSE} />
                <Stop offset="100%" stopColor={BLUE} />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={size.w}
              height={size.h}
              rx={xavfsizRadius(radius, size.w, size.h)}
              fill={`url(#${id})`}
            />
            {/*
              Ichki to'q maydon: chegara qalinligicha ichkarida turadi va
              gradientdan faqat chetdagi chiziq ko'rinib qoladi.
            */}
            <Rect
              x={EDGE}
              y={EDGE}
              width={Math.max(size.w - EDGE * 2, 0)}
              height={Math.max(size.h - EDGE * 2, 0)}
              rx={xavfsizRadius(radius - EDGE, size.w - EDGE * 2, size.h - EDGE * 2)}
              fill={fill}
            />
          </Svg>
        </View>
      ) : null}

      {children}
    </View>
  );
}

/* --------------------------- faqat chegara --------------------------- */

/**
 * Gradient chegara — mavjud komponentning USTIGA qo'yiladi.
 *
 * `SilkFrame` elementni o'rab oladi; bu esa o'ramaydi, faqat ichiga
 * tushadi. Ota-elementda `ref` bo'lsa yoki tuzilmani o'zgartirib
 * bo'lmasa (masalan matn maydoni), shu ishlatiladi.
 *
 * Ota-elementda `borderWidth: 0` va `overflow: 'hidden'` bo'lsin.
 */
export function SilkEdge({ radius = 12, width = 1 }: { radius?: number; width?: number }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useRef(`silkRing${hisoblagich++}`).current;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={GOLD} />
              <Stop offset="52%" stopColor={ROSE} />
              <Stop offset="100%" stopColor={BLUE} />
            </LinearGradient>
          </Defs>
          {/* Chiziq markazi chetdan yarim qalinlikda ichkarida turadi,
              aks holda uning yarmi ko'rinmay qoladi */}
          <Rect
            x={width / 2}
            y={width / 2}
            width={Math.max(size.w - width, 0)}
            height={Math.max(size.h - width, 0)}
            rx={xavfsizRadius(radius - width / 2, size.w - width, size.h - width)}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={width}
          />
        </Svg>
      ) : null}
    </View>
  );
}

/* ---------------------------- to'ldirish ----------------------------- */

export function SilkFill({
  children,
  style,
  radius = 999,
  /** Ustidan yugurib o'tadigan yaltiroq chiziq */
  sheen = true,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  radius?: number;
  sheen?: boolean;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useRef(`silkFill${hisoblagich++}`).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!sheen) return;
    /*
      Yaltiroq chiziq uzun tanaffus bilan yuguradi: uzluksiz miltillash
      ko'zni charchatadi, uzoq oraliq esa e'tiborni bir lahzaga tortadi.
    */
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2600),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, sheen]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-size.w || -200, size.w || 200],
  });

  return (
    <View
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
    >
      {size.w > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={size.w} height={size.h}>
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0.6">
                <Stop offset="0%" stopColor={GOLD} />
                <Stop offset="100%" stopColor={ROSE} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={size.w} height={size.h} fill={`url(#${id})`} />
          </Svg>
        </View>
      ) : null}

      {sheen && size.w > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX }, { rotate: '18deg' }] },
          ]}
        >
          <Svg width={size.w} height={size.h * 2} style={{ marginTop: -size.h / 2 }}>
            <Defs>
              <LinearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect
              x={size.w * 0.38}
              y="0"
              width={size.w * 0.24}
              height={size.h * 2}
              fill={`url(#${id}s)`}
            />
          </Svg>
        </Animated.View>
      ) : null}

      {children}
    </View>
  );
}
