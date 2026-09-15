import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '../api/client';
import { colors } from '../theme';

/**
 * Push bildirishnomalar.
 *
 * Nima uchun kerak: ariza holati o'zgargani (tasdiqlandi / hujjat talab
 * qilindi / rad etildi) — foydalanuvchi uchun eng muhim ma'lumot. Ilovani
 * qayta ochib tekshirishni kutib bo'lmaydi.
 *
 * MUHIM CHEKLOV: Android'da Expo Go SDK 53 dan boshlab push tokenini
 * bermaydi — development build kerak (`eas build --profile development`).
 * Shu sababli bu yerdagi barcha xatolar "jim" qayta ishlanadi: push
 * ishlamasligi ilovani buzmasligi kerak.
 */

/** Android'da kanal bo'lmasa bildirishnoma ko'rinmaydi */
const ANDROID_CHANNEL_ID = 'default';

/**
 * Ilova ochiq turganda bildirishnoma qanday ko'rsatilsin.
 *
 * `shouldShowBanner` + `shouldShowList` — SDK 53+ dagi nomlar (eski
 * `shouldShowAlert` o'rniga).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Push faqat haqiqiy telefonda ishlaydi.
 *
 * Web'da `expo-notifications` ning ko'p metodlari umuman mavjud emas
 * (chaqirilsa xato tashlaydi), emulyatorda esa token berilmaydi.
 */
function isPushSupported(): boolean {
  return Platform.OS !== 'web' && Device.isDevice;
}

/** EAS loyihasining identifikatori — token shusiz olinmaydi */
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'ECWT bildirishnomalari',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: colors.primary,
    // Ariza holati — kutib turilgan xabar, tebranish bilan bildiriladi
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Ruxsat so'raydi va Expo push tokenini qaytaradi.
 *
 * `null` qaytishi normal holat: emulyator, Expo Go (Android) yoki
 * foydalanuvchi ruxsat bermagan bo'lsa.
 */
export async function getPushToken(): Promise<string | null> {
  if (!isPushSupported()) return null;

  try {
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;

    if (!granted && existing.canAskAgain) {
      const asked = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      granted = asked.granted;
    }
    if (!granted) return null;

    const projectId = getProjectId();
    if (!projectId) return null;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ?? null;
  } catch {
    // Expo Go (Android) yoki tarmoq xatosi — push shunchaki ishlamaydi
    return null;
  }
}

/**
 * Qurilmani serverda ro'yxatga oladi.
 *
 * Kirgandan keyin chaqiriladi. Xato bo'lsa jim o'tadi — push yo'qligi
 * ilovadan foydalanishga to'sqinlik qilmaydi.
 */
export async function registerPushToken(): Promise<string | null> {
  const token = await getPushToken();
  if (!token) return null;

  try {
    await api.notifications.registerDevice({
      token,
      platform: Platform.OS as 'ios' | 'android' | 'web',
    });
    lastRegisteredToken = token;
    return token;
  } catch {
    return null;
  }
}

/**
 * Shu ishga tushirishda ro'yxatdan o'tgan token.
 * Chiqishda kerak bo'ladi — tokenni Expo'dan qayta so'ramaslik uchun.
 */
let lastRegisteredToken: string | null = null;

export function getLastRegisteredToken(): string | null {
  return lastRegisteredToken;
}

/**
 * Chiqishda qurilmani ro'yxatdan chiqaradi — bu telefonga endi begona
 * push kelmaydi.
 */
export async function unregisterPushToken(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await api.notifications.unregisterDevice({ token });
  } catch {
    /* chiqish baribir davom etadi */
  } finally {
    lastRegisteredToken = null;
  }
}

/**
 * Ilova yopiq bo'lganda bosilgan bildirishnoma (bo'lsa).
 *
 * Web'da `expo-notifications` ning bu metodi umuman yo'q va chaqirilsa
 * xato tashlaydi — shuning uchun platforma tekshiruvi shu yerda, bitta
 * joyda turadi.
 */
export async function getInitialNotificationRoute(): Promise<string | null> {
  if (!isPushSupported()) return null;
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response ? routeFromNotification(response) : null;
  } catch {
    return null;
  }
}

/**
 * Bildirishnoma bosilishini kuzatadi.
 * Web'da hech narsa qilmaydi va bo'sh tozalovchi qaytaradi.
 */
export function onNotificationTap(handler: (route: string) => void): () => void {
  if (!isPushSupported()) return () => {};

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = routeFromNotification(response);
    if (route) handler(route);
  });
  return () => sub.remove();
}

/** O'qilmagan bildirishnomalar sonini ilova belgisiga (badge) yozadi */
export async function setBadgeCount(count: number): Promise<void> {
  if (!isPushSupported()) return;
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    /* ba'zi launcher'lar badge'ni qo'llamaydi */
  }
}

/**
 * Bildirishnoma bosilganda ilova ichida qayerga o'tishni aniqlaydi.
 * Server `data.route` yuboradi (masalan `/applications/abc-123`).
 */
export function routeFromNotification(
  response: Notifications.NotificationResponse,
): string | null {
  const data = response.notification.request.content.data as { route?: unknown } | undefined;
  const route = data?.route;
  return typeof route === 'string' && route.startsWith('/') ? route : null;
}

export { Notifications };
