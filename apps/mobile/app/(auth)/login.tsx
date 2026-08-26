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
import { loginSchema } from '@ecwt/contracts';
import { useAuth } from '@/auth/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import { ApiError } from '@/api/client';
import { Button, ErrorBanner, Field } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useLocale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    setErrors({});
    setFormError(null);

    // Saytdagi bilan AYNAN bir xil sxema — qoidalar farq qilmaydi
    const parsed = loginSchema.safeParse({ email, password });

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
      await login(parsed.data);
      // Yo'naltirishni RootNavigator bajaradi
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : t.common.error);
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
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.brandName}>ECWT</Text>
        </View>

        <Text style={styles.title}>{t.auth.loginTitle}</Text>
        <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>

        <View style={styles.form}>
          <Field
            label={t.auth.email}
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="siz@kompaniya.uz"
          />

          <Field
            label={t.auth.password}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoComplete="current-password"
          />

          {formError ? <ErrorBanner message={formError} /> : null}

          <Button title={t.auth.login} onPress={handleSubmit} loading={submitting} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.auth.noAccount} </Text>
          <Link href="/(auth)/register" style={styles.footerLink}>
            {t.auth.register}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '700' },
  brandName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.brand950 },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.brand950 },
  subtitle: { fontSize: fontSize.sm, color: colors.brand500, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: { fontSize: fontSize.sm, color: colors.brand500 },
  footerLink: { fontSize: fontSize.sm, color: colors.brand700, fontWeight: '600' },
});
