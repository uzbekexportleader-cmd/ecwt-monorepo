/**
 * ECWT dizayn tokenlari.
 * Mobil (React Native StyleSheet) va admin panel (Tailwind) shu yagona
 * manbadan rang oladi. Ekranlarda hech qachon hex kod yozilmaydi.
 */

export const colors = {
  /* fon qatlamlari — deep navy */
  bg: '#050B1A',
  bgElevated: '#0A1330',
  surface: '#0F1A38',
  surfaceAlt: '#142145',
  surfaceHover: '#1A2A55',

  /* brend */
  primary: '#00C2E0',
  primaryDark: '#0096AE',
  primarySoft: 'rgba(0, 194, 224, 0.12)',
  accent: '#E5B567',
  accentSoft: 'rgba(229, 181, 103, 0.14)',

  /* matn */
  text: '#F2F6FF',
  textSecondary: '#A5B4D4',
  textMuted: '#6F80A6',
  textInverse: '#050B1A',

  /* chiziq */
  border: '#1E2C55',
  borderStrong: '#2A3B6F',

  /* holat */
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.14)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.14)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  info: '#60A5FA',
  infoSoft: 'rgba(96, 165, 250, 0.14)',

  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(5, 11, 26, 0.72)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Katta yoshli foydalanuvchi uchun minimal teginish maydoni */
export const HIT_SLOP = 12;
export const MIN_TOUCH_SIZE = 52;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

/** Tailwind config uchun tekis rang xaritasi (admin panel). */
export const tailwindColors = {
  bg: colors.bg,
  elevated: colors.bgElevated,
  surface: colors.surface,
  'surface-alt': colors.surfaceAlt,
  primary: colors.primary,
  'primary-dark': colors.primaryDark,
  accent: colors.accent,
  ink: colors.text,
  'ink-secondary': colors.textSecondary,
  'ink-muted': colors.textMuted,
  line: colors.border,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
};

/** So'm formatlash: 1 250 000 so'm */
export function formatSom(value: number | null | undefined, withSuffix = true): string {
  if (value === null || value === undefined) return '—';
  const s = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return withSuffix ? `${s} so'm` : s;
}

/** +998901234567 → +998 90 123 45 67 */
export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 12) return raw;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}

export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 12) return raw;
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} *** ** ${d.slice(10)}`;
}
