import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { StepScreen } from '../../src/components/StepScreen';
import { SelectField, TextField } from '../../src/components/form';
import { REGION_OPTIONS, districtOptions } from '../../src/constants/regions';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import { formatPhone } from '../../src/theme';

type Errors = Partial<Record<string, string>>;

/**
 * 6-qadam: yashash manzili va aloqa.
 *
 * Telefon raqami oldingi bosqichdan avtomatik tushadi, lekin boshqa raqam
 * kerak bo'lsa o'zgartirish mumkin.
 */
export default function AddressStep() {
  const t = useT();
  const router = useRouter();
  const { draft, set, saveStep, saving } = useOnboarding();
  const [errors, setErrors] = useState<Errors>({});

  const districts = useMemo(() => districtOptions(draft.region), [draft.region]);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!draft.region) next.region = t('common.required');
    if (!draft.district) next.district = t('common.required');
    if (draft.mahalla.trim().length < 2) next.mahalla = t('common.required');
    if (draft.street.trim().length < 2) next.street = t('common.required');
    if (draft.houseNumber.trim().length < 1) next.houseNumber = t('common.required');
    return next;
  };

  const next = async () => {
    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length) return;

    try {
      await saveStep(
        {
          region: draft.region,
          district: draft.district,
          mahalla: draft.mahalla.trim(),
          street: draft.street.trim(),
          houseNumber: draft.houseNumber.trim(),
          address: [draft.mahalla, draft.street, draft.houseNumber].filter(Boolean).join(', '),
          ...(draft.contactPhone ? { contactPhone: draft.contactPhone } : {}),
        },
        'ACTIVITY_TYPE',
      );
      router.push('/(setup)/activity');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen step={2}
      backTo={'/(setup)/personal'} title={t('step.address')} onNext={() => void next()} loading={saving}>
      <SelectField
        label={t('profile.region')}
        value={draft.region}
        options={REGION_OPTIONS}
        onChange={(v) => {
          set('region', v);
          set('district', '');
        }}
        error={errors.region}
      />
      <SelectField
        label={t('profile.district')}
        value={draft.district}
        options={districts}
        onChange={(v) => set('district', v)}
        error={errors.district}
      />
      <TextField
        label={t('field.mahalla')}
        value={draft.mahalla}
        onChangeText={(v) => set('mahalla', v)}
        autoCapitalize="words"
        error={errors.mahalla}
      />
      <TextField
        label={t('field.street')}
        value={draft.street}
        onChangeText={(v) => set('street', v)}
        autoCapitalize="words"
        error={errors.street}
      />
      <TextField
        label={t('field.houseNumber')}
        value={draft.houseNumber}
        onChangeText={(v) => set('houseNumber', v)}
        maxLength={20}
        error={errors.houseNumber}
      />
      <TextField
        label={t('field.contactPhone')}
        value={draft.contactPhone ? formatPhone(draft.contactPhone) : ''}
        onChangeText={(v) => set('contactPhone', v.replace(/[^\d+]/g, ''))}
        keyboardType="phone-pad"
        hint={t('field.contactPhoneHint')}
      />
    </StepScreen>
  );
}
