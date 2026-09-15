import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { phoneSchema } from '@ecwt/validation';

import { Text } from '../../src/components/AppText';
import { Button } from '../../src/components/ui';
import { TextField } from '../../src/components/form';
import { StepNav } from '../../src/components/StepNav';
import { KeyboardAwareScroll } from '../../src/components/KeyboardAwareScroll';
import { api, EcwtApiError, tokenStorage } from '../../src/api/client';
import { useAuthStore } from '../../src/store/auth';
import { authenticate, getBiometricInfo } from '../../src/services/biometrics';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import { colors, layout, spacing, typography } from '../../src/theme';

/** Telefon raqamini ko'rinadigan ko'rinishga keltiradi: 90 123 45 67 */
function formatLocal(digits: string): string {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

/**
 * Hisobga kirish: parol yoki biometrika orqali.
 *
 * IKKI USUL — IKKI XIL NARSA:
 *
 *  1. Telefon + parol — SERVER autentifikatsiyasi. Istalgan qurilmada
 *     ishlaydi, chunki tekshiruv serverda bo'ladi.
 *
 *  2. Face ID / barmoq izi — QURILMADAGI saqlangan sessiyani ochadi.
 *     Serverga ulanmaydi, shuning uchun faqat shu telefonda avval kirgan
 *     bo'lsangiz ishlaydi. Saqlangan sessiya bo'lmasa tugma baribir
 *     ko'rsatiladi (imkoniyat borligi bilinsin), lekin bosilganda sababi
 *     tushuntiriladi.
 *
 * Paroli yo'q foydalanuvchi uchun pastda SMS orqali kirish yo'li turadi.
 */
export default function LoginScreen() {
  const t = useT();
  const router = useRouter();
  const applyAuth = useAuthStore((s) => s.applyAuth);
  const unlock = useAuthStore((s) => s.unlock);

  const [raw, setRaw] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  /**
   * Biometrika holati.
   *
   * `available` — qurilmada yuz/barmoq izi sozlanganmi.
   * `hasSession` — shu telefonda saqlangan hisob bormi.
   *
   * Tugma qurilma qo'llab-quvvatlasa HAR DOIM ko'rsatiladi: foydalanuvchi
   * bunday imkoniyat borligini bilishi kerak. Sessiya bo'lmasa — bosilganda
   * sababi tushuntiriladi, jimgina yo'q bo'lib ketmaydi.
   */
  const [bio, setBio] = useState<{ available: boolean; hasSession: boolean; label: string }>({
    available: false,
    hasSession: false,
    label: '',
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [info, refreshToken] = await Promise.all([
        getBiometricInfo(),
        Promise.resolve(tokenStorage.getRefreshToken()),
      ]);
      if (cancelled) return;
      setBio({
        available: info.available,
        hasSession: Boolean(refreshToken),
        label: info.label,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const digits = raw.replace(/\D/g, '').slice(0, 9);
  const canSubmit = digits.length === 9 && password.length > 0 && !loading;

  const submit = async () => {
    const parsed = phoneSchema.safeParse(`998${digits}`);
    if (!parsed.success) {
      setError(t('auth.phone.invalid'));
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const auth = await api.auth.login(parsed.data, password);
      await applyAuth(auth);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof EcwtApiError ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  /** Biometrika — qurilmadagi sessiyani ochadi, serverga so'rov ketmaydi */
  const loginWithBiometrics = async () => {
    /*
     * Biometrika serverda SHAXSNI tasdiqlamaydi — u faqat shu telefonda
     * saqlangan sessiyani ochadi. Sessiya bo'lmasa ochadigan narsa yo'q,
     * shuning uchun sababini ochiq aytamiz.
     */
    if (!bio.hasSession) {
      toastError(t('login.noSession'));
      return;
    }

    const result = await authenticate(t('login.title'), { fallbackToPasscode: true });
    if (!result.success) {
      if (!result.cancelled && result.message) toastError(result.message);
      return;
    }
    unlock();
    router.replace('/(tabs)');
  };

  return (
    <View style={layout.screenClear}>
      <StepNav onBack={() => router.replace('/(auth)/welcome')} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAwareScroll contentContainerStyle={styles.body} extraBottom={spacing['3xl']}>
          <Text style={[typography.display, { marginTop: spacing.xl }]}>{t('login.title')}</Text>

          <View style={{ height: spacing['2xl'] }} />

          <TextField
            testID="login-phone"
            label={t('auth.phone.label')}
            value={formatLocal(digits)}
            onChangeText={setRaw}
            placeholder="90 123 45 67"
            keyboardType="number-pad"
            prefix="+998"
            maxLength={12}
          />

          <View style={{ height: spacing.lg }} />

          <TextField
            testID="login-password"
            label={t('login.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            autoCapitalize="none"
            secureTextEntry
            error={error}
          />

          <View style={{ height: spacing.xl }} />
          <Button
            testID="login-submit"
            title={t('login.submit')}
            onPress={() => void submit()}
            disabled={!canSubmit}
            loading={loading}
          />

          {bio.available ? (
            <>
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={typography.caption}>{t('login.or')}</Text>
                <View style={styles.line} />
              </View>

              <Button
                title={t('login.biometric', { label: bio.label })}
                variant="secondary"
                icon="finger-print-outline"
                onPress={() => void loginWithBiometrics()}
              />
            </>
          ) : null}

          <Pressable
            onPress={() => router.replace('/(auth)/phone')}
            hitSlop={12}
            style={{ marginTop: spacing['2xl'], alignSelf: 'center' }}
            accessibilityRole="link"
          >
            <Text style={styles.link}>{t('login.forgot')}</Text>
          </Pressable>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[typography.caption, { flex: 1 }]}>{t('password.why')}</Text>
          </View>
        </KeyboardAwareScroll>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  link: { ...typography.small, color: colors.primary, textAlign: 'center' },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing['2xl'],
  },
});
