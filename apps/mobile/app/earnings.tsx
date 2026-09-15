import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Text } from '../src/components/AppText';
import { useEarningsSeen, useProducts, usePricingQuote } from '../src/api/queries';
import { Button, Card, ErrorView, InfoBanner, LoadingView, Screen } from '../src/components/ui';
import { colors, formatSom, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * 19-qadam: xarajatlar va taxminiy tushum.
 *
 * Hunarmand shu yerga qarab narx qo'yadi, shuning uchun bu ekranda
 * TAXMINIY son ko'rsatilmaydi. Qiymati noma'lum qator "hali ma'lum emas"
 * deb yoziladi va sof tushum umuman hisoblanmaydi — yarim hisob
 * odamni zarar bilan sotishga olib borishi mumkin.
 */

// Pul ko'rinishi butun ilovada bir xil bo'lsin — umumiy formatter
const money = (value: number) => formatSom(value);

export default function EarningsScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string }>();

  // Qadamdan kelganda mahsulot ko'rsatilmaydi — oxirgisini o'zimiz olamiz
  const products = useProducts();
  const productId = params.productId ?? products.data?.[0]?.id;

  const quote = usePricingQuote(productId);
  const seen = useEarningsSeen();

  const confirmAndGo = async () => {
    await seen.mutateAsync().catch(() => undefined);
    router.replace('/journey');
  };

  if (products.isLoading || quote.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  if (!productId) {
    return (
      <Screen clear>
        <Text style={typography.h3}>{t('earnings.title')}</Text>
        <InfoBanner text={t('earnings.noProduct')} tone="info" />
        <View style={{ marginTop: spacing.xl }}>
          <Button
            title={t('product.add')}
            icon="cube-outline"
            onPress={() => router.replace('/products/new')}
          />
        </View>
      </Screen>
    );
  }

  if (quote.isError || !quote.data) {
    return (
      <Screen clear>
        <ErrorView message={t('common.error')} onRetry={() => void quote.refetch()} />
      </Screen>
    );
  }

  const q = quote.data;

  return (
    <Screen clear>
      <Text style={typography.h3}>{q.productTitle}</Text>
      <Text style={[typography.small, { marginTop: spacing.xs }]}>{t('earnings.intro')}</Text>

      <Card style={styles.card}>
        <Row
          label={t('earnings.price')}
          value={q.priceUzs === null ? null : money(q.priceUzs)}
          strong
        />
      </Card>

      <Text style={[typography.caption, { marginTop: spacing.xl }]}>{t('earnings.costs')}</Text>
      <Card style={styles.card}>
        {q.lines.map((line, i) => (
          <View key={line.key} style={[styles.line, i > 0 && styles.divider]}>
            <Row
              label={line.label}
              value={line.amountUzs === null ? null : money(line.amountUzs)}
            />
            {line.note ? <Text style={typography.caption}>{line.note}</Text> : null}
          </View>
        ))}
      </Card>

      {/*
        Sof tushum faqat hamma qator ma'lum bo'lsa chiqadi.
        Aks holda uning o'rniga nima yetishmayotgani yoziladi.
      */}
      {q.netUzs === null ? (
        <Card style={[styles.card, { gap: spacing.sm }]}>
          <View style={styles.actorRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
            <Text style={[typography.bodyStrong, { color: colors.warning, flex: 1 }]}>
              {t('earnings.notReady')}
            </Text>
          </View>
          {q.unknowns.map((u) => (
            <Text key={u} style={typography.small}>
              • {u}
            </Text>
          ))}
        </Card>
      ) : (
        <Card style={[styles.card, { backgroundColor: colors.successSoft }]}>
          <Row label={t('earnings.net')} value={money(q.netUzs)} strong />
          <Text style={typography.caption}>{t('earnings.netHint')}</Text>
        </Card>
      )}

      <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
        <Button
          title={t('earnings.editProduct')}
          variant="secondary"
          icon="create-outline"
          onPress={() => router.push(`/products/${productId}`)}
        />
        {/*
          "Davom etish" — yo'lda keyingi qadamga o'tish. Shu bosilgani
          serverda belgilanadi, aks holda odam har safar shu ekranga
          qaytib tushaveradi.
        */}
        <Button
          title={t('common.continue')}
          icon="arrow-forward-outline"
          loading={seen.isPending}
          onPress={() => void confirmAndGo()}
        />
      </View>
    </Screen>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | null;
  strong?: boolean;
}) {
  const t = useT();
  return (
    <View style={styles.row}>
      <Text style={[strong ? typography.bodyStrong : typography.body, { flex: 1 }]}>{label}</Text>
      <Text
        style={[
          strong ? typography.bodyStrong : typography.body,
          value === null && { color: colors.textMuted },
        ]}
      >
        {value ?? t('earnings.unknown')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { gap: 2, paddingVertical: spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  actorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
