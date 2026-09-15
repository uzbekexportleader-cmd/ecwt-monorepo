import React from 'react';
import { useRouter } from 'expo-router';

import { StepScreen } from '../../src/components/StepScreen';
import { ChoiceCard } from '../../src/components/ChoiceCard';
import { ACTIVITY_TYPES } from '../../src/constants/onboarding';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';

/**
 * 7-qadam: siz kimsiz?
 *
 * Bu tanlov keyingi savollarni belgilaydi: hunarmandga hunar savollari,
 * qolganlariga o'z sohasiga mos yo'nalish ro'yxati chiqadi.
 */
export default function ActivityStep() {
  const t = useT();
  const router = useRouter();
  const { draft, set, saveStep, saving } = useOnboarding();

  const next = async () => {
    if (!draft.activityType) return;
    try {
      await saveStep({ activityType: draft.activityType }, 'ACTIVITY_DETAILS');
      router.push('/(setup)/activity-details');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen
      step={3}
      backTo={'/(setup)/address'}
      title={t('step.activityType')}
      onNext={() => void next()}
      nextDisabled={!draft.activityType}
      loading={saving}
    >
      {ACTIVITY_TYPES.map((option) => (
        <ChoiceCard
          key={option.value}
          title={t(option.labelKey)}
          hint={t(option.hintKey)}
          icon={option.icon}
          selected={draft.activityType === option.value}
          onPress={() => {
            set('activityType', option.value);
            // Faoliyat turi o'zgarsa oldingi soha javobi mos kelmay qoladi
            set('sectorKind', null);
            set('craftCategoryId', null);
          }}
        />
      ))}
    </StepScreen>
  );
}
