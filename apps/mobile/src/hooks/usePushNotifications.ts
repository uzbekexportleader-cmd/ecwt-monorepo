import { useEffect, useRef } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';

import {
  getInitialNotificationRoute,
  onNotificationTap,
  registerPushToken,
} from '../services/push';
import { useAuthStore } from '../store/auth';

/**
 * Push bildirishnomalarni ilovaga ulaydi.
 *
 * Ikki vazifa:
 *  1. Foydalanuvchi kirgach — qurilmani serverda ro'yxatga olish
 *  2. Bildirishnoma bosilganda — kerakli ekranga o'tish
 *
 * Ro'yxatga olish har safar kirishda takrorlanadi: token qurilma yangilanishi
 * yoki ilova qayta o'rnatilishida o'zgarishi mumkin.
 */
export function usePushNotifications(): void {
  const router = useRouter();
  /**
   * Navigator tayyor bo'lmaguncha yo'naltirib bo'lmaydi — push bosilib
   * ilova noldan ochilganda bu holat juda real.
   */
  const navigationReady = Boolean(useRootNavigationState()?.key);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  /** Qaysi foydalanuvchi uchun ro'yxatdan o'tilgani — hisob almashsa qayta yuboriladi */
  const registeredFor = useRef<string | null>(null);

  // 1. Qurilmani ro'yxatga olish
  useEffect(() => {
    if (!userId) {
      registeredFor.current = null;
      return;
    }
    if (registeredFor.current === userId) return;
    registeredFor.current = userId;
    void registerPushToken();
  }, [userId]);

  // 2. Bildirishnoma bosilganda o'tish
  useEffect(() => {
    if (!navigationReady) return;

    /*
     * Ilova butunlay yopiq bo'lganda bosilgan bildirishnoma — busiz ilova
     * shunchaki bosh sahifada ochilib, foydalanuvchi nima uchun bosganini
     * unutadi.
     */
    let cancelled = false;

    void getInitialNotificationRoute().then((route) => {
      if (cancelled || !route) return;
      router.push(route as never);
    });

    // Ilova ochiq yoki fonda turganda bosilgan bildirishnoma
    const unsubscribe = onNotificationTap((route) => router.push(route as never));

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router, navigationReady]);
}
