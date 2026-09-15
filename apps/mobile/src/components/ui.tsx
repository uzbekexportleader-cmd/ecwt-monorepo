import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { KeyboardAwareScroll } from './KeyboardAwareScroll';

import { CONTROL_HEIGHT, cardShadow, colors, layout, radius, spacing, typography } from '../theme';

/* -------------------------------- Screen -------------------------------- */

/** AI yordamchi tugmasi (56px) + atrofidagi bo'shliq */
const AI_BUTTON_CLEARANCE = 72;

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  /**
   * Fon shaffof bo'lsin — ortidagi video ko'rinadi.
   *
   * Ildizdagi `VideoBackdropHost` navigatorning ORQASIDA turadi; ekran
   * o'zining fonini chizsa, videoni yopib qo'yadi.
   */
  clear = false,
  style,
  contentStyle,
  refreshControl,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  clear?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  const inner = scroll ? (
    /*
     * Klaviatura pastdagi maydonni yopib qo'ymasligi uchun oddiy ScrollView
     * emas, KeyboardAwareScroll ishlatiladi: u ro'yxat tagiga klaviatura
     * balandligicha joy qo'shadi va fokusdagi maydonni tepaga surib chiqaradi.
     *
     * `TextField` fokusga kelganda o'zini shu komponentga bildiradi —
     * ya'ni bu yerdagi bitta o'zgarish `Screen` ishlatadigan BARCHA
     * ekranlarga (profil, mahsulot qo'shish, ariza) tegishli.
     */
    <KeyboardAwareScroll
      style={{ flex: 1 }}
      /*
       * Pastda qo'shimcha joy: o'ng burchakdagi AI yordamchi tugmasi
       * ro'yxatning oxirgi tugmasini yopib qo'ymasin. Tugma navigatordan
       * tashqarida turadi, shuning uchun uni faqat shu bo'sh joy bilan
       * chetlab o'tish mumkin.
       */
      contentContainerStyle={[
        { padding: spacing.xl, paddingBottom: spacing.xl + AI_BUTTON_CLEARANCE },
        contentStyle,
      ]}
      extraBottom={spacing['5xl']}
      refreshControl={refreshControl}
    >
      {children}
    </KeyboardAwareScroll>
  ) : (
    <View style={[{ flex: 1, padding: spacing.xl }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[clear ? layout.screenClear : layout.screen, style]}>
      {inner}
    </SafeAreaView>
  );
}

/* -------------------------------- Button -------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  fullWidth = true,
  testID,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  /** E2E testlar uchun barqaror identifikator */
  testID?: string;
}) {
  const isDisabled = disabled || loading;
  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.textInverse },
    gold: { bg: colors.accent, fg: colors.textInverse },
    secondary: { bg: colors.surfaceAlt, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.primary },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.danger },
  };
  const p = palette[variant];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: p.bg,
          borderColor: p.border ?? 'transparent',
          borderWidth: p.border ? 1 : 0,
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? spacing.xl : spacing['2xl'],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={[layout.row, { gap: spacing.sm }]}>
          {icon ? <Ionicons name={icon} size={22} color={p.fg} /> : null}
          <Text style={[styles.buttonText, { color: p.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/* --------------------------------- Card --------------------------------- */

export function Card({
  children,
  onPress,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const content = (
    <View style={[styles.card, padded && { padding: spacing.lg }, style]}>{children}</View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {content}
    </Pressable>
  );
}

/* --------------------------------- Chip --------------------------------- */

export function Chip({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const tones = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    info: { bg: colors.infoSoft, fg: colors.info },
    gold: { bg: colors.accentSoft, fg: colors.accent },
  } as const;
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={13} color={t.fg} /> : null}
      <Text style={[styles.chipText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/* ------------------------------ ProgressBar ------------------------------ */

export function ProgressBar({ percent, height = 10 }: { percent: number; height?: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const tone = clamped >= 80 ? colors.success : clamped >= 50 ? colors.primary : colors.accent;
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height }]}>
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: tone,
          borderRadius: height,
        }}
      />
    </View>
  );
}

/* ----------------------------- SectionHeader ----------------------------- */

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[layout.rowBetween, { marginBottom: spacing.md, marginTop: spacing.xl }]}>
      <Text style={typography.h3}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text style={styles.link}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------- states ---------------------------------- */

export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={[layout.center, { paddingVertical: spacing['4xl'], gap: spacing.md }]}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label ? <Text style={typography.small}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[layout.center, { paddingVertical: spacing['4xl'], gap: spacing.md }]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text style={[typography.h3, { textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.small, { textAlign: 'center', maxWidth: 280 }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} variant="secondary" />
      ) : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={[layout.center, { paddingVertical: spacing['3xl'], gap: spacing.md }]}>
      <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
      <Text style={[typography.body, { textAlign: 'center' }]}>{message}</Text>
      {onRetry ? <Button title="Qayta urinish" onPress={onRetry} fullWidth={false} variant="secondary" /> : null}
    </View>
  );
}

/* ------------------------------ InfoBanner ------------------------------- */

export function InfoBanner({
  text,
  tone = 'info',
  icon = 'information-circle-outline',
}: {
  text: string;
  tone?: 'info' | 'warning' | 'danger' | 'success';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const tones = {
    info: { bg: colors.infoSoft, fg: colors.info },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    success: { bg: colors.successSoft, fg: colors.success },
  } as const;
  const t = tones[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]}>
      <Ionicons name={icon} size={18} color={t.fg} style={{ marginTop: 1 }} />
      <Text style={[typography.small, { color: t.fg, flex: 1 }]}>{text}</Text>
    </View>
  );
}

/* -------------------------------- ListRow -------------------------------- */

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  tone,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => [styles.listRow, { opacity: pressed && onPress ? 0.7 : 1 }]}
    >
      {icon ? (
        <View style={styles.listIcon}>
          <Ionicons
            name={icon}
            size={20}
            color={tone === 'danger' ? colors.danger : colors.primary}
          />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyStrong, tone === 'danger' && { color: colors.danger }]}>
          {title}
        </Text>
        {subtitle ? <Text style={typography.caption}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: CONTROL_HEIGHT,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...(cardShadow as object),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  progressTrack: { backgroundColor: colors.surfaceAlt, overflow: 'hidden', width: '100%' },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'flex-start',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
