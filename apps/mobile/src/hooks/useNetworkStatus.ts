import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export interface NetworkStatus {
  /** Qurilma tarmoqqa ulanganmi (Wi-Fi / mobil internet) */
  isConnected: boolean;
  /**
   * Internet haqiqatan ishlayaptimi.
   *
   * Ulanish bor, lekin internet yo'q holati O'zbekistonda tez-tez uchraydi:
   * Wi-Fi ulangan, ammo to'lov tugagan yoki portalga kirish talab qilinadi.
   * Shuning uchun `isConnected` yetarli emas.
   *
   * Aniqlanmaguncha `null` — bu paytda ogohlantirish ko'rsatilmaydi, aks
   * holda ilova ochilishida bir lahza "internet yo'q" chaqnab ketadi.
   */
  isInternetReachable: boolean | null;
  /** Ogohlantirish ko'rsatilsinmi — aniq bilingan uzilish */
  isOffline: boolean;
}

const INITIAL: NetworkStatus = {
  isConnected: true,
  isInternetReachable: null,
  isOffline: false,
};

/**
 * Tarmoq holatini kuzatadi.
 *
 * NEGA KERAK: hunarmandlarning katta qismi viloyatlarda ishlaydi, u yerda
 * aloqa uzilib turadi. Uzilganini aytmasak, foydalanuvchi anketani
 * to'ldirib "Davom etish"ni bosadi va nima uchun hech nima bo'lmayotganini
 * tushunmaydi.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(INITIAL);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;

      setStatus({
        isConnected,
        isInternetReachable,
        // Faqat ANIQ bilingan uzilishda ogohlantiramiz: `null` — hali
        // tekshirilmagan, bu paytda jim turamiz
        isOffline: !isConnected || isInternetReachable === false,
      });
    });

    return unsubscribe;
  }, []);

  return status;
}
