import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';

import { useProfile, useUpdateProfile, useVerify } from '../../src/api/queries';
import { Button, Card, Chip, InfoBanner, LoadingView, Screen, SectionHeader } from '../../src/components/ui';
import { SelectField, TextField } from '../../src/components/form';
import { colors, layout, spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';

const BUSINESS_OPTIONS = [
  { value: 'NONE', label: 'Ro‘yxatdan o‘tmaganman', hint: 'Ko‘p dasturlar uchun yetarli emas' },
  { value: 'YATT', label: 'YaTT (yakka tartibdagi tadbirkor)' },
  { value: 'MCHJ', label: 'MChJ' },
  { value: 'FAMILY_ENTERPRISE', label: 'Oilaviy korxona' },
];

const MEMBERSHIP_OPTIONS = [
  { value: 'NONE', label: 'A’zo emasman' },
  { value: 'PENDING', label: 'Ariza berganman' },
  { value: 'ACTIVE', label: 'Faol a’zoman' },
  { value: 'EXPIRED', label: 'Muddati tugagan' },
];

export default function BusinessScreen() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const update = useUpdateProfile();
  const verify = useVerify();

  const [businessType, setBusinessType] = useState('NONE');
  const [stir, setStir] = useState('');
  const [membershipStatus, setMembershipStatus] = useState('NONE');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [errors, setErrors] = useState<{ stir?: string }>({});

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data;
    setBusinessType(p.businessType);
    setStir(p.stir ?? '');
    setMembershipStatus(p.membershipStatus);
    setMembershipNumber(p.membershipNumber ?? '');
  }, [profile.data]);

  const save = async () => {
    setErrors({});
    if (businessType !== 'NONE' && stir.replace(/\D/g, '').length !== 9) {
      setErrors({ stir: 'STIR 9 ta raqamdan iborat bo‘lishi kerak' });
      return;
    }
    try {
      await update.mutateAsync({
        businessType,
        stir: stir ? stir.replace(/\D/g, '') : null,
        membershipStatus,
        membershipNumber: membershipNumber || null,
      });
      toastSuccess('Tadbirkorlik ma’lumotlari saqlandi');
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
        Ko‘pchilik subsidiyalar tadbirkorlik holati va uyushma a’zoligini talab qiladi.
      </Text>

      <View style={{ gap: spacing.lg }}>
        <SelectField
          label={t('profile.businessType')}
          value={businessType}
          options={BUSINESS_OPTIONS}
          onChange={setBusinessType}
        />
        {businessType !== 'NONE' ? (
          <TextField
            label={t('profile.stir')}
            value={stir}
            onChangeText={setStir}
            keyboardType="number-pad"
            maxLength={9}
            hint="9 ta raqam"
            error={errors.stir}
          />
        ) : null}

        <SelectField
          label={t('profile.membership')}
          value={membershipStatus}
          options={MEMBERSHIP_OPTIONS}
          onChange={setMembershipStatus}
        />
        {membershipStatus !== 'NONE' ? (
          <TextField
            label={t('profile.membershipNumber')}
            value={membershipNumber}
            onChangeText={setMembershipNumber}
            placeholder="HUN-2024-00000"
            autoCapitalize="characters"
          />
        ) : null}
      </View>

      <SectionHeader title={t('profile.verification')} />
      <Card>
        <VerifyRow
          label="Tadbirkorlik holati"
          status={p?.businessVerification ?? 'NOT_STARTED'}
          onVerify={() => verify.mutate('business')}
          busy={verify.isPending}
        />
        <VerifyRow
          label="Uyushma a’zoligi"
          status={p?.membershipVerification ?? 'NOT_STARTED'}
          onVerify={() => verify.mutate('membership')}
          busy={verify.isPending}
          last
        />
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <InfoBanner
          text="Davlat reyestrlariga to‘g‘ridan-to‘g‘ri ulanish hali sozlanmagan. Hozircha guvohnomani hujjat sifatida yuklang — moderator tekshiradi."
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

export function VerifyRow({
  label,
  status,
  onVerify,
  busy,
  last,
}: {
  label: string;
  status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  onVerify: () => void;
  busy?: boolean;
  last?: boolean;
}) {
  const map = {
    VERIFIED: { label: 'Tasdiqlangan', tone: 'success' as const },
    PENDING: { label: 'Tekshirilmoqda', tone: 'warning' as const },
    FAILED: { label: 'Tasdiqlanmadi', tone: 'danger' as const },
    NOT_STARTED: { label: 'Tasdiqlanmagan', tone: 'neutral' as const },
  };
  const v = map[status];
  return (
    <View
      style={[
        layout.rowBetween,
        {
          paddingVertical: spacing.md,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={typography.body}>{label}</Text>
        <View style={{ marginTop: 4 }}>
          <Chip label={v.label} tone={v.tone} />
        </View>
      </View>
      {status !== 'VERIFIED' ? (
        <Button title="Tekshirish" variant="ghost" fullWidth={false} onPress={onVerify} loading={busy} />
      ) : null}
    </View>
  );
}
