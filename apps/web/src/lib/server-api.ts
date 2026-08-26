import { apiUrl, getAccessToken } from './session';

/**
 * Server komponentlari uchun API o'qish.
 *
 * Brauzerdagi `apiFetch` dan farqi: bu to'g'ridan-to'g'ri backend'ga
 * boradi (proksi kerak emas, chunki biz allaqachon serverdamiz).
 *
 * Xato bo'lsa `null` qaytaradi — sahifa qulab tushmasligi kerak,
 * o'rniga "ma'lumot yuklanmadi" holati ko'rsatiladi.
 */
export async function serverFetch<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(apiUrl(path), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}
