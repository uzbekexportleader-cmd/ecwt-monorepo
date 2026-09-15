'use client';

import { createApiClient, EcwtApiError, type TokenStorage } from '@ecwt/api-client';
import type { AuthTokens } from '@ecwt/types';

const ACCESS_KEY = 'ecwt.admin.access';
const REFRESH_KEY = 'ecwt.admin.refresh';

const memory = new Map<string, string>();
const hasWindow = typeof window !== 'undefined';

function read(key: string): string | null {
  if (!hasWindow) return memory.get(key) ?? null;
  return window.localStorage.getItem(key);
}

function write(key: string, value: string): void {
  if (!hasWindow) {
    memory.set(key, value);
    return;
  }
  window.localStorage.setItem(key, value);
}

function remove(key: string): void {
  if (!hasWindow) {
    memory.delete(key);
    return;
  }
  window.localStorage.removeItem(key);
}

export const tokenStorage: TokenStorage = {
  getAccessToken: () => read(ACCESS_KEY),
  getRefreshToken: () => read(REFRESH_KEY),
  setTokens: (tokens: AuthTokens) => {
    write(ACCESS_KEY, tokens.accessToken);
    write(REFRESH_KEY, tokens.refreshToken);
  },
  clear: () => {
    remove(ACCESS_KEY);
    remove(REFRESH_KEY);
  },
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const api = createApiClient({
  baseUrl: API_URL,
  storage: tokenStorage,
  onSessionExpired: () => {
    if (hasWindow && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  },
});

export { EcwtApiError };

export function isAuthenticated(): boolean {
  return !!read(ACCESS_KEY);
}

/** Server qaytargan nisbiy fayl manzilini toliq URL ga aylantiradi. */
export function fileUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = API_URL.replace(/\/api\/?$/, '');
  return origin + (url.startsWith('/') ? '' : '/') + url;
}

/**
 * Hujjat faylini (pasport, selfie, shartnoma) yangi oynada ochadi.
 *
 * Bu endpoint autentifikatsiya talab qiladi — oddiy `<a href>` orqali ochib
 * bo'lmaydi, chunki brauzer navigatsiyasi Authorization header yubormaydi.
 * Shu sababli fayl avval `fetch` bilan (token bilan) olinadi, so'ng vaqtinchalik
 * blob-havola sifatida ochiladi.
 */
export async function openDocument(url: string | null | undefined): Promise<void> {
  const full = fileUrl(url);
  if (!full) throw new EcwtApiError(0, 'Hujjat manzili topilmadi');

  const fetchWith = async (token: string | null) => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(full, { headers });
  };

  let res = await fetchWith(await tokenStorage.getAccessToken());

  if (res.status === 401) {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const tokens = await api.auth.refresh(refreshToken);
        await tokenStorage.setTokens(tokens);
        res = await fetchWith(tokens.accessToken);
      } catch {
        /* pastda umumiy xato sifatida boshqariladi */
      }
    }
  }

  if (!res.ok) {
    throw new EcwtApiError(res.status, 'Hujjatni ochib bo‘lmadi');
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener');
  // Yangi oyna faylni yuklab ulgurgach xotiradan tozalanadi
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
