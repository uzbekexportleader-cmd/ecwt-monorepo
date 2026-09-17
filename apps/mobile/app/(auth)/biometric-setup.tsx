import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepNav } from '../../src/components/StepNav';
import { useT } from '../../src/i18n';

import { Button, InfoBanner } from '../../src/components/ui';
import { useAuthStore } from '../../src/store/auth';
import { authenticate, getBiometricInfo, type BiometricInfo } from '../../src/services/biometrics';
import { colors, layout, spacing, typography } from '../../src/theme';
import { toastError } from '../../src/store/toast';

type Phase = 'intro' | 'unavailable' | 'success';

export default function BiometricSetupScreen() {
  const t = useT();
  const router = useRouter();
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);

  const [info, setInfo] = useState<BiometricInfo | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [busy, setBusy] = useState(false);

  const iconScale = useRef(new Animated.Value(0.9)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    void (async () => {
      const result = await getBiometricInfo();
      setInfo(result);
      if (!result.available) setPhase('unavailable');
    })();

    Animated.parallel([
      Animated.timing(iconOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [iconOpacity, iconScale]);

  useEffect(() => {
    if (phase !== 'success') return;
    checkScale.setValue(0.4);
    Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [phase, checkScale]);

  const label = info?.label ?? t('bio.title');

  /**
   * Biometrika yoqilgan bo'lsa — to'g'ridan-to'g'ri anketaga.
   *
   * Aks holda avval parol so'raladi: usiz keyingi kirishlarda yagona yo'l
   * SMS bo'lib qoladi, har biri esa pul turadi.
   */
  const goNext = () => router.replace('/(setup)');
  const goAfterSkip = () => router.replace('/(auth)/password-setup');

  const enable = async () => {
    if (!info) return;
    setBusy(true);
    try {
      const fresh = await getBiometricInfo();
      setInfo(fresh);

      if (!fresh.hasHardware) {
        setPhase('unavailable');
        return;
      }
      if (!fresh.isEnrolled) {
        setPhase('unavailable');
        return;
      }

      const result = await authenticate(`ECWT ilovasiga kirish`);
      if (result.success) {
        await setBiometricEnabled(true);
        setPhase('success');
        return;
      }
      if (!result.cancelled && result.message) toastError(result.message);
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------ muvaffaqiyat ---------------------------- */

  if (phase === 'success') {
    return (
      <SafeAreaView style={layout.screenClear}>
      <StepNav
        onBack={() => router.replace('/(auth)/face-id')}
        onNext={goNext}
      />
        <View style={styles.container}>
          <View style={{ flex: 1 }} />
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={64} color={colors.textInverse} />
          </Animated.View>

          <Text style={[typography.display, styles.title]}>{label} tayyor</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Endi ECWT ilovasiga tez va xavfsiz kirishingiz mumkin.
          </Text>

          <View style={{ flex: 1 }} />
          <Button title={t('common.continue')} onPress={goNext} />
        </View>
      </SafeAreaView>
    );
  }

  /* ------------------------------ mavjud emas ----------------------------- */

  if (phase === 'unavailable') {
    const reason = !info?.hasHardware
      ? t('bio.noHardware')
      : t('bio.notEnrolled');

    return (
      <SafeAreaView style={layout.screenClear}>
      <StepNav
        onBack={() => router.replace('/(auth)/face-id')}
        onNext={goAfterSkip}
      />
        <View style={styles.container}>
          <View style={{ flex: 1 }} />
          <View style={[styles.iconCircle, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="shield-off-outline" size={64} color={colors.textMuted} />
          </View>

          <Text style={[typography.display, styles.title]}>{t('bio.unavailable')}</Text>
          <Text style={[typography.body, styles.subtitle]}>{reason}</Text>

          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <InfoBanner
              text="Xavotir olmang — ilovadan telefon raqamingiz orqali bemalol foydalanaverasiz."
              tone="info"
            />
          </View>

          <View style={{ flex: 1 }} />
          <Button title={t('common.continue')} onPress={goAfterSkip} />
        </View>
      </SafeAreaView>
    );
  }

  /* --------------------------------- taklif -------------------------------- */

  return (
    <SafeAreaView style={layout.screenClear}>
      <StepNav
        onBack={() => router.replace('/(auth)/face-id')}
        onNext={goAfterSkip}
      />
      <View style={styles.container}>
        <View style={{ flex: 1 }} />

        <Animated.View
          style={[
            styles.iconCircle,
            { opacity: iconOpacity, transform: [{ scale: iconScale }], borderColor: colors.primary },
          ]}
        >
          <MaterialCommunityIcons
            name={info?.kind === 'fingerprint' ? 'fingerprint' : 'face-recognition'}
            size={76}
            color={colors.primary}
          />
        </Animated.View>

        <Text style={[typography.display, styles.title]}>{label} bilan tezroq kiring</Text>
        <Text style={[typography.body, styles.subtitle]}>
          Keyingi safar ECWT ilovasiga parol yoki SMS kod kiritmasdan xavfsiz kirishingiz mumkin.
        </Text>

        <View style={[styles.note, layout.row]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
          <Text style={[typography.caption, { flex: 1, marginLeft: spacing.sm }]}>
            Yuzingiz yoki barmoq izingiz telefoningizdan chiqmaydi — ECWT serveriga yuborilmaydi.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Button title={t('bio.setUp', { label })} onPress={enable} loading={busy} />

        <Pressable onPress={goAfterSkip} hitSlop={12} accessibilityRole="button" style={styles.later}>
          <Text style={[typography.bodyStrong, { color: colors.textSecondary }]}>Keyinroq</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center' },
  iconCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  checkCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  title: { textAlign: 'center', marginBottom: spacing.md },
  subtitle: { textAlign: 'center' },
  note: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
  },
  later: { marginTop: spacing.xl, paddingVertical: spacing.md, alignSelf: 'center' },
});
