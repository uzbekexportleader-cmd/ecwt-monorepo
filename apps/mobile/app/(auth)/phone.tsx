import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepNav } from '../../src/components/StepNav';
import { phoneSchema } from '@ecwt/validation';

import { api, EcwtApiError } from '../../src/api/client';
import { Button } from '../../src/components/ui';
import { TextField } from '../../src/components/form';
import { colors, layout, radius, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';
import { track } from '../../src/services/analytics';

/** 901234567 → 90 123 45 67 */
function formatLocal(digits: string): string {
  const d = digits.slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

export default function PhoneScreen() {
  const t = useT();
  const router = useRouter();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const digits = raw.replace(/\D/g, '');
  const canSubmit = digits.length === 9;

  const submit = async () => {
    setError(undefined);
    const parsed = phoneSchema.safeParse(`998${digits}`);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('auth.phone.invalid'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.requestOtp(parsed.data);
      track('auth.otp.requested');
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: parsed.data, masked: res.phone, devCode: res.devCode ?? '' },
      });
    } catch (e) {
      setError(e instanceof EcwtApiError ? e.message : t('auth.phone.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={layout.screenClear}>
      <StepNav
        onBack={() => router.replace('/(auth)/welcome')}
        onNext={canSubmit && !loading ? submit : undefined}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, padding: spacing.xl }}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>E</Text>
          </View>
          <Text style={styles.logoText}>ECWT</Text>
        </View>

        <Text style={[typography.display, { marginTop: spacing['3xl'] }]}>{t('auth.phone.title')}</Text>
        <Text style={[typography.body, { marginTop: spacing.sm, marginBottom: spacing['2xl'] }]}>
          {t('auth.phone.subtitle')}
        </Text>

        <TextField
          testID="phone-input"
          label={t('auth.phone.label')}
          value={formatLocal(digits)}
          onChangeText={(v) => setRaw(v)}
          placeholder="90 123 45 67"
          keyboardType="number-pad"
          // Tizimga aniq aytamiz: bu telefon raqami. Busiz Android bu yerga
          // oxirgi SMS kodini taklif qilib turadi.
          autoComplete="tel"
          textContentType="telephoneNumber"
          prefix="+998"
          maxLength={12}
          error={error}
        />

        <View style={{ height: spacing.xl }} />
        <Button
          testID="phone-submit"
          title={t('auth.phone.send')}
          onPress={submit}
          disabled={!canSubmit}
          loading={loading}
        />

        <View style={{ flex: 1 }} />

        <View style={[layout.row, { gap: spacing.sm, marginBottom: spacing.lg }]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
          <Text style={[typography.caption, { flex: 1 }]}>
            {t('auth.phone.privacy')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoMarkText: { color: colors.textInverse, fontWeight: '800', fontSize: 20 },
  logoText: { color: colors.text, fontWeight: '700', fontSize: 22, letterSpacing: 2 },
});
