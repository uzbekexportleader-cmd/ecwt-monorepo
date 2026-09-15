import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text } from '../src/components/AppText';
import { useProducts, useSaveListingContent } from '../src/api/queries';
import { Button, Card, InfoBanner, LoadingView, Screen } from '../src/components/ui';
import { TextField } from '../src/components/form';
import { toastError, toastSuccess } from '../src/store/toast';
import { EcwtApiError } from '../src/api/client';
import { colors, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * 20-qadam: xalqaro e'lon matni.
 *
 * Amazon va eBay'da e'lon inglizcha bo'ladi. Hunarmandning o'zbekcha
 * tavsifini o'sha yerga qo'yib bo'lmaydi — xaridor tushunmaydi.
 *
 * Ikki yo'l: o'zi yozadi yoki ECWT tayyorlaydi. Ikkinchisi tanlansa
 * qadam kutish holatiga o'tadi va bu ekranga qaytish shart emas.
 */

export default function ContentScreen() {
  const t = useT();
  const router = useRouter();
  const products = useProducts();
  const save = useSaveListingContent();

  // Tayyor mahsulot — e'lon aynan shunga yoziladi
  const product =
    products.data?.find((p) => p.status === 'READY' || p.status === 'PUBLISHED') ??
    products.data?.[0];

  const [titleEn, setTitleEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (products.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen clear>
        <InfoBanner text={t('content.noProduct')} tone="info" />
      </Screen>
    );
  }

  const submitOwn = async () => {
    const next: Record<string, string> = {};
    if (titleEn.trim().length < 10) next.title = t('content.titleShort');
    if (descriptionEn.trim().length < 30) next.description = t('content.descShort');
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await save.mutateAsync({
        productId: product.id,
        titleEn: titleEn.trim(),
        descriptionEn: descriptionEn.trim(),
      });
      toastSuccess(t('content.saved'));
      router.replace('/journey');
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('common.error'));
    }
  };

  const askEcwt = async () => {
    try {
      await save.mutateAsync({ productId: product.id, byEcwt: true });
      toastSuccess(t('content.askedEcwt'));
      router.replace('/journey');
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('common.error'));
    }
  };

  return (
    <Screen clear>
      <Text style={typography.h3}>{t('content.title')}</Text>
      <Text style={[typography.small, { marginTop: spacing.xs }]}>{t('content.intro')}</Text>

      {/* O'zbekcha matn yonida tursin — tarjima qilish osonlashadi */}
      <Card style={styles.card}>
        <Text style={typography.caption}>{t('content.yourText')}</Text>
        <Text style={typography.bodyStrong}>{product.title}</Text>
        {product.description ? (
          <Text style={[typography.small, { marginTop: spacing.xs }]}>{product.description}</Text>
        ) : null}
      </Card>

      <Card style={[styles.card, { gap: spacing.md }]}>
        <View style={styles.row}>
          <Ionicons name="language-outline" size={20} color={colors.primary} />
          <Text style={[typography.bodyStrong, { flex: 1 }]}>{t('content.writeSelf')}</Text>
        </View>

        <TextField
          label={t('content.titleEn')}
          value={titleEn}
          onChangeText={setTitleEn}
          placeholder="Handmade Bukhara Ceramic Bowl"
          error={errors.title}
        />
        <TextField
          label={t('content.descEn')}
          value={descriptionEn}
          onChangeText={setDescriptionEn}
          placeholder="Hand-thrown and hand-painted ceramic bowl..."
          multiline
          error={errors.description}
        />
        <Button
          title={t('common.save')}
          icon="checkmark-outline"
          onPress={() => void submitOwn()}
          loading={save.isPending}
        />
      </Card>

      <Card style={[styles.card, { gap: spacing.sm }]}>
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.info} />
          <Text style={[typography.bodyStrong, { flex: 1 }]}>{t('content.byEcwt')}</Text>
        </View>
        <Text style={typography.small}>{t('content.byEcwtHint')}</Text>
        <Button
          title={t('content.askEcwt')}
          variant="secondary"
          icon="headset-outline"
          onPress={() => void askEcwt()}
          loading={save.isPending}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
