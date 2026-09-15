import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { Text, TextInput } from '../../src/components/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepNav } from '../../src/components/StepNav';
import { OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '@ecwt/config';

import { api, EcwtApiError } from '../../src/api/client';
import { Button, InfoBanner } from '../../src/components/ui';
import { useAuthStore } from '../../src/store/auth';
import { track } from '../../src/services/analytics';
import { colors, layout, radius, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function OtpScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; masked?: string; devCode?: string }>();
  const applyAuth = useAuthStore((s) => s.applyAuth);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [seconds, setSeconds] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Android'da ekran ochilishi bilan klaviatura chiqishi uchun kichik kechikish kerak
  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus(), 500);
    return () => clearTimeout(timeout);
  }, []);

  const verify = async (value: string) => {
    if (value.length !== OTP_LENGTH || loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(undefined);
    try {
      const auth = await api.auth.verifyOtp(params.phone, value);
      await applyAuth(auth);
      track('auth.otp.verified');
      // OTP dan keyin biometrik sozlash taklif qilinadi
      router.replace('/(auth)/face-id');
    } catch (e) {
      setCode('');
      setError(e instanceof EcwtApiError ? e.message : t('auth.otp.verifyFailed'));
      setTimeout(() => inputRef.current?.focus(), 200);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
    setError(undefined);
    if (digits.length === OTP_LENGTH) void verify(digits);
  };

  const resend = async () => {
    setError(undefined);
    setCode('');
    try {
      const res = await api.auth.requestOtp(params.phone);
      setSeconds(OTP_RESEND_COOLDOWN_SECONDS);
      if (res.devCode) {
        router.setParams({ devCode: res.devCode });
      }
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof EcwtApiError ? e.message : t('auth.otp.resendFailed'));
    }
  };

  return (
    <SafeAreaView style={layout.screenClear}>
      <StepNav
        onBack={() => router.replace('/(auth)/phone')}
        onNext={code.length === OTP_LENGTH ? () => void verify(code) : undefined}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, padding: spacing.xl }}
      >
        <Text style={[typography.display, { marginTop: spacing['2xl'] }]}>{t('auth.otp.title')}</Text>
        <Text style={[typography.body, { marginTop: spacing.sm, marginBottom: spacing['2xl'] }]}>
          {t('auth.otp.subtitle', { phone: params.masked ?? params.phone })}
        </Text>

        {/*
          Kataklar ustiga to'liq o'lchamli shaffof TextInput qo'yiladi.
          Shunda foydalanuvchi katakka teginsa, to'g'ridan-to'g'ri inputga
          tegadi va Android klaviaturani ochadi.
        */}
        <View style={styles.codeArea}>
          <View style={styles.cells} pointerEvents="none">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
              const filled = i < code.length;
              const active = focused && i === Math.min(code.length, OTP_LENGTH - 1);
              return (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    filled && { borderColor: colors.primary },
                    active && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                    !!error && { borderColor: colors.danger },
                  ]}
                >
                  <Text style={styles.cellText}>{code[i] ?? ''}</Text>
                </View>
              );
            })}
          </View>

          <TextInput
            testID="otp-input"
            ref={inputRef}
            value={code}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={OTP_LENGTH}
            caretHidden
            autoFocus
            // SMS dan kodni avtomatik olish
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            textContentType="oneTimeCode"
            style={styles.hiddenInput}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: spacing.xl }} />
        <Button
          title={t('auth.otp.verify')}
          onPress={() => verify(code)}
          disabled={code.length !== OTP_LENGTH}
          loading={loading}
        />

        <Pressable
          onPress={resend}
          disabled={seconds > 0}
          hitSlop={12}
          style={{ marginTop: spacing.xl, alignSelf: 'center' }}
        >
          <Text style={[typography.small, { color: seconds > 0 ? colors.textMuted : colors.primary }]}>
            {seconds > 0 ? t('auth.otp.resendIn', { sec: seconds }) : t('auth.otp.resend')}
          </Text>
        </Pressable>

        {/* Klaviatura chiqmasa — qo'lda ochish uchun */}
        <Pressable
          onPress={() => inputRef.current?.focus()}
          hitSlop={12}
          style={{ marginTop: spacing.lg, alignSelf: 'center' }}
        >
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {t('auth.otp.keyboardHint')}
          </Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {params.devCode ? (
          <InfoBanner
            text={t('auth.otp.devHint', { code: params.devCode })}
            tone="warning"
            icon="construct-outline"
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  codeArea: { position: 'relative' },
  cells: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  cell: {
    flex: 1,
    height: 68,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { color: colors.text, fontSize: 28, fontWeight: '700' },
  /**
   * Kataklar ustidagi shaffof input: o'lchami to'liq, shuning uchun teginish
   * ishlaydi va klaviatura ochiladi. Matn ko'rinmaydi — raqamlar kataklarda
   * chiziladi.
   */
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    fontSize: 28,
    textAlign: 'center',
    opacity: Platform.OS === 'android' ? 0.01 : 0,
  },
  error: { color: colors.danger, marginTop: spacing.md, textAlign: 'center' },
});
