import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import type { OnboardingStage } from '@ecwt/types';

import { ErrorView, LoadingView } from '../../src/components/ui';
import { useProfile } from '../../src/api/queries';
import { useAuthStore } from '../../src/store/auth';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { useT } from '../../src/i18n';

/** Qaysi bosqichda to'xtagan bo'lsa — o'sha ekran */
const ROUTE: Record<OnboardingStage, string> = {
  PERSONAL: '/(setup)/personal',
  ADDRESS: '/(setup)/address',
  ACTIVITY_TYPE: '/(setup)/activity',
  ACTIVITY_DETAILS: '/(setup)/activity-details',
  SERVICES: '/(setup)/services',
  BANK: '/(setup)/bank',
  PAYMENT: '/(setup)/payment',
  CONTRACT: '/(setup)/contract',
  DONE: '/(setup)/done',
};

/**
 * Ro'yxatdan o'tish oqimiga kirish nuqtasi.
 *
 * Serverdagi bosqichga qarab kerakli ekranga yo'naltiradi — foydalanuvchi
 * ilovani yopib qaytsa, to'xtagan joyidan davom etadi.
 */
export default function SetupEntry() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const phone = useAuthStore((s) => s.user?.phone ?? '');
  const hydrate = useOnboarding((s) => s.hydrate);

  useEffect(() => {
    if (!profile.data) return;
    hydrate(profile.data, phone);
    // Serverda kutilmagan bosqich bo'lsa (masalan ilova eskirgan va yangi
    // bosqich qo'shilgan bo'lsa) — birinchi qadamdan boshlaymiz, bo'sh
    // ekranga tushib qolmaslik uchun.
    const route = ROUTE[profile.data.onboardingStage] ?? ROUTE.PERSONAL;
    router.replace(route as never);
  }, [profile.data, phone, hydrate, router]);

  // Serverga ulanib bo'lmasa — cheksiz "yuklanmoqda" o'rniga tushunarli
  // xabar va qayta urinish tugmasi.
  if (profile.isError) {
    return (
      <ErrorView
        message={
          profile.error instanceof EcwtApiError ? profile.error.message : t('common.error')
        }
        onRetry={() => void profile.refetch()}
      />
    );
  }

  return <LoadingView label={t('common.loading')} />;
}
