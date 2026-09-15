import React from 'react';
import { Linking, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Text } from '../src/components/AppText';
import { useCompany, useSetCompanyLocation } from '../src/api/queries';
import { Button, Card, ErrorView, LoadingView, Screen, SectionHeader } from '../src/components/ui';
import { toastError, toastSuccess } from '../src/store/toast';
import { EcwtApiError } from '../src/api/client';
import { colors, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * Kompaniya va asoschi haqida.
 *
 * Ma'lumot serverdan keladi — telefon raqami yoki manzil o'zgarganda
 * ilovani qayta chiqarish shart emas.
 *
 * Joylashuvni faqat administrator va faqat GPS orqali belgilaydi:
 * qo'lda yozilgan manzil xaritada boshqa nuqtaga tushadi.
 */

/** Xaritada ochish uchun havola: iOS va Android turli sxema ishlatadi */
function mapUrl(lat: number, lon: number, label: string): string {
  const coords = `${lat},${lon}`;
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?ll=${coords}&q=${encodeURIComponent(label)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${coords}`;
}

export default function AboutScreen() {
  const t = useT();
  const company = useCompany();
  const setLocation = useSetCompanyLocation();

  if (company.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  if (company.isError || !company.data) {
    return (
      <Screen clear>
        <ErrorView message={t('common.error')} onRetry={() => void company.refetch()} />
      </Screen>
    );
  }

  const c = company.data;

  const call = (phone: string) => void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      toastError(t('about.locationDenied'));
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await setLocation.mutateAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      toastSuccess(t('about.locationSaved'));
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('about.locationFailed'));
    }
  };

  return (
    <Screen
      clear
      refreshControl={
        <RefreshControl
          refreshing={company.isFetching && !company.isLoading}
          onRefresh={() => void company.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={typography.h1}>{c.name}</Text>
      {c.legalName ? <Text style={typography.small}>{c.legalName}</Text> : null}
      {c.stir ? <Text style={typography.caption}>STIR: {c.stir}</Text> : null}

      {c.founderName ? (
        <>
          <SectionHeader title={t('about.founder')} />
          <Card style={{ gap: spacing.sm }}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyStrong}>{c.founderName}</Text>
                {c.founderTitle ? <Text style={typography.caption}>{c.founderTitle}</Text> : null}
              </View>
            </View>
            {c.founderBio ? <Text style={typography.body}>{c.founderBio}</Text> : null}
            {c.founderPhone ? (
              <Button
                title={c.founderPhone}
                variant="secondary"
                icon="call-outline"
                onPress={() => call(c.founderPhone as string)}
              />
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('about.support')} />
      <Card style={{ gap: spacing.sm }}>
        <Text style={typography.small}>{t('about.supportHint')}</Text>
        {c.supportPhone ? (
          <Button
            title={c.supportPhone}
            icon="headset-outline"
            onPress={() => call(c.supportPhone as string)}
          />
        ) : (
          <Text style={typography.caption}>{t('about.noPhone')}</Text>
        )}
        {c.supportTelegram ? (
          <Button
            title={c.supportTelegram}
            variant="secondary"
            icon="paper-plane-outline"
            onPress={() => void Linking.openURL(`https://t.me/${c.supportTelegram?.replace('@', '')}`)}
          />
        ) : null}
      </Card>

      <SectionHeader title={t('about.location')} />
      <Card style={{ gap: spacing.sm }}>
        {c.latitude != null && c.longitude != null ? (
          <>
            {c.addressLine ? <Text style={typography.body}>{c.addressLine}</Text> : null}
            <Text style={typography.caption}>
              {c.latitude.toFixed(6)}, {c.longitude.toFixed(6)}
            </Text>
            <Button
              title={t('about.openMap')}
              variant="secondary"
              icon="map-outline"
              onPress={() =>
                void Linking.openURL(mapUrl(c.latitude as number, c.longitude as number, c.name))
              }
            />
          </>
        ) : (
          /*
           * Manzil to'qib yozilmaydi: belgilanmagan bo'lsa shunday deyiladi.
           */
          <Text style={typography.caption}>{t('about.noLocation')}</Text>
        )}

        {c.canEdit ? (
          <Button
            title={t('about.setLocation')}
            icon="locate-outline"
            onPress={() => void captureLocation()}
            loading={setLocation.isPending}
          />
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
});
