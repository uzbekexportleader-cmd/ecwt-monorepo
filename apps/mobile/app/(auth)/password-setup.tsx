import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { passwordSchema } from '@ecwt/validation';

import { Text } from '../../src/components/AppText';
import { StepNav } from '../../src/components/StepNav';
import { api, EcwtApiError } from '../../src/api/client';
import { Button, InfoBanner } from '../../src/components/ui';
import { TextField } from '../../src/components/form';
import { toastError, toastSuccess } from '../../src/store/toast';
import { colors, layout, radius, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

/**
 * Parol o'rnatish — ro'yxatdan o'tishning oxirgi qadami.
 *
 * NEGA KERAK: har kirishda SMS yuborish HAQIQIY PUL (bitta xabar
 * 95–170 so'm). Foydalanuvchi ilovaga kuniga bir necha marta kiradi.
 * Parol yoki biometrika o'rnatilsa, SMS faqat BIR MARTA — ro'yxatdan
 * o'tishda — yuboriladi.
 *
 * Bu ekran biometrika yoqilmagan holatda ko'rsatiladi: barmoq izi bor
 * telefonda parolning hojati yo'q, lekin usiz yagona yo'l SMS bo'lib
 * qoladi.
 *
 * "Keyinroq" tugmasi bor — majburlamaymiz. Lekin sababi ochiq yoziladi,
 * shunda odam keyin "nega yana SMS?" deb hayron bo'lmaydi.
 */
export default function PasswordSetupScreen() {
  const t = useT();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const goNext = () => router.replace('/(setup)');

  /*
   * Parol allaqachon bor bo'lsa, bu ekranni umuman ko'rsatmaymiz.
   *
   * Aks holda qayta kirgan foydalanuvchidan har safar parol so'ralardi
   * — u esa allaqachon qo'ygan va shu parol bilan kirgan bo'lardi.
   */
  useEffect(() => {
    let cancelled = false;
    void api.auth
      .hasPassword()
      .then((r) => {
        if (!cancelled && r.hasPassword) goNext();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    if (password !== repeat) {
      setError(t('password.mismatch'));
      return;
    }

    setBusy(true);
    try {
      /*
       * `currentPassword` berilmaydi: bu yerda parol BIRINCHI marta
       * qo'yiladi. Agar allaqachon bor bo'lsa server rad etadi — va
       * to'g'ri qiladi, chunki eskisini bilmasdan almashtirib bo'lmaydi.
       */
      await api.auth.setPassword({ newPassword: password });
      toastSuccess(t('password.saved'));
      goNext();
    } catch (e) {
      const message = e instanceof EcwtApiError ? e.message : t('common.error');
      setError(message);
      toastError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={layout.screenClear}>
      <StepNav onBack={() => router.replace('/(auth)/biometric-setup')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, padding: spacing.xl }}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="key-outline" size={30} color={colors.primary} />
        </View>

        <Text style={[typography.display, { marginTop: spacing.xl }]}>
          {t('password.setupTitle')}
        </Text>
        <Text style={[typography.body, { marginTop: spacing.sm }]}>
          {t('password.setupWhy')}
        </Text>

        <View style={{ height: spacing.xl }} />

        <TextField
          label={t('password.new')}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(undefined);
          }}
          secureTextEntry
          autoCapitalize="none"
          error={error}
        />
        <View style={{ height: spacing.lg }} />
        <TextField
          label={t('password.repeat')}
          value={repeat}
          onChangeText={setRepeat}
          secureTextEntry
          autoCapitalize="none"
        />

        <View style={{ height: spacing.xl }} />
        <Button
          title={t('common.save')}
          icon="checkmark-outline"
          onPress={() => void save()}
          loading={busy}
          disabled={!password || !repeat}
        />
        <View style={{ height: spacing.md }} />
        <Button title={t('password.later')} variant="ghost" onPress={goNext} />

        <View style={{ flex: 1 }} />
        <InfoBanner text={t('password.smsCost')} tone="info" icon="information-circle-outline" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
