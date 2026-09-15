import React from 'react';
import { RefreshControl, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';
import { needsUserAction } from '@ecwt/types';

import { Ionicons } from '@expo/vector-icons';

import { useApplications, useSellerApplication } from '../../src/api/queries';
import { Card, EmptyState, ErrorView, LoadingView, Screen, SectionHeader } from '../../src/components/ui';
import { ApplicationCard } from '../../src/components/domain';
import { colors, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function ApplicationsScreen() {
  const t = useT();
  const router = useRouter();
  const query = useApplications();
  const seller = useSellerApplication();

  const all = query.data ?? [];
  const needsAction = all.filter((a) => needsUserAction(a.status));
  const inProgress = all.filter(
    (a) => !needsUserAction(a.status) && !['PAID', 'REJECTED', 'CANCELLED'].includes(a.status),
  );
  const finished = all.filter((a) => ['PAID', 'REJECTED', 'CANCELLED'].includes(a.status));

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
      <Text style={[typography.h1, { marginBottom: spacing.lg }]}>{t('application.title')}</Text>

      {/*
        Sotuvchi arizasi — hunarmandning BIRINCHI va eng muhim arizasi.
        Ilgari u faqat yakuniy ekranda ko'rinardi va bu bo'lim "arizangiz
        yo'q" deb turardi: odam arizasi yo'qolgan deb o'ylardi.
      */}
      {seller.data ? (
        <Card onPress={() => router.push('/application')} style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ionicons name="storefront-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={typography.label}>{t('application.seller')}</Text>
              <Text style={typography.caption}>
                {seller.data.number} · {t(`app.st.${seller.data.status}`)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Card>
      ) : null}

      {query.isLoading ? <LoadingView /> : null}
      {query.isError ? (
        <ErrorView message="Arizalarni yuklab bo‘lmadi" onRetry={() => void query.refetch()} />
      ) : null}

      {!query.isLoading && all.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={t('application.empty')}
          subtitle="Imkoniyatlar bo‘limidan mos dasturni tanlab ariza bering."
          actionLabel={t('subsidy.title')}
          onAction={() => router.push('/(tabs)/opportunities')}
        />
      ) : null}

      {needsAction.length ? (
        <View>
          <SectionHeader title="Sizdan harakat kutilmoqda" />
          {needsAction.map((a) => (
            <ApplicationCard
              key={a.id}
              application={a}
              onPress={() =>
                a.status === 'DRAFT'
                  ? router.push(`/apply/${a.id}`)
                  : router.push(`/applications/${a.id}`)
              }
            />
          ))}
        </View>
      ) : null}

      {inProgress.length ? (
        <View>
          <SectionHeader title="Ko‘rib chiqilmoqda" />
          {inProgress.map((a) => (
            <ApplicationCard
              key={a.id}
              application={a}
              onPress={() => router.push(`/applications/${a.id}`)}
            />
          ))}
        </View>
      ) : null}

      {finished.length ? (
        <View>
          <SectionHeader title="Yakunlangan" />
          {finished.map((a) => (
            <ApplicationCard
              key={a.id}
              application={a}
              onPress={() => router.push(`/applications/${a.id}`)}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
