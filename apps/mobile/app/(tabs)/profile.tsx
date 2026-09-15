import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useCompletion, useProfile } from '../../src/api/queries';
import { useAuthStore } from '../../src/store/auth';
import {
  Card,
  Chip,
  ErrorView,
  ListRow,
  LoadingView,
  ProgressBar,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { colors, formatPhone, layout, radius, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function ProfileScreen() {
  const t = useT();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const profile = useProfile();
  const completion = useCompletion();

  const confirmLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <Screen>
      <Text style={[typography.h1, { marginBottom: spacing.lg }]}>{t('profile.title')}</Text>

      <Card>
        <View style={[layout.row, { gap: spacing.lg }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile.data?.firstName?.[0] ?? user?.phone.slice(-2) ?? 'E').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.h3} numberOfLines={1}>
              {[profile.data?.lastName, profile.data?.firstName].filter(Boolean).join(' ') ||
                'Ism kiritilmagan'}
            </Text>
            <Text style={typography.caption}>{user ? formatPhone(user.phone) : ''}</Text>
            {profile.data?.craftCategory ? (
              <View style={{ marginTop: spacing.sm }}>
                <Chip label={profile.data.craftCategory.nameUz} tone="info" />
              </View>
            ) : null}
          </View>
        </View>

        {completion.data ? (
          <View style={{ marginTop: spacing.lg }}>
            <View style={[layout.rowBetween, { marginBottom: spacing.sm }]}>
              <Text style={typography.caption}>{t('profile.completion')}</Text>
              <Text style={[typography.caption, { color: colors.text, fontWeight: '700' }]}>
                {completion.data.percent}%
              </Text>
            </View>
            <ProgressBar percent={completion.data.percent} height={8} />
          </View>
        ) : null}
      </Card>

      {profile.isLoading ? <LoadingView /> : null}
      {profile.isError ? (
        <ErrorView message="Profilni yuklab bo‘lmadi" onRetry={() => void profile.refetch()} />
      ) : null}

      <SectionHeader title="Profil bo‘limlari" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow
          icon="id-card-outline"
          title="Anketa"
          subtitle="Rasm, barcha ma’lumotlar va joylashuv bitta ko‘rinishda"
          onPress={() => router.push('/profile/anketa')}
        />
      </Card>

      <SectionHeader title="Boshqa" />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow
          icon="chatbubble-ellipses-outline"
          title={t('ai.title')}
          onPress={() => router.push('/assistant')}
        />
        <ListRow
          icon="notifications-outline"
          title={t('notifications.title')}
          onPress={() => router.push('/notifications')}
        />
        <ListRow
          icon="finger-print-outline"
          title="Xavfsizlik"
          subtitle="Biometrik kirish"
          onPress={() => router.push('/security')}
        />
        <ListRow
          icon="document-text-outline"
          title={t('contract.title')}
          onPress={() => router.push('/contract')}
        />
        <ListRow
          icon="information-circle-outline"
          title={t('about.title')}
          subtitle={t('about.support')}
          onPress={() => router.push('/about')}
        />
        <ListRow
          icon="settings-outline"
          title={t('settings.title')}
          onPress={() => router.push('/settings')}
        />
        <ListRow icon="log-out-outline" title={t('auth.logout')} tone="danger" onPress={confirmLogout} right={<Ionicons name="chevron-forward" size={18} color={colors.danger} />} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 24, fontWeight: '700' },
});
