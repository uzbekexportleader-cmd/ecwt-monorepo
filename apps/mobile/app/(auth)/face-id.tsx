import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EcwtApiError } from '../../src/api/client';
import { Button, InfoBanner } from '../../src/components/ui';
import { StepNav } from '../../src/components/StepNav';
import { FaceOval, RING_READY, RING_WAITING } from '../../src/components/FaceOval';
import { uploadSelfie } from '../../src/services/faceUpload';
import { isFaceDetectorAvailable } from '../../src/services/faceDetector';
import { useT } from '../../src/i18n';
import { toastError, toastSuccess } from '../../src/store/toast';
import { colors, layout, radius, spacing, typography } from '../../src/theme';

type Phase = 'aim' | 'ready' | 'sending' | 'done';

/** "Qimirlamang" hisobi, soniya */
const COUNTDOWN_SEC = 3;

/**
 * Yuz tekshiruvi (biometrik identifikatsiya).
 *
 * MUHIM — bu telefonning Face ID qulfi EMAS. Bu yerda foydalanuvchi yuzini
 * oval ramkaga joylashtiradi, surat olinadi va serverga yuboriladi.
 *
 * Suratni pasport bazasidagi rasm bilan solishtirish va tiriklik (liveness)
 * tekshiruvini MyID kabi biometrik provayder bajaradi. Bunday xizmat hali
 * ulanmagan — shu sababli ilova hech qachon "tasdiqlandi" demaydi: surat
 * saqlanadi va moderator qo'lda tekshiradi. Buni ekranning o'zida ochiq
 * yozib qo'yamiz.
 */
/**
 * ML Kit mavjud bo'lsa (ilovaning o'z versiyasi) — yuz avtomatik aniqlanadigan
 * ekran ochiladi. Expo Go da esa quyidagi oddiy versiya ishlaydi.
 *
 * Modul faqat kerak bo'lganda yuklanadi: Expo Go da uni yuklash xatoga
 * olib keladi, chunki native qismi yo'q.
 */
const VisionScreen: React.ComponentType | null = isFaceDetectorAvailable()
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('../../src/screens/FaceIdVision').default as React.ComponentType)
  : null;

export default function FaceIdScreen() {
  if (VisionScreen) return <VisionScreen />;
  return <FaceIdSimpleScreen />;
}

/** Expo Go uchun: yuz qo'lda suratga olinadi */
function FaceIdSimpleScreen() {
  const t = useT();
  const router = useRouter();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('aim');
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);

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
  const ringColor = phase === 'aim' ? RING_WAITING : RING_READY;

  const goNext = () => router.replace('/(auth)/biometric-setup');

  // "Qimirlamang" hisobi tugagach surat olinadi
  useEffect(() => {
    if (phase !== 'ready') return;
    if (countdown <= 0) {
      void capture();
      return;
    }
    const timer = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, countdown]);

  const startCapture = () => {
    setCountdown(COUNTDOWN_SEC);
    setPhase('ready');
  };

  /* ------------------------------ suratga olish ----------------------------- */

  const capture = async () => {
    if (!camera.current || phase === 'sending') return;
    setPhase('sending');
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (!shot?.uri) throw new Error('Surat olinmadi');

      await uploadSelfie(shot.uri);

      setPhase('done');
      toastSuccess(t('face.uploadOk'));
    } catch (e) {
      setPhase('aim');
      setCountdown(COUNTDOWN_SEC);
      toastError(
        e instanceof EcwtApiError ? e.message : t('face.uploadFailed'),
      );
    }
  };

  /* -------------------------------- ruxsat -------------------------------- */

  if (!permission) {
    return (
      <SafeAreaView style={layout.screenClear}>
        <StepNav onBack={() => router.replace('/(auth)/phone')} onNext={phase === 'done' ? goNext : undefined} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={layout.screenClear}>
        <StepNav onBack={() => router.replace('/(auth)/phone')} onNext={phase === 'done' ? goNext : undefined} />
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

          {/*
            Brauzer versiyasida kamerasiz qurilmadan chiqish yo'li.

            Telefonda selfi MAJBURIY bo'lib qoladi — bu shart ataylab
            qo'yilgan va o'zgarmaydi. Lekin saytga ish stoli kompyuteridan
            kirgan odam (kamerasi yo'q yoki brauzer ruxsat bermagan)
            butunlay to'xtab qolardi: na oldinga, na orqaga. Ya'ni sayt
            orqali ro'yxatdan o'tishning imkoni yo'q edi.
          */}
          {Platform.OS === 'web' ? (
            <>
              <View style={{ height: spacing.lg }} />
              <Button title={t('face.skipOnWeb')} variant="ghost" onPress={goNext} />
            </>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  /* ------------------------------- tugadi -------------------------------- */

  if (phase === 'done') {
    return (
      <SafeAreaView style={layout.screenClear}>
        <StepNav onBack={() => router.replace('/(auth)/phone')} onNext={phase === 'done' ? goNext : undefined} />
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

  return (
    <View style={layout.screen}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" />

      <FaceOval color={ringColor} strokeWidth={ringWidth} strokeOpacity={ringOpacity} />

      <SafeAreaView style={styles.overlay}>
        <StepNav onBack={() => router.replace('/(auth)/phone')} onNext={undefined} />

        <View style={styles.captionBox}>
        <Text style={[typography.h2, styles.center, styles.title]}>
          {phase === 'aim'
            ? t('face.aimTitle')
            : phase === 'ready'
              ? t('face.hold', { sec: countdown })
              : t('face.sending')}
        </Text>
        <Text style={[typography.small, styles.center, styles.hint]}>
          {phase === 'aim' ? t('face.aimHint') : t('face.capturingHint')}
        </Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.actions}>
          <Button
            title={
              phase === 'sending'
                ? t('face.sending')
                : phase === 'ready'
                  ? t('face.hold', { sec: countdown })
                  : t('face.capture')
            }
            onPress={startCapture}
            disabled={phase !== 'aim'}
            loading={phase === 'sending'}
          />
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
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
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
