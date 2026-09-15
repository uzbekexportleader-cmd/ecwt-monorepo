import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import type { ProductDto } from '@ecwt/types';

import * as Linking from 'expo-linking';

import {
  useMarketplaces,
  useProduct,
  usePublishProduct,
  useSubmitProductForReview,
} from '../../src/api/queries';
import {
  Button,
  Card,
  Chip,
  InfoBanner,
  LoadingView,
  ErrorView,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { colors, formatSom, radius, spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';

export default function ProductDetail() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useProduct(id);
  const marketplaces = useMarketplaces();
  const publish = usePublishProduct(id);
  const submitReview = useSubmitProductForReview(id);

  const [selected, setSelected] = useState<string[]>([]);

  if (product.isLoading) return <Screen><LoadingView /></Screen>;
  if (product.isError || !product.data) {
    return (
      <Screen>
        <ErrorView message="Mahsulot topilmadi" onRetry={() => void product.refetch()} />
      </Screen>
    );
  }

  const p = product.data;
  const listingByMarketplace = new Map(p.listings.map((l) => [l.marketplaceId, l]));

  /*
   * Kanalga chiqarish faqat tekshiruvdan o'tgan mahsulot uchun.
   * Qoida serverda ham bor — bu yerda tugmani o'chirish, foydalanuvchi
   * xato olishdan oldin sababni ko'rsin.
   */
  const canPublish = p.status === 'READY' || p.status === 'PUBLISHED';

  const toggle = (mid: string) =>
    setSelected((prev) => (prev.includes(mid) ? prev.filter((x) => x !== mid) : [...prev, mid]));

  const doSubmitReview = async () => {
    try {
      await submitReview.mutateAsync();
      toastSuccess(t('product.submitted'));
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('common.error'));
    }
  };

  const doPublish = async () => {
    if (!selected.length) {
      Alert.alert(t('product.selectMarketplaces'), 'Kamida bitta platformani tanlang.');
      return;
    }
    try {
      await publish.mutateAsync(selected);
      setSelected([]);
      toastSuccess('So‘rov yuborildi. Holatni quyida kuzating.');
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : 'Chiqarib bo‘lmadi');
    }
  };

  return (
    <Screen>
      {p.images.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {p.images.map((img) => (
            <Image
                key={img.id}
                source={{ uri: img.url }}
                style={styles.photo}
                contentFit="cover"
                transition={180}
                cachePolicy="memory-disk"
              />
          ))}
        </ScrollView>
      ) : null}

      <Text style={[typography.h2, { marginTop: spacing.lg }]}>{p.title}</Text>
      <Text style={[typography.h3, { color: colors.accent, marginTop: 4 }]}>{formatSom(p.price)}</Text>
      {p.description ? (
        <Text style={[typography.body, { marginTop: spacing.md }]}>{p.description}</Text>
      ) : null}

      <SectionHeader title="Xarakteristika" />
      <Card>
        <Row label={t('product.material')} value={p.material ?? '—'} />
        <Row label={t('product.weight')} value={p.weightGram ? `${p.weightGram} g` : '—'} />
        <Row
          label={t('product.size')}
          value={
            p.lengthMm && p.widthMm && p.heightMm
              ? `${p.lengthMm} × ${p.widthMm} × ${p.heightMm}`
              : '—'
          }
        />
        <Row
          label={t('product.productionDays')}
          value={p.productionDays ? `${p.productionDays} kun` : '—'}
        />
        <Row label={t('product.stock')} value={String(p.stock)} last />
      </Card>

      <SectionHeader title={t('product.reviewTitle')} />
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.statusRow}>
          <Chip label={t(`product.st.${p.status}`)} tone={statusTone(p.status)} />
        </View>

        {p.status === 'IN_REVIEW' ? (
          <Text style={typography.small}>{t('product.inReviewHint')}</Text>
        ) : null}

        {p.reviewNote ? (
          <View style={{ gap: 2 }}>
            <Text style={typography.caption}>{t('product.reviewNote')}</Text>
            <Text style={typography.body}>{p.reviewNote}</Text>
          </View>
        ) : null}

        {p.missingForReview.length ? (
          <View style={{ gap: 2 }}>
            <Text style={typography.caption}>{t('product.missingTitle')}</Text>
            {p.missingForReview.map((m) => (
              <Text key={m} style={[typography.small, { color: colors.danger }]}>
                • {m}
              </Text>
            ))}
          </View>
        ) : null}

        {p.status === 'DRAFT' || p.status === 'CHANGES_REQUESTED' ? (
          <Button
            title={t('product.submitReview')}
            icon="checkmark-done-outline"
            onPress={() => void doSubmitReview()}
            loading={submitReview.isPending}
            disabled={!p.canSubmitForReview}
          />
        ) : null}
      </Card>

      <SectionHeader title={t('channel.title')} />
      {/*
        Ochiq aytamiz: hozircha joylashtirish qo'lda bajariladi.
        Foydalanuvchi "avtomatik ulangan" deb o'ylab qolmasligi kerak.
      */}
      <InfoBanner text={t('channel.founder')} tone="info" icon="person-outline" />
      {canPublish ? null : (
        <View style={{ marginTop: spacing.sm }}>
          <InfoBanner text={t('channel.needReady')} tone="warning" />
        </View>
      )}

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {(marketplaces.data ?? []).map((m) => {
          const listing = listingByMarketplace.get(m.id);
          const active = selected.includes(m.id);
          return (
            <Pressable
              key={m.id}
              onPress={() => toggle(m.id)}
              style={[styles.mpRow, active && { borderColor: colors.primary }]}
            >
              <Text style={{ fontSize: 22 }}>{m.logoEmoji ?? '🛒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyStrong}>{m.name}</Text>
                {listing ? (
                  <Text style={typography.caption}>
                    {listing.status === 'LISTED'
                      ? t('channel.listed')
                      : listing.status === 'PENDING'
                        ? t('channel.queued')
                        : listing.errorMessage ?? t('channel.failed')}
                  </Text>
                ) : (
                  <Text style={typography.caption}>{t('channel.notListed')}</Text>
                )}
                {listing?.listingUrl ? (
                  <Text
                    style={[typography.caption, { color: colors.primary }]}
                    onPress={() => void Linking.openURL(listing.listingUrl as string)}
                  >
                    {t('channel.open')}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                name={active ? 'checkbox' : 'square-outline'}
                size={22}
                color={active ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          title={t('product.publish')}
          icon="rocket-outline"
          onPress={doPublish}
          loading={publish.isPending}
          disabled={!selected.length || !canPublish}
        />
      </View>
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={[typography.caption, { flex: 1 }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { flex: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  photo: { width: 240, height: 180, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  mpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});

/** Holat rangi: tasdiqlangan — yashil, tuzatish — sariq, qolgani — kulrang */
function statusTone(status: ProductDto['status']): 'success' | 'gold' | 'danger' | 'neutral' {
  if (status === 'READY' || status === 'PUBLISHED') return 'success';
  if (status === 'CHANGES_REQUESTED') return 'gold';
  if (status === 'ARCHIVED') return 'danger';
  return 'neutral';
}
