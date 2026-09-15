import React, { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';

import { useSubsidies } from '../../src/api/queries';
import { Card, EmptyState, ErrorView, LoadingView, Screen } from '../../src/components/ui';
import { SubsidyCard } from '../../src/components/domain';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

type Filter = 'eligible' | 'all';

export default function OpportunitiesScreen() {
  const t = useT();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('eligible');
  const query = useSubsidies();

  const all = query.data ?? [];
  const items = filter === 'eligible' ? all.filter((s) => s.eligibility.verdict !== 'NOT_ELIGIBLE') : all;

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
      <Text style={[typography.h1, { marginBottom: spacing.xs }]}>{t('subsidy.title')}</Text>
      <Text style={[typography.small, { marginBottom: spacing.lg }]}>
        Profilingiz asosida moslik hisoblanadi
      </Text>

      {/*
       * Haqiqiy, bugun mavjud yo'l: online-mahalla.uz dagi subsidiya.
       * Ro'yxatning o'zi bo'sh bo'lishi mumkin (tasdiqlanmagan shartlarni
       * to'qib yozmaymiz), shu sababli bu yo'l tepada turadi.
       */}
      <Card
        onPress={() => router.push('/subsidy/online-mahalla')}
        style={{ marginBottom: spacing.lg }}
      >
        <View style={styles.entryRow}>
          <View style={styles.entryIcon}>
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.label}>{t('mahalla.entry')}</Text>
            <Text style={typography.caption}>online-mahalla.uz</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Card>

      <View style={styles.segment}>
        {(['eligible', 'all'] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.segmentItem, active && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[
                  typography.small,
                  { fontWeight: '600', color: active ? colors.textInverse : colors.textSecondary },
                ]}
              >
                {f === 'eligible' ? 'Menga mos' : t('common.all')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? <LoadingView /> : null}
      {query.isError ? (
        <ErrorView message="Dasturlarni yuklab bo‘lmadi" onRetry={() => void query.refetch()} />
      ) : null}

      {!query.isLoading && items.length === 0 ? (
        <EmptyState
          icon="ribbon-outline"
          title="Mos dastur topilmadi"
          subtitle="Profilingizni to‘ldirsangiz, sizga mos dasturlar shu yerda paydo bo‘ladi."
          actionLabel={t('home.completeProfile')}
          onAction={() => router.push('/(tabs)/profile')}
        />
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        {items.map((s) => (
          <SubsidyCard key={s.id} subsidy={s} onPress={() => router.push(`/subsidy/${s.id}`)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
});
