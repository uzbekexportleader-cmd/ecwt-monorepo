import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';

/* -------------------------------------------------------------------------- */
/* Tugma                                                                       */
/* -------------------------------------------------------------------------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'outline' && styles.buttonOutline,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.brand700 : colors.white} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.buttonTextDark,
            variant === 'outline' && styles.buttonTextOutline,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Maydon                                                                      */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={colors.brand300}
        accessibilityLabel={label}
        {...props}
      />

      {error ? (
        <Text style={styles.fieldError} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Karta va nishon                                                             */
/* -------------------------------------------------------------------------- */

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const BADGE_COLORS: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: colors.neutralBg, text: colors.neutralText },
  info: { bg: colors.infoBg, text: colors.info },
  success: { bg: colors.successBg, text: colors.success },
  warning: { bg: colors.warningBg, text: colors.warning },
  danger: { bg: colors.dangerBg, text: colors.danger },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette = BADGE_COLORS[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Statistika plitkasi                                                         */
/* -------------------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statTile, accent && styles.statTileAccent]}>
      <Text style={[styles.statLabel, accent && styles.statLabelAccent]}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      {hint ? (
        <Text style={[styles.statHint, accent && styles.statHintAccent]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Holat ko'rsatkichlari                                                       */
/* -------------------------------------------------------------------------- */

export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.brand600} />
      <Text style={styles.centeredText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: { backgroundColor: colors.brand700 },
  buttonSecondary: { backgroundColor: colors.gold400 },
  buttonOutline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  buttonTextDark: { color: colors.brand950 },
  buttonTextOutline: { color: colors.brand700 },

  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.brand900,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.brand200,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.brand950,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.danger },
  fieldError: {
    fontSize: fontSize.xs,
    color: colors.danger,
    fontWeight: '500',
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand100,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },

  statTile: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand100,
    gap: spacing.xs,
  },
  statTileAccent: { backgroundColor: colors.brand800, borderColor: colors.brand700 },
  statLabel: { fontSize: fontSize.xs, color: colors.brand500, fontWeight: '500' },
  statLabelAccent: { color: colors.brand200 },
  statValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.brand950 },
  statValueAccent: { color: colors.white },
  statHint: { fontSize: fontSize.xs, color: colors.brand400 },
  statHintAccent: { color: colors.brand300 },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  centeredText: { fontSize: fontSize.sm, color: colors.brand500 },

  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: { fontSize: fontSize.sm, color: colors.brand400, textAlign: 'center' },

  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorBannerText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '500' },
});
