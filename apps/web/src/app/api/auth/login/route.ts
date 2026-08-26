import { NextResponse, type NextRequest } from 'next/server';
import type { AuthResponse } from '@ecwt/contracts';
import { apiUrl, setSessionCookies } from '@/lib/session';

/**
 * Kirish. Backend tokenlarni qaytaradi, biz ularni httpOnly cookie'ga
 * yozamiz va brauzerga faqat foydalanuvchi ma'lumotini qaytaramiz —
 * token brauzer JavaScript'iga umuman yetib bormaydi.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();

  const response = await fetch(apiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const data = (await response.json()) as AuthResponse | { error: unknown };

  if (!response.ok || !('tokens' in data)) {
    return NextResponse.json(data, { status: response.status });
  }

  await setSessionCookies(data.tokens);

  return NextResponse.json({ user: data.user });
}
