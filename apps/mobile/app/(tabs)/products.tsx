import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Paginated, Product } from '@ecwt/contracts';
import { useApi } from '@/api/use-api';
import { useLocale } from '@/i18n/LocaleContext';
import { Badge, EmptyState, ErrorBanner, Loading } from '@/components/ui';
import { productStatus } from '@/lib/status-labels';
import { formatUzs } from '@/lib/format';
import { colors, fontSize, radius, spacing } from '@/theme';

export default function ProductsScreen() {
  const { t, locale } = useLocale();
  const { data, loading, error, refreshing, refresh } = useApi<Paginated<Product>>(
    '/products?limit=50',
  );

  if (loading && !data) return <Loading label={t.common.loading} />;

  const products = data?.items ?? [];

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.bannerWrap}>
          <ErrorBanner message={error} />
        </View>
      ) : null}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={<EmptyState message={t.common.empty} />}
        ListFooterComponent={
          products.length > 0 ? <Text style={styles.hint}>{t.products.addHint}</Text> : null
        }
        renderItem={({ item }) => {
          const status = productStatus(item.status, locale);
          const image = item.images.find((img) => img.isPrimary) ?? item.images[0];

          return (
            <View style={styles.row}>
              {image ? (
                <Image source={{ uri: image.url }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
              )}

              <View style={styles.rowBody}>
                <Text style={styles.name} numberOfLines={2}>
                  {locale === 'en' ? item.nameEn : item.nameUz}
                </Text>

                <Text style={styles.sku}>
                  {t.products.sku}: {item.sku}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.price}>{formatUzs(item.basePriceUzs, locale)}</Text>
                  <Text style={styles.stock}>
                    {t.products.stock}: {item.stock}
                  </Text>
                </View>

                <View style={styles.badgeRow}>
                  <Badge label={status.label} tone={status.tone} />
                </View>

                {item.status === 'REJECTED' && item.rejectionReason ? (
                  <Text style={styles.reason}>{item.rejectionReason}</Text>
                ) : null}
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  image: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.brand100 },
  imagePlaceholder: { backgroundColor: colors.brand100 },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.brand950 },
  sku: { fontSize: fontSize.xs, color: colors.brand400 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  price: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brand800 },
  stock: { fontSize: fontSize.sm, color: colors.brand500 },
  badgeRow: { marginTop: spacing.sm },
  reason: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },
  hint: {
    fontSize: fontSize.xs,
    color: colors.brand400,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
