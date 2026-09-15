import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { birthDateSchema } from '@ecwt/validation';

import { Text } from '../../src/components/AppText';
import { StepScreen } from '../../src/components/StepScreen';
import { ChoiceCard } from '../../src/components/ChoiceCard';
import { LoadingView } from '../../src/components/ui';
import { DateField, TextField } from '../../src/components/form';
import { useProfile } from '../../src/api/queries';
import { useAuthStore } from '../../src/store/auth';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import { spacing, typography } from '../../src/theme';

type Errors = Partial<Record<string, string>>;

/**
 * 5-qadam: shaxsiy ma'lumotlar.
 *
 * F.I.Sh., tug'ilgan sana, jinsi, JShShIR va pasport ma'lumotlari.
 * Bular subsidiya arizasida davlat organiga uzatiladi, shuning uchun
 * shakli qat'iy tekshiriladi.
 */
export default function PersonalStep() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const phone = useAuthStore((s) => s.user?.phone ?? '');
  const { draft, set, hydrate, saveStep, saving } = useOnboarding();
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (profile.data) hydrate(profile.data, phone);
  }, [profile.data, phone, hydrate]);

  const genderOptions = useMemo(
    () => [
      { value: 'MALE' as const, label: t('gender.male') },
      { value: 'FEMALE' as const, label: t('gender.female') },
    ],
    [t],
  );

  if (profile.isLoading) return <LoadingView label={t('common.loading')} />;

  const validate = (): Errors => {
    const next: Errors = {};
    if (draft.lastName.trim().length < 2) next.lastName = t('common.required');
    if (draft.firstName.trim().length < 2) next.firstName = t('common.required');
    if (draft.middleName.trim().length < 2) next.middleName = t('common.required');
    // Umumiy sxema: format + sana haqiqiyligi + mantiqiy yosh oralig'i.
    // Server ham xuddi shu qoidani ishlatadi, ikki xil natija chiqmaydi.
    const birth = birthDateSchema.safeParse(draft.birthDate);
    if (!birth.success) next.birthDate = birth.error.issues[0]?.message ?? 'YYYY-MM-DD';
    if (!draft.gender) next.gender = t('common.required');
    if (draft.pinfl && !/^\d{14}$/.test(draft.pinfl)) next.pinfl = '14';
    if (draft.passportSeries && !/^[A-Z]{2}$/.test(draft.passportSeries)) {
      next.passportSeries = 'AA';
    }
    if (draft.passportNumber && !/^\d{7}$/.test(draft.passportNumber)) {
      next.passportNumber = '7';
    }
    return next;
  };

  const next = async () => {
    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length) return;

    try {
      await saveStep(
        {
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          middleName: draft.middleName.trim(),
          birthDate: draft.birthDate,
          gender: draft.gender,
          ...(draft.pinfl ? { pinfl: draft.pinfl } : {}),
          ...(draft.passportSeries ? { passportSeries: draft.passportSeries } : {}),
          ...(draft.passportNumber ? { passportNumber: draft.passportNumber } : {}),
        },
        'ADDRESS',
      );
      router.push('/(setup)/address');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen step={1}
      backTo={'/(auth)/biometric-setup'} title={t('step.personal')} onNext={() => void next()} loading={saving}>
      <TextField
        label={t('profile.lastName')}
        value={draft.lastName}
        onChangeText={(v) => set('lastName', v)}
        autoCapitalize="words"
        error={errors.lastName}
      />
      <TextField
        label={t('profile.firstName')}
        value={draft.firstName}
        onChangeText={(v) => set('firstName', v)}
        autoCapitalize="words"
        error={errors.firstName}
      />
      <TextField
        label={t('profile.middleName')}
        value={draft.middleName}
        onChangeText={(v) => set('middleName', v)}
        autoCapitalize="words"
        error={errors.middleName}
      />
      <DateField
        label={t('profile.birthDate')}
        value={draft.birthDate}
        onChange={(v) => set('birthDate', v)}
        error={errors.birthDate}
      />

      <Text style={[typography.label, { marginTop: spacing.xs }]}>{t('field.gender')}</Text>
      {genderOptions.map((g) => (
        <ChoiceCard
          key={g.value}
          title={g.label}
          selected={draft.gender === g.value}
          onPress={() => set('gender', g.value)}
        />
      ))}

      <TextField
        label={t('profile.pinfl')}
        value={draft.pinfl}
        onChangeText={(v) => set('pinfl', v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={14}
        hint={t('common.optional')}
        error={errors.pinfl}
      />
      <TextField
        label={t('field.passportSeries')}
        value={draft.passportSeries}
        onChangeText={(v) => set('passportSeries', v.toUpperCase().replace(/[^A-Z]/g, ''))}
        placeholder="AA"
        maxLength={2}
        autoCapitalize="characters"
        hint={t('common.optional')}
        error={errors.passportSeries}
      />
      <TextField
        label={t('field.passportNumber')}
        value={draft.passportNumber}
        onChangeText={(v) => set('passportNumber', v.replace(/\D/g, ''))}
        placeholder="1234567"
        keyboardType="number-pad"
        maxLength={7}
        hint={t('common.optional')}
        error={errors.passportNumber}
      />
    </StepScreen>
  );
}
