import React from 'react';
import { Linking, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ListingStatus } from '@ecwt/types';

import { Text } from '../src/components/AppText';
import { useProducts } from '../src/api/queries';
import { Button, Card, InfoBanner, LoadingView, Screen } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * 21-qadam: mahsulot savdo maydonchasiga chiqarilmoqda.
 *
 * Bu KUTISH ekrani — hunarmandda tugma yo'q. Holat o'zi gapiradi.
 *
 * MUHIM: "joylandi" deb faqat HAQIQIY havola kelganda yoziladi.
 * Havolasiz "muvaffaqiyatli" deb ko'rsatish — odamni aldash: u
 * maydonchaga kirib mahsulotini topa olmaydi.
 */

const STATUS: Record<
  ListingStatus,
  { key: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  PENDING: { key: 'listing.pending', icon: 'time-outline', color: colors.warning },
  LISTED: { key: 'listing.listed', icon: 'checkmark-circle-outline', color: colors.success },
  FAILED: { key: 'listing.failed', icon: 'alert-circle-outline', color: colors.danger },
  NOT_LISTED: { key: 'listing.empty', icon: 'ellipse-outline', color: colors.textMuted },
};

export default function ListingScreen() {
  const t = useT();
  const products = useProducts();

  if (products.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  const listings = (products.data ?? []).flatMap((p) =>
    (p.listings ?? []).map((l) => ({ product: p.title, listing: l })),
  );

  return (
    <Screen
      clear
      refreshControl={
        <RefreshControl
          refreshing={products.isFetching && !products.isLoading}
          onRefresh={() => void products.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={typography.h3}>{t('listing.title')}</Text>
      <Text style={[typography.small, { marginTop: spacing.xs }]}>{t('listing.intro')}</Text>

      {/*
        Foydalanuvchi bilishi kerak: hozir joylashtirishni odam qiladi.
        Buni yashirsak, kechikish sababini tushunmaydi.
      */}
      <InfoBanner text={t('listing.manualNote')} tone="warning" />

      {listings.length === 0 ? (
        <Card style={styles.card}>
          <Text style={typography.body}>{t('listing.empty')}</Text>
        </Card>
      ) : (
        listings.map(({ product, listing }) => {
          const s = STATUS[listing.status];
          return (
            <Card key={listing.id} style={styles.card}>
              <Text style={typography.caption}>{product}</Text>
              <View style={styles.row}>
                <Ionicons name={s.icon} size={20} color={s.color} />
                <Text style={[typography.bodyStrong, { color: s.color, flex: 1 }]}>
                  {t(s.key as never)}
                </Text>
              </View>

              {listing.errorMessage ? (
                <Text style={[typography.small, { color: colors.danger }]}>
                  {listing.errorMessage}
                </Text>
              ) : null}

              {/* Havola faqat haqiqatan joylangan bo'lsa ko'rinadi */}
              {listing.status === 'LISTED' && listing.listingUrl ? (
                <Button
                  title={t('listing.open')}
                  icon="open-outline"
                  variant="secondary"
                  onPress={() => void Linking.openURL(listing.listingUrl as string)}
                />
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
