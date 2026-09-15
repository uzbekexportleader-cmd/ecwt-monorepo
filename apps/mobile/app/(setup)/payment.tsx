import React from 'react';
import { useRouter } from 'expo-router';

import { StepScreen } from '../../src/components/StepScreen';
import { ChoiceCard } from '../../src/components/ChoiceCard';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';

/**
 * 11-qadam: to'lov usuli.
 *
 * Tanlov keyingi yo'lni belgilaydi: subsidiya tanlansa ariza jarayoni
 * boshlanadi, o'zi to'lasa to'g'ridan-to'g'ri shartnomaga o'tiladi.
 */
export default function PaymentStep() {
  const t = useT();
  const router = useRouter();
  const { draft, set, saveStep, saving } = useOnboarding();

  const next = async () => {
    if (!draft.paymentMethod) return;
    try {
      await saveStep({ paymentMethod: draft.paymentMethod }, 'CONTRACT');
      router.push('/(setup)/contract');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen
      step={7}
      backTo={'/(setup)/bank'}
      title={t('step.payment')}
      onNext={() => void next()}
      nextDisabled={!draft.paymentMethod}
      loading={saving}
    >
      <ChoiceCard
        icon="ribbon-outline"
        title={t('payment.subsidy')}
        hint={t('payment.subsidyDesc')}
        selected={draft.paymentMethod === 'SUBSIDY'}
        onPress={() => set('paymentMethod', 'SUBSIDY')}
      />
      <ChoiceCard
        icon="card-outline"
        title={t('payment.self')}
        hint={t('payment.selfDesc')}
        selected={draft.paymentMethod === 'SELF'}
        onPress={() => set('paymentMethod', 'SELF')}
      />
    </StepScreen>
  );
}
