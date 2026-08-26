import { useState } from 'react';
import { Link } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { registerSchema } from '@ecwt/contracts';
import { useAuth } from '@/auth/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import { ApiError } from '@/api/client';
import { Button, ErrorBanner, Field } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t, locale } = useLocale();

  const [values, setValues] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof values, value: string): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(): Promise<void> {
    setErrors({});
    setFormError(null);

    const parsed = registerSchema.safeParse({ ...values, locale });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      await register(parsed.data);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(error.details)) {
            if (messages[0]) fieldErrors[key] = messages[0];
          }
          setErrors(fieldErrors);
        }
        setFormError(error.message);
      } else {
        setFormError(t.common.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.auth.registerTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>

        <View style={styles.form}>
          <Field
            label={t.auth.fullName}
            value={values.fullName}
            onChangeText={(value) => update('fullName', value)}
            error={errors.fullName}
            autoComplete="name"
          />

          <Field
            label={t.auth.companyName}
            value={values.companyName}
            onChangeText={(value) => update('companyName', value)}
            error={errors.companyName}
          />

          <Field
            label={t.auth.phone}
            value={values.phone}
            onChangeText={(value) => update('phone', value)}
            error={errors.phone}
            keyboardType="phone-pad"
            placeholder="+998901234567"
            autoComplete="tel"
          />

          <Field
            label={t.auth.email}
            value={values.email}
            onChangeText={(value) => update('email', value)}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Field
            label={t.auth.password}
            value={values.password}
            onChangeText={(value) => update('password', value)}
            error={errors.password}
            secureTextEntry
            autoComplete="new-password"
          />

          {formError ? <ErrorBanner message={formError} /> : null}

          <Button title={t.auth.register} onPress={handleSubmit} loading={submitting} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.auth.haveAccount} </Text>
          <Link href="/(auth)/login" style={styles.footerLink}>
            {t.auth.login}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.brand950 },
  subtitle: { fontSize: fontSize.sm, color: colors.brand500, marginBottom: spacing.xl },
  form: { gap: spacing.lg },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontSize: fontSize.sm, color: colors.brand500 },
  footerLink: { fontSize: fontSize.sm, color: colors.brand700, fontWeight: '600' },
});
