import { Platform, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, shadows } from '@ecwt/ui';

export { colors, radius, spacing, fontSize, fontWeight, shadows };
export { formatSom, formatPhone, maskPhone } from '@ecwt/ui';

/** Katta yoshli foydalanuvchi ham bemalol bosadigan minimal balandlik. */
export const CONTROL_HEIGHT = 60;

/**
 * Matn soyasi — video fon ustida o'qilishi uchun.
 *
 * Fon harakatlanuvchi tasvir bo'lgani uchun yozuv goh qorong'i, goh yorug'
 * joyga tushadi. Soya shu ikkala holatda ham harfni fondan ajratib turadi
 * va parda quyuqligini oshirmasdan o'qilishni ta'minlaydi.
 */
const MATN_SOYASI = {
  textShadowColor: 'rgba(5, 11, 26, 0.85)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 5,
} as const;

export const typography = StyleSheet.create({
  display: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
    ...MATN_SOYASI,
  },
  h1: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text, ...MATN_SOYASI },
  h2: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.text, ...MATN_SOYASI },
  h3: { fontSize: 19, fontWeight: fontWeight.semibold, color: colors.text, ...MATN_SOYASI },
  body: {
    fontSize: 17,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    lineHeight: 26,
    ...MATN_SOYASI,
  },
  bodyStrong: {
    fontSize: 17,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    ...MATN_SOYASI,
  },
  small: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, ...MATN_SOYASI },
  caption: { fontSize: 13, color: colors.textMuted, ...MATN_SOYASI },
  label: {
    fontSize: 15,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    ...MATN_SOYASI,
  },
});

export const layout = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  /**
   * Fon videosi ustidagi ekranlar uchun. Fon shaffof — video ildizda bir
   * marta chizilgan va navigatorning ORQASIDA turadi (`VideoBackdropHost`).
   */
  screenClear: { flex: 1, backgroundColor: 'transparent' },
  container: { paddingHorizontal: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  gap8: { gap: spacing.sm },
  gap12: { gap: spacing.md },
  gap16: { gap: spacing.lg },
});

/** Android'da shadow o'rniga elevation ishlatiladi. */
export const cardShadow = Platform.OS === 'ios' ? shadows.card : { elevation: 4 };
