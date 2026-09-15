import React from 'react';
import { View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';

import { useProfile, useVerify } from '../../src/api/queries';
import { toastInfo } from '../../src/store/toast';
import { Button, Card, InfoBanner, LoadingView, Screen, SectionHeader } from '../../src/components/ui';
import { VerifyRow } from './business';
import { spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function VerificationScreen() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const verify = useVerify();

  if (profile.isLoading) return <Screen><LoadingView /></Screen>;
  const p = profile.data;

  return (
    <Screen>
      <Text style={[typography.small, { marginBottom: spacing.lg }]}>
        Tasdiqlangan ma’lumotlar arizalarning tezroq ko‘rib chiqilishiga yordam beradi.
      </Text>

      <Card>
        <VerifyRow
          label="Shaxs (JShShIR)"
          status={p?.identityVerification ?? 'NOT_STARTED'}
          onVerify={() => verify.mutate('identity', { onSuccess: () => toastInfo('So‘rov yuborildi — natija profilda ko‘rinadi') })}
          busy={verify.isPending}
        />
        <VerifyRow
          label="Tadbirkorlik holati"
          status={p?.businessVerification ?? 'NOT_STARTED'}
          onVerify={() => verify.mutate('business', { onSuccess: () => toastInfo('So‘rov yuborildi — natija profilda ko‘rinadi') })}
          busy={verify.isPending}
        />
        <VerifyRow
          label="Uyushma a’zoligi"
          status={p?.membershipVerification ?? 'NOT_STARTED'}
          onVerify={() => verify.mutate('membership', { onSuccess: () => toastInfo('So‘rov yuborildi — natija profilda ko‘rinadi') })}
          busy={verify.isPending}
        />
        <VerifyRow
          label="Bank rekviziti"
          status={p?.bankVerification ?? 'NOT_STARTED'}
          onVerify={() => verify.mutate('bank', { onSuccess: () => toastInfo('So‘rov yuborildi — natija profilda ko‘rinadi') })}
          busy={verify.isPending}
          last
        />
      </Card>

      <SectionHeader title="Integratsiyalar holati" />
      <View style={{ gap: spacing.md }}>
        <InfoBanner
          text="OneID: ulanmagan. Shaxs moderator tomonidan qo‘lda tasdiqlanadi."
          tone="warning"
          icon="construct-outline"
        />
        <InfoBanner
          text="Soliq qo‘mitasi reyestri: ulanmagan. Tadbirkorlik guvohnomasini yuklang."
          tone="warning"
          icon="construct-outline"
        />
        <InfoBanner
          text="“Hunarmand” uyushmasi reyestri: ulanmagan. A’zolik guvohnomasini yuklang."
          tone="warning"
          icon="construct-outline"
        />
        <InfoBanner
          text="E-IMZO: ulanmagan. Ariza ilova ichida tasdiqlanadi."
          tone="warning"
          icon="construct-outline"
        />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          title={t('documents.upload')}
          variant="secondary"
          icon="cloud-upload-outline"
          onPress={() => router.push('/profile/documents')}
        />
      </View>
    </Screen>
  );
}
