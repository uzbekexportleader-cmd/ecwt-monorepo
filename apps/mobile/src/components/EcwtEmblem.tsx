import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';

import { colors } from '../theme';

/**
 * ECWT emblemi: dunyo shari, ustida ECWT yozuvi, atrofida savdo
 * platformalari halqasi.
 *
 * Halqa sekin aylanadi, lekin har bir belgi teng va qarama-qarshi burchakda
 * qayta buriladi — shu sababli harflar doim tik turadi, teskari bo'lib
 * qolmaydi.
 *
 * Platformalar rasmiy brend logotiplari bilan ko'rsatiladi (Font Awesome 6
 * Free brands to'plami).
 */

/**
 * Faqat haqiqiy brend logotiplari ishlatiladi (Font Awesome 6 Free brands).
 * Walmart, Mercari, Bonanza va Poshmark uchun bepul rasmiy glif yo'q —
 * ularning logotip fayllari berilsa, shu ro'yxatga qo'shiladi.
 */
const PLATFORMS: { icon: 'amazon' | 'ebay' | 'google' | 'facebook' | 'tiktok'; color: string }[] = [
  { icon: 'amazon', color: '#FF9900' },
  { icon: 'ebay', color: '#E53238' },
  { icon: 'tiktok', color: '#111111' },
  { icon: 'facebook', color: '#1877F2' },
  { icon: 'google', color: '#4285F4' },
];

/** SVG viewBox koordinatalari */
const VB = 400;
const CENTER = VB / 2;
const ORBIT_R = 152;
const BADGE_R = 27;

export function EcwtEmblem({ size = 320 }: { size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 48000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const orbit = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const upright = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  const scale = size / VB;
  const badgePx = BADGE_R * 2 * scale;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Shar va ECWT — tinch turadi */}
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="globeLine" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor="#2563EB" />
          </LinearGradient>
          <LinearGradient id="orbitLine" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.25" />
          </LinearGradient>
        </Defs>

        {/* Platformalar yo'li */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_R}
          stroke="url(#orbitLine)"
          strokeWidth="2"
          fill="none"
          opacity="0.45"
        />

        {/* Shar */}
        <G opacity="0.95">
          <Circle cx={CENTER} cy={CENTER} r="106" stroke="url(#globeLine)" strokeWidth="3" fill="none" />
          <Ellipse
            cx={CENTER}
            cy={CENTER}
            rx="42"
            ry="106"
            stroke="url(#globeLine)"
            strokeWidth="2"
            fill="none"
            opacity="0.75"
          />
          <Ellipse
            cx={CENTER}
            cy={CENTER}
            rx="80"
            ry="106"
            stroke="url(#globeLine)"
            strokeWidth="1.6"
            fill="none"
            opacity="0.5"
          />
          <Path
            d={`M ${CENTER - 106} ${CENTER} H ${CENTER + 106}`}
            stroke="url(#globeLine)"
            strokeWidth="2"
            opacity="0.75"
          />
          <Path
            d={`M ${CENTER - 92} ${CENTER - 52} H ${CENTER + 92}`}
            stroke="url(#globeLine)"
            strokeWidth="1.6"
            opacity="0.5"
          />
          <Path
            d={`M ${CENTER - 92} ${CENTER + 52} H ${CENTER + 92}`}
            stroke="url(#globeLine)"
            strokeWidth="1.6"
            opacity="0.5"
          />
        </G>

        {/* ECWT — yarmi och kul rang, yarmi ko'k */}
        <SvgText
          x={CENTER}
          y={CENTER + 18}
          textAnchor="middle"
          fontSize="60"
          fontWeight="900"
          fontFamily="System"
          letterSpacing="-1"
        >
          <TSpan fill="#E6EAF0">EC</TSpan>
          <TSpan fill="#2D86F5">WT</TSpan>
        </SvgText>
      </Svg>

      {/* Aylanuvchi halqa — belgilar tik holatda qoladi */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: orbit }] }]}
        pointerEvents="none"
      >
        {PLATFORMS.map((p, i) => {
          const angle = (i / PLATFORMS.length) * Math.PI * 2 - Math.PI / 2;
          const x = CENTER + ORBIT_R * Math.cos(angle);
          const y = CENTER + ORBIT_R * Math.sin(angle);
          return (
            <Animated.View
              key={p.icon}
              style={[
                styles.badge,
                {
                  left: x * scale - badgePx / 2,
                  top: y * scale - badgePx / 2,
                  width: badgePx,
                  height: badgePx,
                  borderRadius: badgePx / 2,
                  borderColor: p.color,
                  transform: [{ rotate: upright }],
                },
              ]}
            >
              <FontAwesome6 name={p.icon} iconStyle="brands" size={badgePx * 0.5} color={p.color} />
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
  },
});
