import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text } from './AppText';
import { Button, Card } from './ui';
import { colors, spacing, typography } from '../theme';
import { useT } from '../i18n';

/**
 * "Bu bo'lim yopiq" kartasi.
 *
 * Qulf ilovada FAQAT ko'rinish uchun: haqiqiy cheklov serverda turadi
 * (to'lov tasdiqlanmasa so'rov baribir rad etiladi). Bu yerdagi vazifa —
 * foydalanuvchi "nega ishlamayapti" deb o'ylamasin, nima qilish
 * kerakligini ko'rsin.
 */
export function LockedNotice() {
  const t = useT();
  const router = useRouter();

  return (
    <Card style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.warning} />
      </View>
      <Text style={[typography.bodyStrong, styles.center]}>{t('pay.locked')}</Text>
      <Text style={[typography.small, styles.center]}>{t('pay.lockedHint')}</Text>
      <Button title={t('pay.open')} icon="card-outline" onPress={() => router.push('/payment')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warningSoft,
  },
});
