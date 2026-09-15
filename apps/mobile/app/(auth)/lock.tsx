import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/ui';
import { useAuthStore } from '../../src/store/auth';
import { authenticate, getBiometricInfo } from '../../src/services/biometrics';
import { colors, layout, radius, spacing, typography } from '../../src/theme';

/**
 * Qulf ekrani: biometrika yoqilgan foydalanuvchi uchun ilova ochilganda
 * chiqadi. Bu server autentifikatsiyasi emas — qurilmadagi mavjud sessiyani
 * himoya qiladi.
 */
export default function LockScreen() {
  const router = useRouter();
  const unlock = useAuthStore((s) => s.unlock);
  const logout = useAuthStore((s) => s.logout);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const user = useAuthStore((s) => s.user);

  const [label, setLabel] = useState('Biometrik kirish');
  const [status, setStatus] = useState<'idle' | 'checking' | 'failed'>('idle');
  const [message, setMessage] = useState<string>();
  const pulse = useRef(new Animated.Value(1)).current;

  const run = useCallback(async () => {
    setStatus('checking');
    setMessage(undefined);

    const info = await getBiometricInfo();
    setLabel(info.label);

    // Qurilmada biometrika o'chirilgan bo'lsa — qulfni olib tashlaymiz
    if (!info.available) {
      await setBiometricEnabled(false);
      unlock();
      return;
    }

    const result = await authenticate('ECWT ilovasiga kirish', { fallbackToPasscode: true });
    if (result.success) {
      unlock();
      return;
    }
    setStatus('failed');
    setMessage(result.cancelled ? undefined : result.message);
  }, [setBiometricEnabled, unlock]);

  useEffect(() => {
    const timer = setTimeout(() => void run(), 350);
    return () => clearTimeout(timer);
  }, [run]);

  useEffect(() => {
    if (status !== 'checking') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  const otherWay = () => {
    Alert.alert(
      'Boshqa usulda kirish',
      'Telefon raqamingiz va SMS kod orqali qaytadan kirasiz.',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Davom etish',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/phone');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={layout.screen}>
      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Text style={styles.markText}>E</Text>
          </View>
          <Text style={styles.wordmark}>ECWT</Text>
        </View>

        <View style={{ flex: 1 }} />

        <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulse }] }]}>
          <MaterialCommunityIcons
            name={label === 'Barmoq izi' ? 'fingerprint' : 'face-recognition'}
            size={72}
            color={status === 'failed' ? colors.danger : colors.primary}
          />
        </Animated.View>

        <Text style={[typography.h1, styles.title]}>
          {status === 'checking' ? `${label} kutilmoqda` : 'ECWT ilovasiga kirish'}
        </Text>
        <Text style={[typography.body, styles.subtitle]}>
          {user?.fullName ? `${user.fullName}, xush kelibsiz.` : 'Davom etish uchun shaxsingizni tasdiqlang.'}
        </Text>

        {message ? <Text style={styles.error}>{message}</Text> : null}

        <View style={{ flex: 1 }} />

        <Button
          title="Qayta urinib ko‘rish"
          onPress={run}
          loading={status === 'checking'}
          icon="scan-outline"
        />

        <Pressable onPress={otherWay} hitSlop={12} accessibilityRole="button" style={styles.other}>
          <Text style={[typography.bodyStrong, { color: colors.textSecondary }]}>
            Boshqa usulda kirish
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  mark: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  markText: { color: colors.textInverse, fontWeight: '800', fontSize: 18 },
  wordmark: { color: colors.text, fontWeight: '700', fontSize: 20, letterSpacing: 2 },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { textAlign: 'center' },
  error: { color: colors.danger, textAlign: 'center', marginTop: spacing.lg, fontSize: 15 },
  other: { marginTop: spacing.xl, paddingVertical: spacing.md },
});
