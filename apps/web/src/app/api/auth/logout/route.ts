import { NextResponse } from 'next/server';
import { apiUrl, clearSessionCookies, getAccessToken } from '@/lib/session';

/**
 * Chiqish. Backend'dagi sessiyani ham yopamiz — shunda refresh token
 * boshqa hech qachon ishlamaydi.
 */
export async function POST(): Promise<NextResponse> {
  const token = await getAccessToken();

  if (token) {
    try {
      await fetch(apiUrl('/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    } catch {
      // Backend javob bermasa ham cookie'ni tozalaymiz —
      // foydalanuvchi baribir chiqishi kerak
    }
  }

  await clearSessionCookies();

  return NextResponse.json({ ok: true });
}
