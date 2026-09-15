import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useMarketplaces } from '../src/api/queries';
import { Card, Chip, InfoBanner, Screen, SectionHeader } from '../src/components/ui';
import { colors, layout, radius, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

export default function ServicesScreen() {
  const t = useT();
  const router = useRouter();
  const marketplaces = useMarketplaces();

  const services = [
    {
      icon: 'ribbon-outline' as const,
      title: t('services.subsidy'),
      desc: t('services.subsidyDesc'),
      route: '/(tabs)/opportunities',
      color: colors.primary,
    },
    {
      icon: 'globe-outline' as const,
      title: t('services.export'),
      desc: t('services.exportDesc'),
      route: '/(tabs)/products',
      color: colors.accent,
    },
    {
      icon: 'chatbubbles-outline' as const,
      title: t('services.consulting'),
      desc: t('services.consultingDesc'),
      route: '/assistant',
      color: colors.info,
    },
  ];

  return (
    <Screen>
      <Text style={[typography.h2, { marginBottom: spacing.lg }]}>{t('services.title')}</Text>

      <View style={{ gap: spacing.md }}>
        {services.map((s) => (
          <Card key={s.title} onPress={() => router.push(s.route as never)}>
            <View style={[layout.row, { gap: spacing.lg }]}>
              <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name={s.icon} size={24} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyStrong}>{s.title}</Text>
                <Text style={typography.caption}>{s.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>

      <SectionHeader title={t('home.marketplaces')} />
      <InfoBanner text={t('product.mockNotice')} tone="warning" />
      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {(marketplaces.data ?? []).map((m) => (
          <View key={m.id} style={styles.mpRow}>
            <Text style={{ fontSize: 22 }}>{m.logoEmoji ?? '🛒'}</Text>
            <Text style={[typography.body, { flex: 1 }]}>{m.name}</Text>
            <Chip label={m.isMock ? 'demo' : 'ulangan'} tone={m.isMock ? 'gold' : 'success'} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
