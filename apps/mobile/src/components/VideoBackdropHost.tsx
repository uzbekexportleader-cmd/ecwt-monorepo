import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useVideoPlayer, VideoView } from 'expo-video';

import { colors } from '../theme';
import { useLoopingPlayback } from '../hooks/useLoopingPlayback';

/** Ro'yxatdan o'tish ekranlarining umumiy orqa fon videosi */
import AUTH_VIDEO from '../../assets/video/auth-bg.mp4';

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
  /*
   * Video BARCHA ekranlarda, ISTISNOSIZ ko'rinadi — ilova boshidan
   * oxirigacha bitta yaxlit muhitda bo'lishi kerak.
   *
   * Ilgari Face ID beti chetlab o'tilardi (old kamera ochilganda ikkita
   * harakatlanuvchi tasvir bir-biriga xalaqit qiladi degan o'ydan). Amalda
   * o'sha bet qop-qora chiqdi va boshqa ilovaga tushgandek tuyuldi. Kamera
   * oynasi ochilganda videoni o'zi yopadi — alohida istisno kerak emas.
   */
  const visible = true;

  // Splash ortida ham yuklanadi — o'tish payti ekran bo'sh qolmasin
  const active = visible || preload;

  const player = useVideoPlayer(AUTH_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Ko'rinmayotganda (masalan asosiy ilovada) video behuda o'ynamasin.
  // Pauza faylni tushirmaydi — qaytganda o'sha joyidan davom etadi.
  useLoopingPlayback(player, active);

  if (!active) return null;

  return (
    <View style={styles.fill} pointerEvents="none">
      <VideoView style={styles.video} player={player} contentFit="cover" nativeControls={false} />

      {/*
        YAGONA parda — hamma ekranda bir xil.

        Ilgari ikkita parda bor edi: yengili doim turardi, ustiga forma
        ekranlarida ikkinchisi qo'shilardi. Natijada "Hush kelibsiz"
        betida video ochiq ko'rinar, qolgan betlarda esa xira bo'lib
        qolardi — ayniqsa tepasi.

        Endi bitta parda: qaysi ekran bo'lmasin, fon aynan bir xil.
        Yozuvlar o'qilishi pardaga emas, matnning o'z soyasiga
        tayanadi (`typography` ichida).
      */}
      <Scrim id="scrimSoft" top="0.05" mid="0.1" bottom="0.58" />
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
