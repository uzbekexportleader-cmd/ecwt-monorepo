import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';

import { useProducts, useServicePayment } from '../../src/api/queries';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorView,
  InfoBanner,
  LoadingView,
  Screen,
} from '../../src/components/ui';
import { LockedNotice } from '../../src/components/LockedNotice';
import { colors, formatSom, layout, radius, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function ProductsScreen() {
  const t = useT();
  const router = useRouter();
  const query = useProducts();
  const payment = useServicePayment();
  /*
   * Qulf: xizmat to'lovi tasdiqlanmaguncha mahsulot bo'limi yopiq.
   * Haqiqiy cheklov serverda; bu yerda faqat ko'rsatiladi.
   */
  const locked = payment.data ? !payment.data.unlocked : false;
  const items = query.data ?? [];

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching && !query.isLoading}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={[layout.rowBetween, { marginBottom: spacing.lg }]}>
        <Text style={typography.h1}>{t('product.title')}</Text>
      </View>

      {locked ? <LockedNotice /> : null}

      <InfoBanner text={t('product.mockNotice')} tone="warning" icon="information-circle-outline" />

      <View style={{ height: spacing.lg }} />
      {/* To'lov tasdiqlanmaguncha mahsulot qo'shilmaydi */}
      {locked ? null : (
        <Button title={t('product.add')} icon="add" onPress={() => router.push('/products/new')} />
      )}

      {query.isLoading ? <LoadingView /> : null}
      {query.isError ? (
        <ErrorView message="Mahsulotlarni yuklab bo‘lmadi" onRetry={() => void query.refetch()} />
      ) : null}

      {!query.isLoading && items.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={t('product.empty')}
          subtitle="Mahsulotingizni qo‘shing va xalqaro platformalarga chiqarishga tayyorlang."
        />
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        {items.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/products/${p.id}`)} style={{ marginBottom: spacing.md }}>
            <View style={[layout.row, { gap: spacing.md }]}>
              {p.images[0] ? (
                <Image
                  source={{ uri: p.images[0].url }}
                  style={styles.thumb}
                  contentFit="cover"
                  transition={180}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[styles.thumb, layout.center]}>
                  <Text style={{ fontSize: 22 }}>📦</Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={typography.bodyStrong} numberOfLines={1}>
                  {p.title}
                </Text>
                <Text style={[typography.caption, { color: colors.accent }]}>
                  {formatSom(p.price)}
                </Text>
                <View style={[layout.row, { gap: spacing.xs, flexWrap: 'wrap' }]}>
                  <Chip
                    label={
                      p.status === 'PUBLISHED'
                        ? 'Chiqarilgan'
                        : p.status === 'READY'
                          ? 'Tayyor'
                          : 'Qoralama'
                    }
                    tone={p.status === 'PUBLISHED' ? 'success' : 'neutral'}
                  />
                  {p.listings.length ? (
                    <Chip label={`${p.listings.length} ta platforma`} tone="info" />
                  ) : null}
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
});
