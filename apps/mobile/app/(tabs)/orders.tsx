import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { MARKETPLACE_LABELS, type MarketplaceOrder, type Paginated } from '@ecwt/contracts';
import { useApi } from '@/api/use-api';
import { useLocale } from '@/i18n/LocaleContext';
import { Badge, EmptyState, ErrorBanner, Loading } from '@/components/ui';
import { orderStatus } from '@/lib/status-labels';
import { formatDate, formatUsd } from '@/lib/format';
import { colors, fontSize, radius, spacing } from '@/theme';

export default function OrdersScreen() {
  const { t, locale } = useLocale();
  const { data, loading, error, refreshing, refresh } = useApi<Paginated<MarketplaceOrder>>(
    '/orders?limit=50',
  );

  if (loading && !data) return <Loading label={t.common.loading} />;

  const orders = data?.items ?? [];

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.bannerWrap}>
          <ErrorBanner message={error} />
        </View>
      ) : null}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={<EmptyState message={t.common.empty} />}
        renderItem={({ item }) => {
          const status = orderStatus(item.status, locale);

          return (
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.marketplace}>{MARKETPLACE_LABELS[item.marketplace]}</Text>
                  <Text style={styles.date}>{formatDate(item.placedAt, locale)}</Text>
                </View>
                <Badge label={status.label} tone={status.tone} />
              </View>

              <Text style={styles.product} numberOfLines={2}>
                {item.product ? (locale === 'en' ? item.product.nameEn : item.product.nameUz) : '—'}
              </Text>

              <Text style={styles.orderId}>#{item.externalOrderId}</Text>

              <View style={styles.footer}>
                <Text style={styles.quantity}>
                  {t.orders.quantity}: {item.quantity}
                </Text>

                <View style={styles.amounts}>
                  <Text style={styles.gross}>{formatUsd(item.grossUsd)}</Text>
                  <Text style={styles.net}>
                    {t.orders.yourShare}: {formatUsd(item.netToSupplierUsd)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  bannerWrap: { padding: spacing.lg, paddingBottom: 0 },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand100,
    gap: spacing.xs,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { gap: 2 },
  marketplace: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brand700 },
  date: { fontSize: fontSize.xs, color: colors.brand400 },
  product: { fontSize: fontSize.md, fontWeight: '600', color: colors.brand950, marginTop: spacing.sm },
  orderId: { fontSize: fontSize.xs, color: colors.brand400 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.brand100,
    paddingTop: spacing.md,
  },
  quantity: { fontSize: fontSize.sm, color: colors.brand500 },
  amounts: { alignItems: 'flex-end' },
  gross: { fontSize: fontSize.sm, color: colors.brand500 },
  net: { fontSize: fontSize.md, fontWeight: '700', color: colors.brand950 },
});
