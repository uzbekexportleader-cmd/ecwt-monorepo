import { NextResponse, type NextRequest } from 'next/server';
import type { AuthResponse } from '@ecwt/contracts';
import { apiUrl, setSessionCookies } from '@/lib/session';

/** Ro'yxatdan o'tish — muvaffaqiyatli bo'lsa darhol sessiya ochiladi */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();

  const response = await fetch(apiUrl('/auth/register'), {
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

  return NextResponse.json({ user: data.user }, { status: 201 });
}
