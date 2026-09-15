import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from './AppText';
import { LOCALES, useLocale, useT, type Locale } from '../i18n';
import { changeLocale } from '../store/locale';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Til tanlash ro'yxati.
 *
 * Har bir til O'Z tilida yozilgan: foydalanuvchi ilovani tushunmayotgan
 * bo'lsa ham o'z tilini taniy oladi. Tanlov darhol qo'llanadi va saqlanadi.
 */
export function LanguagePicker() {
  const t = useT();
  const locale = useLocale();

  const pick = (code: Locale) => {
    void changeLocale(code);
  };

  return (
    <View style={styles.list}>
      {LOCALES.map((item) => {
        const active = item.code === locale;
        return (
          <Pressable
            key={item.code}
            onPress={() => pick(item.code)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.english}
            style={({ pressed }) => [
              styles.row,
              active && styles.rowActive,
              pressed && styles.rowPressed,
            ]}
          >
            <Text style={[typography.bodyStrong, active && styles.labelActive]}>{item.label}</Text>
            {active ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
          </Pressable>
        );
      })}

      <Text style={[typography.caption, styles.hint]}>{t('settings.languageHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: { borderColor: colors.primary },
  rowPressed: { opacity: 0.7 },
  labelActive: { color: colors.primary },
  hint: { marginTop: spacing.xs },
});

/**
 * Ixcham til almashtirgich — Xush kelibsiz ekranining tepasi uchun.
 *
 * To'rttala til bir qatorda turadi: foydalanuvchi ilovani birinchi ochganda
 * o'z tilini darhol ko'radi va sozlamalarni qidirib yurmaydi.
 */
export function LanguageChips() {
  const locale = useLocale();

  return (
    <View style={chipStyles.row}>
      {LOCALES.map((item) => {
        const active = item.code === locale;
        return (
          <Pressable
            key={item.code}
            onPress={() => void changeLocale(item.code)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.english}
            hitSlop={6}
            style={({ pressed }) => [
              chipStyles.chip,
              active && chipStyles.chipActive,
              pressed && chipStyles.chipPressed,
            ]}
          >
            <Text style={[chipStyles.text, active && chipStyles.textActive]}>{item.short}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    minWidth: 56,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(30, 44, 85, 0.9)',
    backgroundColor: 'rgba(15, 26, 56, 0.72)',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 194, 224, 0.16)',
  },
  chipPressed: { opacity: 0.7 },
  text: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  textActive: { color: colors.primary },
});
