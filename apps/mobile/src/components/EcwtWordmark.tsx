import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Mask,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { LOGO_FONT } from '../fonts';

/**
 * RN'ning Animated komponenti View uchun mo'ljallangan ichki proplarni
 * (collapsable, needsOffscreenAlphaCompositing) ham uzatadi. Web'da ular
 * to'g'ridan-to'g'ri SVG DOM elementiga tushib, "Received false for a
 * non-boolean attribute" ogohlantirishini chiqaradi — shuning uchun
 * Rect'ga yetib bormasdan filtrlanadi.
 */
type RawRectProps = React.ComponentProps<typeof Rect> & {
  collapsable?: boolean;
  needsOffscreenAlphaCompositing?: boolean;
};

const RawRect = React.forwardRef<React.ComponentRef<typeof Rect>, RawRectProps>(
  ({ collapsable: _collapsable, needsOffscreenAlphaCompositing: _compositing, ...rest }, ref) => (
    <Rect ref={ref} {...rest} />
  ),
);
const AnimatedRect = Animated.createAnimatedComponent(RawRect);

/**
 * ECWT logotipi.
 *
 * "EC" — kumush, "WT" — ko'k; ostida hajm (3D) effekti uchun bir necha
 * siljitilgan nusxa chiziladi. Vektor bo'lgani uchun har qanday ekranda
 * tiniq chiqadi.
 *
 * Ikki rang qanday chiqarilgani muhim: harflar BITTA markazlangan yozuv
 * sifatida chiziladi va niqob (mask) bo'lib xizmat qiladi, ustidan esa chap
 * va o'ng to'rtburchaklar bo'yaladi. Avval `<TSpan>` ishlatilgan edi, lekin
 * Android'da har bir TSpan alohida markazlashib, harflar bir-birining ustiga
 * chiqib ketardi. Niqob usulida markazlash ikkala platformada bir xil.
 *
 * Eslatma: brendning rasmiy fayli (PNG/SVG) berilsa, shu komponent ichini
 * o'sha fayl bilan almashtirish kifoya — qolgan ekranlarga tegilmaydi.
 */

const VIEW_W = 660;
const VIEW_H = 228;
const CENTER = VIEW_W / 2;
const BASELINE = 148;
const FONT_SIZE = 150;

/** "EC" va "WT" orasidagi chegara — C bilan W oralig'iga to'g'ri keladi */
const SPLIT = 314;

/** Bo'yaladigan tasma: harflar shu oraliqda joylashadi */
const BAND_Y = 6;
const BAND_H = 164;

/** Hajm effekti: pastga-o'ngga siljigan qatlamlar */
const DEPTH = [7, 6, 5, 4, 3, 2, 1];

export function EcwtWordmark({ width = 260 }: { width?: number }) {
  const height = (width * VIEW_H) / VIEW_W;

  // Logotip chiqqach ustidan bir marta yorug'lik yuguradi
  const shine = useRef(new Animated.Value(0)).current;
  const BAND = 220;

  useEffect(() => {
    Animated.timing(shine, {
      toValue: 1,
      delay: 1000,
      // Sekin va bir tekis: tez o'tib ketmasin
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [shine]);

  const shineX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAND, VIEW_W + BAND],
  });

  const letters = {
    textAnchor: 'middle' as const,
    // Telefonning tizim shrifti logotipni o'zgartirib yubormasin
    fontFamily: LOGO_FONT,
    fontSize: String(FONT_SIZE),
    fontWeight: '700' as const,
    letterSpacing: '-2',
  };

  return (
    <View style={{ width, height }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          <LinearGradient id="ecwtSilver" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="42%" stopColor="#F4F6F9" />
            <Stop offset="52%" stopColor="#C6CBD3" />
            <Stop offset="72%" stopColor="#E8EBEF" />
            <Stop offset="100%" stopColor="#FFFFFF" />
          </LinearGradient>

          <LinearGradient id="ecwtBlue" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#4FA3FF" />
            <Stop offset="42%" stopColor="#2D86F5" />
            <Stop offset="52%" stopColor="#0E5FD8" />
            <Stop offset="72%" stopColor="#2276EC" />
            <Stop offset="100%" stopColor="#5AA9FF" />
          </LinearGradient>

          <LinearGradient id="ecwtEdgeLight" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#9BA2AC" />
            <Stop offset="100%" stopColor="#6E7681" />
          </LinearGradient>

          <LinearGradient id="ecwtEdgeBlue" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0B4FB5" />
            <Stop offset="100%" stopColor="#063A88" />
          </LinearGradient>

          {/* Yorug'lik chizig'i */}
          <LinearGradient id="ecwtShine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>

          {/* Hajm qatlamlari niqobi */}
          <Mask id="ecwtDepthMask">
            {DEPTH.map((d) => (
              <SvgText key={d} x={CENTER + d} y={BASELINE + d} fill="#FFFFFF" {...letters}>
                ECWT
              </SvgText>
            ))}
          </Mask>

          {/* Old yuza niqobi — yorug'lik ham shundan foydalanadi */}
          <Mask id="ecwtMask">
            <SvgText x={CENTER} y={BASELINE} fill="#FFFFFF" {...letters}>
              ECWT
            </SvgText>
          </Mask>
        </Defs>

        {/* Hajm (extrusion) */}
        <Rect
          x="0"
          y={BAND_Y}
          width={SPLIT}
          height={BAND_H}
          fill="url(#ecwtEdgeLight)"
          mask="url(#ecwtDepthMask)"
        />
        <Rect
          x={SPLIT}
          y={BAND_Y}
          width={VIEW_W - SPLIT}
          height={BAND_H}
          fill="url(#ecwtEdgeBlue)"
          mask="url(#ecwtDepthMask)"
        />

        {/* Old yuza: chapda kumush "EC", o'ngda ko'k "WT" */}
        <Rect
          x="0"
          y={BAND_Y}
          width={SPLIT}
          height={BAND_H}
          fill="url(#ecwtSilver)"
          mask="url(#ecwtMask)"
        />
        <Rect
          x={SPLIT}
          y={BAND_Y}
          width={VIEW_W - SPLIT}
          height={BAND_H}
          fill="url(#ecwtBlue)"
          mask="url(#ecwtMask)"
        />

        {/* Tagidagi yozuv: E-COMMERCE WORLD TRADE */}
        <Line
          x1="152"
          y1="195"
          x2="184"
          y2="195"
          stroke="#66748C"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <SvgText
          x={CENTER}
          y={200}
          textAnchor="middle"
          fontFamily={LOGO_FONT}
          fontSize="19"
          fontWeight="600"
          letterSpacing="3"
          fill="#78859B"
        >
          E-COMMERCE WORLD TRADE
        </SvgText>
        <Line
          x1="476"
          y1="195"
          x2="508"
          y2="195"
          stroke="#66748C"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Chapdan o'ngga bir marta yuguradigan yorug'lik */}
        <AnimatedRect
          x={shineX}
          y="0"
          width={BAND}
          height={VIEW_H}
          fill="url(#ecwtShine)"
          mask="url(#ecwtMask)"
        />
      </Svg>
    </View>
  );
}
