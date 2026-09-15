import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createApiClient, type TokenStorage } from '@ecwt/api-client';
import type { AuthTokens } from '@ecwt/types';

const ACCESS_KEY = 'ecwt.accessToken';
const REFRESH_KEY = 'ecwt.refreshToken';
const API_PORT = 4000;

/**
 * Tokenlar xavfsiz xotirada saqlanadi (iOS Keychain / Android Keystore).
 * Web'da SecureStore yo'q — u yerda faqat sessiya davomida xotirada turadi.
 */
const memoryFallback = new Map<string, string>();
const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    memoryFallback.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return memoryFallback.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    memoryFallback.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage: TokenStorage = {
  getAccessToken: () => getItem(ACCESS_KEY),
  getRefreshToken: () => getItem(REFRESH_KEY),
  async setTokens(tokens: AuthTokens) {
    await setItem(ACCESS_KEY, tokens.accessToken);
    await setItem(REFRESH_KEY, tokens.refreshToken);
  },
  async clear() {
    await deleteItem(ACCESS_KEY);
    await deleteItem(REFRESH_KEY);
  },
};

/**
 * API manzilini aniqlash.
 *
 * 1. EXPO_PUBLIC_API_URL berilgan bo'lsa — o'sha ishlatiladi (production/EAS).
 * 2. Aks holda Expo Go qaysi kompyuterga ulangan bo'lsa, o'sha IP olinadi.
 *    Ya'ni real telefonda hech narsa sozlash shart emas: Metro qaysi IP orqali
 *    ochilgan bo'lsa (masalan 192.168.100.5:8081), API ham shu IP:4000 bo'ladi.
 * 3. Hech narsa topilmasa — localhost (emulyator/web uchun).
 */
function resolveApiUrl(): string {
  /*
   * WEB birinchi navbatda o'z manzilidan kelib chiqadi.
   *
   * Sahifa qaysi manzildan ochilgan bo'lsa, API ham o'sha yerda:
   * proksi orqali berilganda `<origin>/api`, lokal ishlab chiqishda esa
   * `localhost:4000`. Bu `EXPO_PUBLIC_API_URL` dan USTUN turadi, chunki
   * o'sha o'zgaruvchi telefon uchun tashqi tunnel manziliga qo'yiladi —
   * u brauzerdan ochilmasligi mumkin, holbuki sahifaning o'z manzili
   * har doim ishlaydi.
   */
  if (isWeb && typeof window !== 'undefined' && window.location?.origin) {
    const { origin, hostname } = window.location;
    // Lokal ishlab chiqishda Metro va API alohida portlarda turadi
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:${API_PORT}/api`;
    }
    return `${origin}/api`;
  }

  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost ??
    '';
  const host = hostUri.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}/api`;
  }
  return `http://localhost:${API_PORT}/api`;
}

export const API_URL = resolveApiUrl();

/**
 * Sinov rejimi: ilova har ochilganda ro'yxatdan o'tish birinchi qadamdan
 * boshlanadi. Oqimni qayta-qayta sinab ko'rish uchun.
 *
 * `.env` da `EXPO_PUBLIC_RESET_ONBOARDING=1` bo'lsa yoqiladi. Ishlab
 * chiqarishda bu o'zgaruvchi bo'lmaydi — foydalanuvchi ro'yxatdan o'ta
 * olmay qolmasin.
 */
export const RESET_ONBOARDING_ON_START = process.env.EXPO_PUBLIC_RESET_ONBOARDING === '1';

/** Server qaytargan nisbiy fayl manzilini to'liq URL ga aylantiradi. */
export function fileUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = API_URL.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

let onSessionExpired: (() => void) | undefined;

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

export const api = createApiClient({
  baseUrl: API_URL,
  storage: tokenStorage,
  onSessionExpired: () => onSessionExpired?.(),
});

export { EcwtApiError } from '@ecwt/api-client';
