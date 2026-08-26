import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Supplier, SupplierStats } from '@ecwt/contracts';
import { useApi } from '@/api/use-api';
import { useAuth } from '@/auth/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import { Badge, Card, ErrorBanner, Loading, StatTile } from '@/components/ui';
import { supplierStatus } from '@/lib/status-labels';
import { formatUsd } from '@/lib/format';
import { colors, fontSize, spacing } from '@/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, locale } = useLocale();

  const supplier = useApi<Supplier>('/suppliers/me');
  const stats = useApi<SupplierStats>('/suppliers/me/stats');

  if (supplier.loading && !supplier.data) {
    return <Loading label={t.common.loading} />;
  }

  const status = supplier.data ? supplierStatus(supplier.data.status, locale) : null;
  const isVerified = supplier.data?.status === 'VERIFIED';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={supplier.refreshing}
          onRefresh={() => {
            supplier.refresh();
            stats.refresh();
          }}
        />
      }
    >
      <View>
        <Text style={styles.greeting}>{t.home.greeting},</Text>
        <Text style={styles.company}>{supplier.data?.companyName ?? user?.fullName ?? ''}</Text>
        {status ? (
          <View style={styles.badgeRow}>
            <Badge label={status.label} tone={status.tone} />
          </View>
        ) : null}
      </View>

      {supplier.error ? <ErrorBanner message={supplier.error} /> : null}

      {/* Profil tayyor bo'lmasa — nima qilish kerakligini aytamiz */}
      {supplier.data && !isVerified ? (
        <Card style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>
            {supplier.data.status === 'PENDING_REVIEW'
              ? t.home.profilePending
              : supplier.data.status === 'REJECTED'
                ? t.home.profileRejected
                : t.home.profileIncomplete}
          </Text>

          <Text style={styles.noticeBody}>
            {supplier.data.status === 'PENDING_REVIEW'
              ? t.home.profilePendingBody
              : t.home.profileIncompleteBody}
          </Text>

          {supplier.data.status === 'REJECTED' && supplier.data.rejectionReason ? (
            <Text style={styles.noticeReason}>{supplier.data.rejectionReason}</Text>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.statsGrid}>
        <StatTile
          label={t.home.balance}
          value={formatUsd(supplier.data?.balanceUsd ?? 0)}
          hint={`${t.home.pendingPayout}: ${formatUsd(stats.data?.pendingPayoutUsd ?? 0)}`}
          accent
        />
        <StatTile label={t.home.revenue} value={formatUsd(stats.data?.revenueUsd ?? 0)} />
      </View>

      <View style={styles.statsGrid}>
        <StatTile label={t.home.orders} value={String(stats.data?.ordersTotal ?? 0)} />
        <StatTile label={t.home.liveListings} value={String(stats.data?.listingsLive ?? 0)} />
      </View>

      <View style={styles.statsGrid}>
        <StatTile
          label={t.home.products}
          value={String(stats.data?.productsTotal ?? 0)}
          hint={`${stats.data?.productsApproved ?? 0} ✓`}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: { padding: spacing.lg, gap: spacing.lg },
  greeting: { fontSize: fontSize.sm, color: colors.brand500 },
  company: { fontSize: fontSize.xl, fontWeight: '700', color: colors.brand950, marginTop: 2 },
  badgeRow: { marginTop: spacing.sm },
  noticeCard: { backgroundColor: colors.warningBg, borderColor: colors.warning, gap: spacing.sm },
  noticeTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand950 },
  noticeBody: { fontSize: fontSize.sm, color: colors.brand800, lineHeight: 20 },
  noticeReason: {
    fontSize: fontSize.sm,
    color: colors.danger,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
  },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
});
