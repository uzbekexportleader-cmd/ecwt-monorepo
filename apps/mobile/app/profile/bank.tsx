import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';

import { useProfile, useUpdateProfile, useVerify } from '../../src/api/queries';
import { Button, Card, InfoBanner, LoadingView, Screen, SectionHeader } from '../../src/components/ui';
import { TextField } from '../../src/components/form';
import { VerifyRow } from './business';
import { spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';

function groupCard(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 16);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

export default function BankScreen() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const update = useUpdateProfile();
  const verify = useVerify();

  const [holder, setHolder] = useState('');
  const [account, setAccount] = useState('');
  const [mfo, setMfo] = useState('');
  const [card, setCard] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data;
    setHolder(p.bankHolderName ?? '');
    // Server maskalangan qiymat qaytaradi — maskani inputga qo'ymaymiz
    setAccount(p.bankAccount && !p.bankAccount.includes('•') ? p.bankAccount : '');
    setMfo(p.bankMfo ?? '');
    setCard('');
  }, [profile.data]);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!holder.trim()) next.holder = 'Hisob egasining F.I.Sh. ni kiriting';
    const accDigits = account.replace(/\D/g, '');
    const cardDigits = card.replace(/\D/g, '');
    if (!accDigits && !cardDigits) next.account = 'Hisob raqami yoki karta raqamini kiriting';
    if (accDigits && accDigits.length !== 20) next.account = 'Hisob raqami 20 ta raqamdan iborat';
    if (accDigits && mfo.replace(/\D/g, '').length !== 5) next.mfo = 'MFO 5 ta raqamdan iborat';
    if (cardDigits && cardDigits.length !== 16) next.card = 'Karta raqami 16 ta raqamdan iborat';

    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await update.mutateAsync({
        bankHolderName: holder.trim(),
        bankAccount: accDigits || null,
        bankMfo: accDigits ? mfo.replace(/\D/g, '') : null,
        bankCard: cardDigits || null,
      });
      toastSuccess('Bank rekviziti saqlandi');
      router.back();
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : 'Saqlab bo‘lmadi');
    }
  };

  if (profile.isLoading) return <Screen><LoadingView /></Screen>;
  const p = profile.data;

  return (
    <Screen>
      <Text style={[typography.small, { marginBottom: spacing.lg }]}>
        Subsidiya mablag‘i shu rekvizitga o‘tkaziladi. Hisob egasi ismi profilingizdagi ism bilan mos
        bo‘lishi kerak.
      </Text>

      <View style={{ gap: spacing.lg }}>
        <TextField
          label={t('profile.bankHolder')}
          value={holder}
          onChangeText={setHolder}
          autoCapitalize="words"
          error={errors.holder}
        />
        <TextField
          label={t('profile.bankAccount')}
          value={account}
          onChangeText={setAccount}
          keyboardType="number-pad"
          maxLength={20}
          hint={p?.bankAccount?.includes('•') ? `Saqlangan: ${p.bankAccount}` : '20 ta raqam'}
          error={errors.account}
        />
        <TextField
          label={t('profile.bankMfo')}
          value={mfo}
          onChangeText={setMfo}
          keyboardType="number-pad"
          maxLength={5}
          error={errors.mfo}
        />
        <TextField
          label={t('profile.bankCard')}
          value={groupCard(card)}
          onChangeText={setCard}
          keyboardType="number-pad"
          maxLength={19}
          hint={
            p?.bankCardMasked
              ? `Saqlangan: ${p.bankCardMasked}`
              : 'Ixtiyoriy. To‘liq raqam saqlanmaydi — faqat oxirgi 4 raqam.'
          }
          error={errors.card}
        />
      </View>

      <SectionHeader title={t('profile.verification')} />
      <Card>
        <VerifyRow
          label="Bank rekviziti"
          status={p?.bankVerification ?? 'NOT_STARTED'}
          onVerify={() => verify.mutate('bank')}
          busy={verify.isPending}
          last
        />
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <InfoBanner
          text="Bank verifikatsiya API si ulanmagan — rekvizitni moderator tasdiqlaydi."
          tone="warning"
          icon="construct-outline"
        />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title={t('common.save')} onPress={save} loading={update.isPending} />
      </View>
    </Screen>
  );
}
