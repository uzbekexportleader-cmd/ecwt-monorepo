import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSegments } from 'expo-router';

import { colors } from '../theme';
import { useLoopingPlayback } from '../hooks/useLoopingPlayback';

/** Ro'yxatdan o'tish ekranlarining umumiy orqa fon videosi */
import AUTH_VIDEO from '../../assets/video/auth-bg.mp4';

/** Videoli `(auth)` ekranlari — qolganlarida (qulf, Face ID) fon boshqacha */
const AUTH_WITH_VIDEO = new Set(['welcome', 'phone', 'otp', 'biometric-setup']);

/**
 * Tunnel ekranlari (11–22-qadamlar) — ular ham shu videoning ustida turadi.
 *
 * Ro'yxatdan o'tish bilan tunnel bitta uzluksiz yo'l: fon o'rtada
 * o'zgarib ketsa, odam boshqa ilovaga tushgandek his qiladi. Shuning
 * uchun video shu yerda ham to'xtamaydi.
 */
const TUNNEL_WITH_VIDEO = new Set([
  'journey',
  'earnings',
  'payment',
  'contract',
  'about',
  'assistant',
]);

/** Parda quyuqligi almashganda sakramasin */
const SCRIM_FADE_MS = 260;

/**
 * Butun ro'yxatdan o'tish yo'li uchun YAGONA orqa fon videosi.
 *
 * Ilgari har bir ekran o'zining `useVideoPlayer` ini yaratardi. Ekran
 * almashganda eski pleyer yo'q qilinib, yangisi fayl noldan yuklardi — shu
 * sababli har bir o'tishda (orqaga bosganda ham) bir soniyalik uzilish
 * ko'rinardi.
 *
 * Endi pleyer navigatordan TASHQARIDA, ildizda bir marta yaratiladi va
 * ekranlar ustidan surilib o'tadi. Video hech qachon to'xtamaydi va
 * boshidan boshlanmaydi.
 *
 * Nima ko'rinishi marshrutdan aniqlanadi — ekranlar hech narsa
 * e'lon qilmaydi, shu bilan "kim videoni yoqadi" degan holat yo'qoladi.
 */
export function VideoBackdropHost({
  /**
   * Ishga tushish ekrani (splash) ko'rinib turganda `true` bo'ladi.
   *
   * Video shu paytda ham yuklanib, o'ynay boshlaydi — lekin splash uning
   * ustida to'liq yopib turadi. Splash tugaganda video allaqachon tayyor
   * bo'ladi va ekran bir lahzaga ham bo'sh qolmaydi.
   */
  preload = false,
}: {
  preload?: boolean;
}) {
  // `useSegments` marshrutlarga bog'langan tor tip qaytaradi — bu yerda
  // shunchaki qatorlar kerak, shu sababli kengaytiramiz.
  const segments = useSegments() as readonly string[];
  const group = segments[0] ?? '';
  const screen = segments[1] ?? '';

  const inSetup = group === '(setup)';
  const inAuth = group === '(auth)';
  /*
   * Tunnel ekranlari guruhsiz, ildizda turadi — shuning uchun ularning
   * nomi `segments[0]` da bo'ladi. `subsidy/online-mahalla` kabi ichki
   * yo'llar ham shu ro'yxatdagi birinchi bo'lak bilan aniqlanadi.
   */
  const inTunnel = TUNNEL_WITH_VIDEO.has(group) || group === 'subsidy';
  const visible = inSetup || inTunnel || (inAuth && AUTH_WITH_VIDEO.has(screen));

  // Splash ortida ham yuklanadi — o'tish payti ekran bo'sh qolmasin
  const active = visible || preload;

  // Faqat "Xush kelibsiz" yengil pardali — qolgan ekranlarda forma
  // maydonlari bor, ular uchun fon quyuqroq bo'lishi kerak.
  const strong = visible && !(inAuth && screen === 'welcome');

  const player = useVideoPlayer(AUTH_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Ko'rinmayotganda (masalan asosiy ilovada) video behuda o'ynamasin.
  // Pauza faylni tushirmaydi — qaytganda o'sha joyidan davom etadi.
  useLoopingPlayback(player, active);

  const darkness = useRef(new Animated.Value(strong ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(darkness, {
      toValue: strong ? 1 : 0,
      duration: SCRIM_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [strong, darkness]);

  if (!active) return null;

  return (
    <View style={styles.fill} pointerEvents="none">
      <VideoView style={styles.video} player={player} contentFit="cover" nativeControls={false} />

      {/* Yengil parda — doim turadi */}
      <Scrim id="scrimSoft" top="0.5" mid="0.42" bottom="0.82" />

      {/* Quyuq parda — forma ekranlarida yumshoq paydo bo'ladi */}
      <Animated.View style={[styles.fill, { opacity: darkness }]}>
        <Scrim id="scrimStrong" top="0.72" mid="0.66" bottom="0.9" />
      </Animated.View>
    </View>
  );
}

/** Video ustidagi yuqoridan pastga qorayadigan parda */
function Scrim({ id, top, mid, bottom }: { id: string; top: string; mid: string; bottom: string }) {
  return (
    <Svg style={styles.fill} width="100%" height="100%">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.bg} stopOpacity={top} />
          <Stop offset="45%" stopColor={colors.bg} stopOpacity={mid} />
          <Stop offset="100%" stopColor={colors.bg} stopOpacity={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  /*
   * Siljishsiz: `contentFit="cover"` videoni markazga joylashtiradi —
   * telefonda to'g'ri ko'rinadigan holat shu. Brauzer preview'idagi
   * "o'ngga siljigan" tuyg'u oyna nisbati tufayli, videoda emas.
   */
  video: { width: '100%', height: '100%' },
});
