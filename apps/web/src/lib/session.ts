import { cookies } from 'next/headers';
import type { AuthTokens, AuthUser } from '@ecwt/contracts';

/**
 * Tokenlar `httpOnly` cookie'da saqlanadi — JavaScript ularni o'qiy olmaydi.
 *
 * Nega localStorage emas: saytda XSS zaifligi paydo bo'lsa, localStorage'dagi
 * token bir zumda o'g'irlanadi. Bu platformada bank rekvizitlari va to'lov
 * ma'lumotlari bor, shuning uchun httpOnly cookie tanlandi.
 *
 * Brauzer backend'ga to'g'ridan-to'g'ri murojaat qilmaydi: barcha so'rovlar
 * Next.js server marshruti (/api/backend/...) orqali o'tadi va token
 * serverda qo'shiladi.
 */
export const ACCESS_COOKIE = 'ecwt_at';
export const REFRESH_COOKIE = 'ecwt_rt';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export async function setSessionCookies(tokens: AuthTokens): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: tokens.expiresIn,
  });

  store.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

/** Backend manzili — faqat serverda ishlatiladi */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/**
 * Joriy foydalanuvchi. Sessiya bo'lmasa `null` — bu xato emas,
 * shunchaki tizimga kirmagan holat.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(apiUrl('/auth/me'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    return (await response.json()) as AuthUser;
  } catch {
    // Backend o'chiq bo'lsa sahifa qulab tushmasligi kerak
    return null;
  }
}
