import React from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from '../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { NotificationType } from '@ecwt/types';

import { useMarkAllRead, useNotifications } from '../src/api/queries';
import { api } from '../src/api/client';
import { Button, Card, EmptyState, ErrorView, LoadingView, Screen } from '../src/components/ui';
import { toastSuccess } from '../src/store/toast';
import { colors, layout, radius, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

const ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  APPLICATION_SUBMITTED: 'paper-plane-outline',
  APPLICATION_STATUS: 'sync-outline',
  CORRECTION_REQUIRED: 'alert-circle-outline',
  APPROVED: 'checkmark-circle-outline',
  REJECTED: 'close-circle-outline',
  PAYMENT: 'card-outline',
  PROFILE: 'person-outline',
  MARKETPLACE: 'globe-outline',
  SYSTEM: 'information-circle-outline',
};

const TONES: Record<NotificationType, string> = {
  APPLICATION_SUBMITTED: colors.info,
  APPLICATION_STATUS: colors.info,
  CORRECTION_REQUIRED: colors.warning,
  APPROVED: colors.success,
  REJECTED: colors.danger,
  PAYMENT: colors.success,
  PROFILE: colors.primary,
  MARKETPLACE: colors.accent,
  SYSTEM: colors.textMuted,
};

export default function NotificationsScreen() {
  const t = useT();
  const router = useRouter();
  const query = useNotifications();
  const markAll = useMarkAllRead();

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
      {items.some((n) => !n.isRead) ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Button
            title={t('notifications.markAllRead')}
            variant="secondary"
            onPress={() => markAll.mutate(undefined, { onSuccess: () => toastSuccess('Barchasi o‘qilgan deb belgilandi') })}
            loading={markAll.isPending}
          />
        </View>
      ) : null}

      {query.isLoading ? <LoadingView /> : null}
      {query.isError ? (
        <ErrorView
          message="Bildirishnomalarni yuklab bo‘lmadi"
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {!query.isLoading && items.length === 0 ? (
        <EmptyState icon="notifications-outline" title={t('notifications.empty')} />
      ) : null}

      {items.map((n) => (
        <Pressable
          key={n.id}
          onPress={async () => {
            if (!n.isRead) await api.notifications.markRead(n.id).catch(() => undefined);
            void query.refetch();
            if (n.route) router.push(n.route as never);
          }}
        >
          <Card style={[{ marginBottom: spacing.md }, !n.isRead && styles.unread]}>
            <View style={[layout.row, { gap: spacing.md, alignItems: 'flex-start' }]}>
              <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name={ICONS[n.type]} size={20} color={TONES[n.type]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyStrong}>{n.title}</Text>
                <Text style={[typography.small, { marginTop: 2 }]}>{n.body}</Text>
                <Text style={[typography.caption, { marginTop: spacing.sm }]}>
                  {new Date(n.createdAt).toLocaleString('uz-UZ')}
                </Text>
              </View>
              {!n.isRead ? <View style={styles.dot} /> : null}
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  unread: { borderColor: colors.primary },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
