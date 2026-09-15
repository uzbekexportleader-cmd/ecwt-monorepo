import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import { StepScreen } from '../../src/components/StepScreen';
import { InfoBanner } from '../../src/components/ui';
import { TextField } from '../../src/components/form';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';

type Errors = Partial<Record<string, string>>;

/**
 * 10-qadam: bank rekvizitlari.
 *
 * Karta raqami so'ralmaydi — subsidiya va to'lovlar hisob raqami orqali
 * o'tadi, karta ma'lumotini saqlash keraksiz xavf tug'diradi.
 */
export default function BankStep() {
  const t = useT();
  const router = useRouter();
  const { draft, set, saveStep, saving } = useOnboarding();
  const [errors, setErrors] = useState<Errors>({});

  const validate = (): Errors => {
    const next: Errors = {};
    /*
     * Hisob raqami allaqachon saqlangan bo'lsa, uni qayta terish shart emas.
     *
     * Server raqamni maskalab qaytaradi, shu sababli maydon bo'sh keladi;
     * bo'sh qoldirilsa eski qiymat o'zgarishsiz qoladi.
     */
    if (draft.bankAccountSaved && !draft.bankAccount) {
      // o'zgartirilmadi
    } else if (!/^\d{20}$/.test(draft.bankAccount)) {
      next.bankAccount = '20';
    }
    /*
     * STIR faqat YATT/yuridik shaxsda majburiy.
     *
     * Ro'yxatdan o'tmagan hunarmandda STIR umuman bo'lmaydi — uni talab
     * qilish odamni shu qadamda to'xtatib qo'yardi. Kiritilgan bo'lsa
     * shakli baribir tekshiriladi.
     */
    if (draft.hasYatt) {
      if (!/^\d{9}$/.test(draft.stir)) next.stir = '9';
      if (draft.organizationName.trim().length < 2) {
        next.organizationName = t('common.required');
      }
    } else if (draft.stir && !/^\d{9}$/.test(draft.stir)) {
      next.stir = '9';
    }
    if (!/^\d{5}$/.test(draft.bankMfo)) next.bankMfo = '5';
    if (draft.bankName.trim().length < 2) next.bankName = t('common.required');
    if (draft.bankSwift && !/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(draft.bankSwift)) {
      next.bankSwift = 'SWIFT';
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
          ...(draft.bankAccount ? { bankAccount: draft.bankAccount } : {}),
          // Bo'sh STIR yuborilmaydi: server uni 9 xonali deb tekshiradi
          ...(draft.stir ? { stir: draft.stir } : {}),
          ...(draft.hasYatt ? { organizationName: draft.organizationName.trim() } : {}),
          bankMfo: draft.bankMfo,
          bankName: draft.bankName.trim(),
          ...(draft.bankSwift ? { bankSwift: draft.bankSwift } : {}),
        },
        'PAYMENT',
      );
      router.push('/(setup)/payment');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen step={6}
      backTo={'/(setup)/services'} title={t('step.bank')} onNext={() => void next()} loading={saving}>
      <TextField
        label={t('profile.bankAccount')}
        value={draft.bankAccount}
        onChangeText={(v) => set('bankAccount', v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={20}
        placeholder="20 ta raqam"
        hint={draft.bankAccountSaved ? `${t('bank.saved')}: ${draft.bankAccountSaved}` : undefined}
        error={errors.bankAccount}
      />
      <TextField
        label={t('profile.stir')}
        value={draft.stir}
        onChangeText={(v) => set('stir', v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={9}
        placeholder="9 ta raqam"
        hint={draft.hasYatt ? undefined : t('common.optional')}
        error={errors.stir}
      />
      {/*
       * Tashkilot nomi — YATT/yuridik shaxslar uchun.
       *
       * Subsidiya arizasida (online-mahalla.uz) shu nom aynan ustavdagidek
       * so'raladi; keyin qidirib yurmaslik uchun shu yerda so'raymiz.
       */}
      {draft.hasYatt ? (
        <TextField
          label={t('profile.organizationName')}
          value={draft.organizationName}
          onChangeText={(v) => set('organizationName', v)}
          error={errors.organizationName}
        />
      ) : null}
      <TextField
        label={t('profile.bankMfo')}
        value={draft.bankMfo}
        onChangeText={(v) => set('bankMfo', v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={5}
        placeholder="5 ta raqam"
        error={errors.bankMfo}
      />
      <TextField
        label={t('field.bankSwift')}
        value={draft.bankSwift}
        onChangeText={(v) => set('bankSwift', v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={11}
        autoCapitalize="characters"
        hint={t('common.optional')}
        error={errors.bankSwift}
      />
      <TextField
        label={t('field.bankName')}
        value={draft.bankName}
        onChangeText={(v) => set('bankName', v)}
        autoCapitalize="words"
        error={errors.bankName}
      />

      <InfoBanner text={t('bank.securityNote')} tone="info" icon="lock-closed-outline" />
    </StepScreen>
  );
}
