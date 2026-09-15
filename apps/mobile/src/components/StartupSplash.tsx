import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePlayOnce } from '../hooks/usePlayOnce';
import { Text } from './AppText';

import { colors, spacing } from '../theme';
import { translate } from '../i18n';
import { UI_FONT_SEMIBOLD } from '../fonts';
import { EcwtWordmark } from './EcwtWordmark';

/** Ishga tushish ekranining orqa fon videosi */
import SPLASH_VIDEO from '../../assets/video/splash-bg.mp4';

/**
 * ECWT ishga tushish ekrani.
 *
 * Maqsad — iPhone yoqilgandagi Apple logotipi kabi toza, tinch taassurot:
 * markazda logo, ostida kompaniya nomi, eng pastda juda nozik yuklanish
 * indikatori. Boshqa hech narsa yo'q.
 */
export function StartupSplash({
  visible = true,
  onVideoEnd,
}: {
  visible?: boolean;
  /** Video oxirigacha o'ynab bo'lganda chaqiriladi */
  onVideoEnd?: () => void;
}) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  // Orqa fon videosi: ovozsiz, uzluksiz takrorlanadi
  const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
    // Bir marta o'ynaydi: ekran video tugashi bilan yopiladi
    p.loop = false;
    p.muted = true;
    p.play();
  });

  usePlayOnce(player, onVideoEnd);

  useEffect(() => {
    // Apple logotipi kabi: sekin, bir tekis paydo bo'ladi va tinch turadi
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Asosiy yozuv — e'tibor markazi: sekin va yumshoq chiqadi
      Animated.timing(textOpacity, {
        toValue: 1,
        delay: 1600,
        duration: 1600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Nozik yuklanish: uchta nuqta navbat bilan yorishadi
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.25, duration: 420, useNativeDriver: true }),
          Animated.delay(480 - delay),
        ]),
      );

    const loop = Animated.parallel([pulse(dot1, 0), pulse(dot2, 160), pulse(dot3, 320)]);
    const delay = setTimeout(() => {
      Animated.timing(dotsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      loop.start();
    }, 3400);
    return () => {
      clearTimeout(delay);
      loop.stop();
    };
  }, [logoOpacity, logoScale, textOpacity, dot1, dot2, dot3, dotsOpacity]);


  // Yopilishda yumshoq fade — ilova "sakrab" o'tmasin
  useEffect(() => {
    if (visible) return;
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 420,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, screenOpacity]);

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]} pointerEvents="none">
      {/* Orqa fon videosi va uning ustidagi qorong'i parda */}
      <View style={styles.backdrop}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
        <Svg style={styles.backdrop} width="100%" height="100%">
          <Defs>
            <LinearGradient id="splashScrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.bg} stopOpacity="0.55" />
              <Stop offset="45%" stopColor={colors.bg} stopOpacity="0.34" />
              <Stop offset="100%" stopColor={colors.bg} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#splashScrim)" />
        </Svg>
      </View>

      <View style={styles.center}>
        <Animated.View
          style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: 'center' }}
        >
          <EcwtWordmark width={280} />
        </Animated.View>

        {/*
          Animatsiya QUTIGA qo'llanadi, matnga emas.

          NEGA: Android'da `Animated.Text` matn kengligini noto'g'ri
          o'lchaydi — uzun yozuvni bitta qatorga joylashtiradi va ekranga
          sig'magan qismi ("kompaniyasi") qirqilib qoladi. Oddiy `Text`
          esa to'g'ri o'lchab, matnni ikki qatorga bo'ladi.

          Bu xato brauzer preview'ida KO'RINMAYDI — faqat telefonda.
        */}
        <Animated.View
          style={{
            alignSelf: 'stretch',
            opacity: textOpacity,
            transform: [
              {
                translateY: textOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          {/*
            `numberOfLines={2}` + `adjustsFontSizeToFit`: matn qanday
            bo'lmasin QIRQILMASIN.

            Agar biror sabab bilan quti torayib qolsa, matn kesilmaydi —
            shrift kichrayadi va butun yozuv ko'rinadi. Bu "kompaniyasi"
            so'zi yo'qolib qolishining oldini oladigan oxirgi himoya.
          */}
          <Text
            style={styles.tagline}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {translate('welcome.tagline')}
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.dots, { opacity: dotsOpacity }]}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  /*
   * Hech qanday siljish YO'Q — `contentFit="cover"` videoni markazga
   * joylashtiradi va telefonda aynan shunday to'g'ri ko'rinadi.
   *
   * Eslatma: brauzerdagi preview'da siluet o'ngga siljigandek tuyuladi, lekin
   * bu brauzer oynasining nisbati (aspect ratio) tufayli — videoda emas.
   * Shuning uchun bu yerni preview'ga qarab sozlamang, telefonga qarang.
   */
  video: { width: '100%', height: '100%' },
  // alignSelf: 'stretch' bo'lmasa quti kontent kengligicha qisqarib, uzun
  // yozuv Android'da qirqilib qoladi
  center: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  tagline: {
    marginTop: spacing['2xl'],
    color: colors.text,
    fontFamily: UI_FONT_SEMIBOLD,
    fontSize: 19,
    lineHeight: 26,
    textAlign: 'center',
    /*
     * MUHIM (Android): `alignSelf: 'stretch'` bo'lmasa matn qutisi bitta
     * qator kengligicha o'lchanadi va ikkinchi qator ("kompaniyasi")
     * butunlay qirqilib qoladi. Brauzer preview'ida bu ko'rinmaydi —
     * faqat telefonda chiqadi.
     *
     * Xuddi shu sabab `center` konteynerida ham stretch qo'llangan.
     */
    alignSelf: 'stretch',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  dots: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
