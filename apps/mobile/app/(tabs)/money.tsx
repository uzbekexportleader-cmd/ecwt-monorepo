import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text } from '../../src/components/AppText';
import { useProducts, useProfile, useServicePayment } from '../../src/api/queries';
import { Button, Card, LoadingView, Screen, SectionHeader } from '../../src/components/ui';
import { LockedNotice } from '../../src/components/LockedNotice';
import { colors, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

/**
 * Yo'lning oxirgi bosqichi: hunarmand pulini oladi.
 *
 * MUHIM: bu ekranda hech qanday to'qib chiqarilgan balans yoki tushum
 * ko'rsatilmaydi. Raqam faqat haqiqiy sotuvdan keyin paydo bo'ladi —
 * hozircha sotuv ma'lumoti yo'q, shuning uchun ekran buni ochiq aytadi
 * va pul olish rekvizitini tayyorlab qo'yishga yordam beradi.
 */

const METHOD_LABEL: Record<string, string> = {
  SELF: 'O‘z mablag‘i hisobidan',
  SUBSIDY: 'Subsidiya hisobidan',
};

/** Hisob raqamining faqat oxirgi 4 raqami ko'rsatiladi */
const maskAccount = (account: string | null): string =>
  account && account.length > 4 ? `•••• ${account.slice(-4)}` : '—';

export default function MoneyScreen() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const products = useProducts();
  const payment = useServicePayment();
  const locked = payment.data ? !payment.data.unlocked : false;

  if (profile.isLoading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }

  const p = profile.data;
  // Sotuvda turgan mahsulotlar — pul oqimi shulardan boshlanadi
  const onSale = (products.data ?? []).filter((x) => x.status === 'PUBLISHED').length;

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={profile.isFetching && !profile.isLoading}
          onRefresh={() => {
            void profile.refetch();
            void products.refetch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={typography.h1}>{t('money.title')}</Text>

      {locked ? <LockedNotice /> : null}

      <Card style={styles.emptyCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="wallet-outline" size={24} color={colors.primary} />
        </View>
        <Text style={[typography.body, { textAlign: 'center' }]}>{t('money.empty')}</Text>
        <Text style={[typography.caption, { textAlign: 'center' }]}>
          {t('money.onSale')}: {onSale}
        </Text>
      </Card>

      <SectionHeader title={t('money.method')} />
      <Card style={{ gap: spacing.xs }}>
        <Row label={t('money.method')} value={METHOD_LABEL[p?.paymentMethod ?? ''] ?? '—'} />
        <Row label={t('profile.bank')} value={p?.bankName ?? '—'} />
        <Row label={t('profile.bankAccount')} value={maskAccount(p?.bankAccount ?? null)} />
        <Text style={[typography.caption, { marginTop: spacing.sm }]}>{t('money.methodHint')}</Text>
      </Card>

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <Button
          title={t('pay.title')}
          icon="card-outline"
          onPress={() => router.push('/payment')}
        />
        <Button
          title={t('money.edit')}
          variant="secondary"
          icon="card-outline"
          onPress={() => router.push('/profile/bank')}
        />
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={typography.caption}>{label}</Text>
      <Text style={[typography.body, { flex: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
