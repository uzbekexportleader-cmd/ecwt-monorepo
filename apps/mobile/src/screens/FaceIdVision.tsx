import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  type Camera as VisionCamera,
} from 'react-native-vision-camera';
import {
  useFaceDetector,
  type Face,
  type FrameFaceDetectionOptions,
} from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../components/AppText';
import { Button, InfoBanner } from '../components/ui';
import { StepNav } from '../components/StepNav';
import { FaceOval, RING_READY, RING_WAITING } from '../components/FaceOval';
import { checkFaces, type FaceCheck, type FaceSample } from '../services/faceCheck';
import { uploadSelfie } from '../services/faceUpload';
import { toastError, toastSuccess } from '../store/toast';
import { EcwtApiError, RESET_ONBOARDING_ON_START } from '../api/client';
import { colors, layout, radius, spacing, typography } from '../theme';
import { useT } from '../i18n';

type Phase = 'aim' | 'holding' | 'sending' | 'done';

/** Kamera xatosini yuklash xatosidan ajratish uchun */
class CaptureError extends Error {
  constructor(
    message: string,
    readonly cause: unknown,
  ) {
    super(message);
    this.name = 'CaptureError';
  }
}

/**
 * ML Kit sozlamalari. Modul darajasida turadi — har render'da yangi obyekt
 * yaratilsa, aniqlagich qayta-qayta qurilib, kadrlar sekinlashardi.
 */
const DETECTION_OPTIONS: FrameFaceDetectionOptions = {
  performanceMode: 'fast',
  // Ko'z ochiqligini bilish uchun kerak
  classificationMode: 'all',
  landmarkMode: 'none',
  contourMode: 'none',
  trackingEnabled: false,
};

/** Yuz shuncha vaqt to'g'ri turgach surat olinadi */
const HOLD_MS = 1200;

/**
 * Yuz tekshiruvi — ML Kit bilan.
 *
 * Kameraning har bir kadri Google ML Kit orqali o'tadi: yuz bormi, qayerda,
 * qanchalik katta, bosh qaysi tomonga burilgan, ko'zi ochiqmi. Shu ma'lumot
 * `checkFaces` qoidalariga beriladi va ramka rangi o'zgaradi:
 * qizil — hali tayyor emas, yashil — yuz joyida.
 *
 * Yuz ketma-ket {@link HOLD_MS} davomida to'g'ri tursa, surat o'zi olinadi —
 * foydalanuvchi tugma qidirib yurmaydi.
 *
 * MUHIM: bu ekran faqat ilovaning o'z versiyasida ishlaydi. Expo Go ichida
 * ML Kit yo'q, o'sha yerda `expo-camera` li oddiy versiya ochiladi.
 */
export default function FaceIdVisionScreen() {
  const t = useT();
  const router = useRouter();
  const camera = useRef<VisionCamera>(null);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [phase, setPhase] = useState<Phase>('aim');
  /** Surat manzili — xato bilan bitta joyga tushib, uni bosib qolmasin */
  const [check, setCheck] = useState<FaceCheck>({
    ready: false,
    hint: 'Yuzingizni oval ichiga joylashtiring',
  });

  /** Yuz uzluksiz to'g'ri turgan vaqt boshlangan payt */
  const steadySince = useRef<number | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          // SVG xossalari native driver bilan ishlamaydi
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringWidth = pulse.interpolate({ inputRange: [0, 1], outputRange: [3, 6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  const goNext = () => router.replace('/(auth)/biometric-setup');

  /* ------------------------------ suratga olish ---------------------------- */

  const capture = useCallback(async () => {
    if (!camera.current) return;
    setPhase('sending');
    try {
      /*
       * Surat olish va uni yuborish ALOHIDA tekshiriladi.
       *
       * Ilgari ikkalasi bitta `catch` da edi va kamera xatosi ham
       * "Internetni tekshiring" degan xabar berardi — aybsiz tarmoq
       * ayblanib, haqiqiy sabab yashirin qolardi.
       */
      let photo;
      try {
        photo = await camera.current.takePhoto({ flash: 'off' });
      } catch (cameraError) {
        throw new CaptureError(t('face.cameraFailed'), cameraError);
      }
      const uri = `file://${photo.path}`;
      if (__DEV__) console.log(`[FaceID] surat manzili: ${uri}`);
      await uploadSelfie(uri);
      setPhase('done');
      toastSuccess(t('face.uploadOk'));
    } catch (e) {
      steadySince.current = null;
      setPhase('aim');
      /*
       * Sinov rejimida xatoning asl matni ko'rsatiladi. Umumlashtirilgan
       * xabar ("internetni tekshiring") haqiqiy sababni yashirib, xatoni
       * qidirishni qiyinlashtiradi.
       */
      if (RESET_ONBOARDING_ON_START) {
        const cause = e instanceof CaptureError ? e.cause : e;
        const name = cause instanceof Error ? cause.name : typeof cause;
        const text = cause instanceof Error ? cause.message : String(cause);
        // EcwtApiError.details ichida asl tarmoq xatosi (agar bo'lsa) turadi
        const details =
          cause instanceof EcwtApiError && cause.details instanceof Error
            ? ` <- [${cause.details.name}] ${cause.details.message}`
            : '';
        console.log(`[FaceID] XATO [${name}] ${text}${details}`);
      }
      toastError(
        e instanceof CaptureError || e instanceof EcwtApiError
          ? e.message
          : t('face.uploadFailed'),
      );
    }
  }, [t]);

  /* --------------------------- kadrlarni tekshirish ------------------------ */

  const onFaces = useCallback(
    (faces: Face[], frameWidth: number, frameHeight: number) => {
      if (phase === 'sending' || phase === 'done') return;

      const samples: FaceSample[] = faces.map((f) => ({
        bounds: f.bounds,
        frameWidth,
        frameHeight,
        yawAngle: f.yawAngle,
        pitchAngle: f.pitchAngle,
        rollAngle: f.rollAngle,
        leftEyeOpenProbability: f.leftEyeOpenProbability,
        rightEyeOpenProbability: f.rightEyeOpenProbability,
      }));

      const result = checkFaces(samples);
      setCheck(result);

      /*
       * O'lchovlar faqat LOGGA yoziladi (Metro terminalida ko'rinadi).
       *
       * Ilgari ular ekranda chiqardi — sozlash oson bo'lsin uchun. Lekin
       * foydalanuvchi uchun bu tushunarsiz texnik matn bo'lib, ekranni
       * ifloslantiradi va ilovani tugallanmagandek ko'rsatadi.
       */
      if (RESET_ONBOARDING_ON_START) {
        const f = samples[0];
        console.log(
          '[FaceID]',
          f
            ? `kadr ${frameWidth}x${frameHeight} · yuz ${Math.round(f.bounds.width)}x${Math.round(f.bounds.height)} · ulush ${(f.bounds.width / frameWidth).toFixed(2)} · markaz ${((f.bounds.x + f.bounds.width / 2) / frameWidth).toFixed(2)},${((f.bounds.y + f.bounds.height / 2) / frameHeight).toFixed(2)} · burchak ${Math.round(f.yawAngle)}/${Math.round(f.pitchAngle)}/${Math.round(f.rollAngle)}`
            : `kadr ${frameWidth}x${frameHeight} · yuz topilmadi`,
        );
      }

      if (!result.ready) {
        steadySince.current = null;
        setPhase('aim');
        return;
      }

      // Yuz to'g'ri turibdi — qancha vaqtdan beri turganini sanaymiz
      const now = Date.now();
      if (steadySince.current === null) {
        steadySince.current = now;
        setPhase('holding');
        return;
      }
      if (now - steadySince.current >= HOLD_MS) {
        steadySince.current = null;
        void capture();
      }
    },
    [phase, capture],
  );

  /*
   * Kadr qayta ishlagich.
   *
   * Kadrlar alohida oqimda (worklet) keladi va u yerdan React holatiga
   * to'g'ridan-to'g'ri murojaat qilib bo'lmaydi — shuning uchun natija
   * `createRunOnJS` orqali asosiy oqimga uzatiladi.
   *
   * `Frame` obyektining o'zi uzatilmaydi: kadr worklet tugashi bilan
   * bo'shatiladi va JS tomonda o'qilsa ilova yiqiladi. Faqat kerakli ikki
   * son — kengligi va balandligi — nusxalab yuboriladi.
   */
  const onFacesRef = useRef(onFaces);
  onFacesRef.current = onFaces;

  const emitFaces = React.useMemo(
    () =>
      Worklets.createRunOnJS(
        (faces: Face[], width: number, height: number) => {
          onFacesRef.current(faces, width, height);
        },
      ),
    [],
  );

  const { detectFaces } = useFaceDetector(DETECTION_OPTIONS);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const faces = detectFaces(frame);
      /*
       * Kamera buferi yotiq keladi (masalan 1600x1200), ML Kit esa yuz
       * chegaralarini TIK holatga keltirilgan tasvirga nisbatan beradi
       * (1200x1600). Shu sababli bufer o'lchamini to'g'ridan-to'g'ri
       * ishlatib bo'lmaydi — yuz kadrning kichikroq ulushini egallagandek
       * ko'rinib, "uzoqroqsiz" degan noto'g'ri xulosa chiqardi.
       *
       * Ilova faqat tik holatda ishlaydi (app.json: orientation portrait),
       * shuning uchun kichik tomon — eni, katta tomon — bo'yi.
       */
      const w = Math.min(frame.width, frame.height);
      const h = Math.max(frame.width, frame.height);
      emitFaces(faces, w, h);
    },
    [detectFaces, emitFaces],
  );

  /* -------------------------------- ruxsat -------------------------------- */

  if (!hasPermission) {
    return (
      <SafeAreaView style={layout.screen}>
        <StepNav
          onBack={() => router.replace('/(auth)/phone')}
          onNext={goNext}
        />
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={colors.primary} />
          <Text style={[typography.h1, styles.center, { marginTop: spacing.xl }]}>
            {t('face.permTitle')}
          </Text>
          <Text style={[typography.body, styles.center, { marginTop: spacing.sm }]}>
            {t('face.permText')}
          </Text>
          <View style={{ height: spacing['2xl'] }} />
          <Button title={t('face.permGrant')} onPress={() => void requestPermission()} />
          <Pressable onPress={goNext} style={styles.skip}>
            <Text style={styles.skipText}>{t('face.later')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ------------------------------- tugadi -------------------------------- */

  if (phase === 'done') {
    return (
      <SafeAreaView style={layout.screen}>
        <StepNav onBack={() => router.replace('/(auth)/phone')} onNext={goNext} />
        <View style={styles.centered}>
          <View style={styles.doneMark}>
            <Ionicons name="checkmark" size={48} color="#06301A" />
          </View>
          <Text style={[typography.h1, styles.center, { marginTop: spacing.xl }]}>
            {t('face.doneTitle')}
          </Text>
          <Text style={[typography.body, styles.center, { marginTop: spacing.sm }]}>
            {t('face.doneText')}
          </Text>

          <View style={{ height: spacing.xl }} />
          <InfoBanner
            text={t('face.manualReview')}
            tone="warning"
            icon="construct-outline"
          />

          <View style={{ height: spacing['2xl'] }} />
          <Button title={t('common.continue')} onPress={goNext} />
        </View>
      </SafeAreaView>
    );
  }

  /* ------------------------------- kamera -------------------------------- */

  if (!device) {
    return (
      <SafeAreaView style={layout.screen}>
        <StepNav
          onBack={() => router.replace('/(auth)/phone')}
          onNext={goNext}
        />
        <View style={styles.centered}>
          <Text style={[typography.h2, styles.center]}>{t('face.noCamera')}</Text>
          <View style={{ height: spacing.xl }} />
          <Button title={t('onboarding.skip')} onPress={goNext} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={layout.screen}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        /*
         * Surat yuborilayotganda ham kamera YOQIQ turishi shart.
         *
         * Ilgari bu yerda faqat 'aim' va 'holding' bosqichlari sanalgan edi.
         * Natijada `capture()` birinchi ish sifatida bosqichni 'sending' ga
         * o'zgartirishi bilan kamera seansi yopilar, keyin chaqirilgan
         * `takePhoto()` esa allaqachon yopilgan kameraga murojaat qilib
         * xato berardi — ekran yashil holatda muzlab qolardi.
         *
         * 'done' bosqichida bu ekran umuman chizilmaydi (yuqoridagi alohida
         * shohobchaga qarang), shuning uchun bu yerda kamera doim yoqiq.
         */
        isActive
        photo
        frameProcessor={frameProcessor}
      />

      <FaceOval
        color={check.ready ? RING_READY : RING_WAITING}
        strokeWidth={ringWidth}
        strokeOpacity={ringOpacity}
      />

      <SafeAreaView style={styles.overlay}>
        <StepNav
          onBack={() => router.replace('/(auth)/phone')}
          onNext={goNext}
        />

        <View style={styles.captionBox}>
          <Text style={[typography.h2, styles.center, styles.title]}>
            {phase === 'sending' ? t('face.sending') : check.hint}
          </Text>
          <Text style={[typography.small, styles.center, styles.hint]}>
            {check.ready ? t('face.readyHint') : t('face.aimHint')}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.actions}>
          <Pressable onPress={goNext} style={styles.skip}>
            <Text style={styles.skipText}>{t('face.later')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  center: { textAlign: 'center' },
  captionBox: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(5, 11, 26, 0.72)',
  },
  title: { paddingHorizontal: spacing.lg },
  hint: { marginTop: spacing.xs, paddingHorizontal: spacing.lg },
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  skip: { alignSelf: 'center', paddingVertical: spacing.md },
  skipText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  doneMark: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#5FD98A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
