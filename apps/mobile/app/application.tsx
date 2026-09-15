import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { SellerApplicationStatus } from '@ecwt/types';

import { Text } from '../src/components/AppText';
import { useSellerApplication } from '../src/api/queries';
import { Button, Card, EmptyState, ErrorView, LoadingView, Screen } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * Sotuvchi arizasi holati.
 *
 * Ekran uchta savolga javob beradi: hozir nima bo'lyapti, kimning harakati
 * kutilmoqda va foydalanuvchi keyin nima qiladi. Matnlar holatga qarab
 * i18n kalitidan olinadi — to'rt til ham bir xil to'liq.
 *
 * Holat mantig'i (sotuvga chiqish ochiqmi) serverdan `canSell` bo'lib
 * keladi: ilova holatdan o'zi xulosa chiqarmaydi.
 */

const TONE: Record<SellerApplicationStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  UNDER_REVIEW: { bg: colors.infoSoft, fg: colors.info, icon: 'time-outline' },
  MORE_INFO_NEEDED: { bg: colors.warningSoft, fg: colors.warning, icon: 'alert-circle-outline' },
  APPROVED: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle-outline' },
  REJECTED: { bg: colors.dangerSoft, fg: colors.danger, icon: 'close-circle-outline' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export default function ApplicationStatusScreen() {
  const t = useT();
  const router = useRouter();
  const query = useSellerApplication();

  if (query.isLoading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorView message={t('common.error')} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const app = query.data;

  // `null` — anketa hali tugatilmagan. Bu xato emas, shuning uchun
  // xato ekrani emas, yo'l ko'rsatuvchi bo'sh holat ko'rsatiladi.
  if (!app) {
    return (
      <Screen>
        <EmptyState
          icon="document-text-outline"
          title={t('app.none')}
          subtitle={t('app.noneHint')}
        />
      </Screen>
    );
  }

  const tone = TONE[app.status];

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
      }
    >
      <View style={[styles.badge, { backgroundColor: tone.bg }]}>
        <Ionicons name={tone.icon} size={20} color={tone.fg} />
        <Text style={[typography.label, { color: tone.fg }]}>{t(`app.st.${app.status}`)}</Text>
      </View>

      <Card style={styles.numberCard}>
        <Text style={typography.caption}>{t('app.number')}</Text>
        <Text style={styles.number}>{app.number}</Text>
        <Text style={typography.caption}>
          {t('app.submittedAt')}: {formatDate(app.submittedAt)}
        </Text>
      </Card>

      {app.reviewerNote ? (
        <Card style={styles.block}>
          <Text style={typography.label}>{t('app.reviewerNote')}</Text>
          <Text style={typography.body}>{app.reviewerNote}</Text>
        </Card>
      ) : null}

      <Card style={styles.block}>
        <Text style={typography.label}>{t('app.now')}</Text>
        <Text style={typography.body}>{t(`app.now.${app.status}`)}</Text>
      </Card>

      <Card style={styles.block}>
        <Text style={typography.label}>{t('app.who')}</Text>
        <Text style={typography.body}>{t(`app.who.${app.status}`)}</Text>
      </Card>

      <Card style={styles.block}>
        <Text style={typography.label}>{t('app.next')}</Text>
        <Text style={typography.body}>{t(`app.next.${app.status}`)}</Text>
      </Card>

      <View style={styles.actions}>
        {app.status === 'MORE_INFO_NEEDED' ? (
          <Button
            title={t('done.cabinet')}
            variant="secondary"
            icon="id-card-outline"
            onPress={() => router.push('/profile/anketa')}
          />
        ) : null}
        <Button
          title={t('done.firstProduct')}
          icon="add-circle-outline"
          onPress={() => router.push('/products/new')}
        />
      </View>

      <Text style={[typography.label, styles.historyTitle]}>{t('app.history')}</Text>
      {app.history.map((e, i) => (
        <View key={`${e.createdAt}-${i}`} style={styles.historyRow}>
          <View style={[styles.dot, { backgroundColor: TONE[e.status].fg }]} />
          <View style={{ flex: 1 }}>
            <Text style={typography.body}>{t(`app.st.${e.status}`)}</Text>
            {e.note ? <Text style={typography.caption}>{e.note}</Text> : null}
            <Text style={typography.caption}>{formatDate(e.createdAt)}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  numberCard: { marginTop: spacing.lg, gap: spacing.xs },
  number: { color: colors.primary, fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  block: { marginTop: spacing.md, gap: spacing.xs },
  actions: { marginTop: spacing.xl, gap: spacing.md },
  historyTitle: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  historyRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
});
