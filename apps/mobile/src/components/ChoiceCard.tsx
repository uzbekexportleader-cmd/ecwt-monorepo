import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from './AppText';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Katta tanlov kartasi.
 *
 * Ro'yxatdan o'tishda ko'p joyda bitta shakl kerak bo'ladi: faoliyat turi,
 * to'lov usuli, xizmatlar. Katta teginish maydoni va aniq belgilangan
 * tanlov — yoshi katta foydalanuvchi ham adashmasin.
 *
 * Tanlangani KO'K rang bilan ko'rsatiladi: chegara, fon, sarlavha va
 * belgi — hammasi bir vaqtda.
 *
 * Ilgari bu yerda oltin nur yonardi. Qorong'i karta va video fon ustida
 * u iflos sariq quti bo'lib ko'rinardi, foydalanuvchi uni xato deb
 * o'yladi. Bundan tashqari har tanlangan karta uzluksiz animatsiya
 * yuritardi va matn yozayotganda klaviatura sekinlashardi.
 */
export function ChoiceCard({
  title,
  hint,
  icon,
  selected,
  onPress,
  /** Bir nechtasini tanlash mumkin bo'lsa — belgisi kvadrat bo'ladi */
  multiple = false,
}: {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  multiple?: boolean;
}) {
  const mark = multiple
    ? selected
      ? 'checkbox'
      : 'square-outline'
    : selected
      ? 'radio-button-on'
      : 'radio-button-off';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ selected }}
      accessibilityLabel={hint ? `${title}. ${hint}` : title}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      {icon ? (
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <Ionicons name={icon} size={24} color={selected ? colors.primary : colors.textSecondary} />
        </View>
      ) : null}

      <View style={styles.texts}>
        <Text style={[typography.bodyStrong, selected && styles.titleSelected]}>{title}</Text>
        {hint ? <Text style={[typography.caption, styles.hint]}>{hint}</Text> : null}
      </View>

      <Ionicons name={mark} size={24} color={selected ? colors.primary : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(15, 26, 56, 0.72)',
    // Nur karta chetidan tashqariga chiqib ketmasligi uchun
    overflow: 'hidden',
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: 'rgba(0, 194, 224, 0.12)' },
  cardPressed: { opacity: 0.75 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconWrapSelected: { backgroundColor: 'rgba(0, 194, 224, 0.16)' },
  texts: { flex: 1, gap: 2 },
  titleSelected: { color: colors.primary },
  hint: { lineHeight: 17 },
});
