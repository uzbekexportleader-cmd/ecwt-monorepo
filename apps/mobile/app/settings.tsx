import React from 'react';
import { Alert, View } from 'react-native';
import { Text } from '../src/components/AppText';
import Constants from 'expo-constants';
import { useQuery } from '@tanstack/react-query';

import { Button, Card, Chip, ListRow, Screen, SectionHeader } from '../src/components/ui';
import { useRouter } from 'expo-router';
import { API_URL, api } from '../src/api/client';
import { useAuthStore } from '../src/store/auth';
import { useT } from '../src/i18n';
import { LanguagePicker } from '../src/components/LanguagePicker';
import { useOnboarding } from '../src/store/onboarding';
import { toastSuccess } from '../src/store/toast';
import { RESET_ONBOARDING_ON_START } from '../src/api/client';
import { formatPhone, spacing, typography } from '../src/theme';

export default function SettingsScreen() {
  const t = useT();
  const router = useRouter();
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetForTesting = useAuthStore((s) => s.resetForTesting);
  const syncOnboarding = useAuthStore((s) => s.syncOnboarding);
  const restartOnboarding = useOnboarding((s) => s.restart);

  const confirmRestart = () => {
    Alert.alert(t('settings.restartOnboarding'), t('settings.restartConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        onPress: () => {
          void (async () => {
            await restartOnboarding();
            await syncOnboarding(false);
            toastSuccess(t('settings.restartDone'));
            router.replace('/(setup)');
          })();
        },
      },
    ]);
  };

  // Telefonda ulanish muammosini tez aniqlash uchun
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      await api.craftCategories.list();
      return true;
    },
    retry: 0,
    refetchInterval: 15_000,
  });

  const confirmReset = () => {
    Alert.alert(t('settings.resetApp'), t('settings.resetAppConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await resetForTesting();
            toastSuccess(t('settings.resetAppDone'));
            router.replace('/(auth)/welcome');
          })();
        },
      },
    ]);
  };

  const confirmLogout = () => {
    Alert.alert(t('auth.logout'), t('auth.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.logout'), style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <Screen>
      <SectionHeader title={t('settings.security')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow
          icon="finger-print-outline"
          title={t('settings.biometric')}
          subtitle={biometricEnabled ? t('settings.on') : t('settings.off')}
          onPress={() => router.push('/security')}
        />
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
        <ListRow title={t('settings.yourPhone')} subtitle={user ? formatPhone(user.phone) : '—'} />
        <ListRow title={t('settings.version')} subtitle={Constants.expoConfig?.version ?? '0.1.0'} />
        <ListRow
          title={t('settings.serverStatus')}
          subtitle={API_URL}
          right={
            <Chip
              label={
                health.isLoading
                  ? t('settings.checking')
                  : health.isSuccess
                    ? t('settings.connected')
                    : t('settings.disconnected')
              }
              tone={health.isLoading ? 'neutral' : health.isSuccess ? 'success' : 'danger'}
            />
          }
        />
      </Card>

      {health.isError ? (
        <View style={{ marginTop: spacing.lg }}>
          <Card>
            <Text style={typography.bodyStrong}>{t('settings.noServerTitle')}</Text>
            <Text style={[typography.small, { marginTop: spacing.sm }]}>
              {t('settings.noServerHint')}
            </Text>
            <View style={{ marginTop: spacing.lg }}>
              <Button
                title={t('common.retry')}
                variant="secondary"
                onPress={() => void health.refetch()}
              />
            </View>
          </Card>
        </View>
      ) : null}

      <SectionHeader title={t('settings.restartOnboarding')} />
      <Card>
        <Text style={typography.small}>{t('settings.restartHint')}</Text>
        {RESET_ONBOARDING_ON_START ? (
          <Text style={[typography.caption, { marginTop: spacing.sm }]}>
            {t('settings.testMode')}
          </Text>
        ) : null}
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={t('settings.restartOnboarding')}
            variant="secondary"
            onPress={confirmRestart}
          />
        </View>
      </Card>

      <SectionHeader title={t('settings.language')} />
      <LanguagePicker />

      <SectionHeader title={t('settings.resetApp')} />
      <Card>
        <Text style={typography.small}>{t('settings.resetAppHint')}</Text>
        <View style={{ marginTop: spacing.lg }}>
          <Button title={t('settings.resetApp')} variant="secondary" onPress={confirmReset} />
        </View>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Text style={[typography.caption, { marginBottom: spacing.md }]}>
          {t('settings.disclaimer')}
        </Text>
        <Button title={t('auth.logout')} variant="danger" onPress={confirmLogout} />
      </View>
    </Screen>
  );
}
