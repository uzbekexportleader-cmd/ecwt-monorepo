import { NextResponse, type NextRequest } from 'next/server';
import type { AuthResponse } from '@ecwt/contracts';
import {
  apiUrl,
  clearSessionCookies,
  getAccessToken,
  getRefreshToken,
  setSessionCookies,
} from '@/lib/session';

/**
 * Backend uchun proksi (BFF).
 *
 * Brauzer `/api/backend/products` ga murojaat qiladi, bu marshrut esa
 * cookie'dagi tokenni `Authorization` sarlavhasiga qo'yib, haqiqiy
 * backend'ga uzatadi. Token brauzer JavaScript'iga hech qachon ko'rinmaydi.
 *
 * 401 kelsa refresh token bilan bir marta yangilab, so'rovni takrorlaydi.
 */

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetPath = path.join('/');
  const search = request.nextUrl.search;

  // Tanani bir marta o'qib olamiz — qayta urinishda ham kerak bo'ladi
  const body = METHODS_WITH_BODY.has(request.method) ? await request.text() : undefined;

  let accessToken = await getAccessToken();

  let response = await forward(request, targetPath, search, body, accessToken);

  if (response.status === 401) {
    const refreshed = await tryRefresh();

    if (!refreshed) {
      await clearSessionCookies();
      return NextResponse.json(
        { error: { code: 'unauthorized', message: 'Sessiya tugadi, qaytadan kiring' } },
        { status: 401 },
      );
    }

    accessToken = refreshed;
    response = await forward(request, targetPath, search, body, accessToken);
  }

  const responseBody = await response.text();

  return new NextResponse(responseBody || null, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
    },
  });
}

async function forward(
  request: NextRequest,
  targetPath: string,
  search: string,
  body: string | undefined,
  accessToken: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': request.headers.get('content-type') ?? 'application/json',
  };

  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  // To'lov yaratishda takroriylik kaliti backend'ga yetib borishi kerak
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  return fetch(apiUrl(`/${targetPath}${search}`), {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });
}

/** Muvaffaqiyatli bo'lsa yangi access token qaytaradi */
async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = (await response.json()) as AuthResponse;
    await setSessionCookies(data.tokens);

    return data.tokens.accessToken;
  } catch {
    return null;
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
