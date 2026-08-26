import Constants from 'expo-constants';
import { isApiErrorBody, type ApiErrorCode, type AuthResponse } from '@ecwt/contracts';
import { clearTokens, loadTokens, saveTokens } from './token-store';

/**
 * API manzili.
 *
 * ⚠️ Telefonda sinaganda "localhost" ISHLAMAYDI — u telefonning o'zini
 * bildiradi. Kompyuteringizning lokal IP manzilini yozing:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.5:4000/api
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: Record<string, string[]>,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  fieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Token qo'shilmaydi (kirish, ro'yxatdan o'tish) */
  skipAuth?: boolean;
  idempotencyKey?: string;
}

/** Sessiya tugaganda ilova kirish ekraniga qaytishi uchun */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

/**
 * Bir vaqtda bir nechta so'rov 401 olsa, refresh faqat BIR MARTA
 * bajarilishi kerak. Aks holda refresh token aylanishi (rotation)
 * tufayli qolganlari bekor qilingan token bilan qolib ketadi.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const tokens = await loadTokens();
      if (!tokens) return null;

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        await clearTokens();
        onSessionExpired?.();
        return null;
      }

      const data = (await response.json()) as AuthResponse;
      await saveTokens({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      });

      return data.tokens.accessToken;
    } catch {
      return null;
    } finally {
      // Keyingi 401 uchun yangi urinishga yo'l ochamiz
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const send = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

    return fetch(`${API_URL}/${path.replace(/^\//, '')}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  };

  let token: string | null = null;
  if (!options.skipAuth) {
    const tokens = await loadTokens();
    token = tokens?.accessToken ?? null;
  }

  let response: Response;

  try {
    response = await send(token);
  } catch {
    throw new ApiError('dependency_failure', 'Serverga ulanib bo‘lmadi. Internetni tekshiring.');
  }

  // Access token eskirgan bo'lsa — yangilab, bir marta qayta urinamiz
  if (response.status === 401 && !options.skipAuth) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      throw new ApiError('unauthorized', 'Sessiya tugadi, qaytadan kiring');
    }

    try {
      response = await send(newToken);
    } catch {
      throw new ApiError('dependency_failure', 'Serverga ulanib bo‘lmadi');
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload: unknown = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      throw new ApiError(
        payload.error.code,
        payload.error.message,
        payload.error.details,
        response.status,
      );
    }

    throw new ApiError('internal_error', 'Kutilmagan xato yuz berdi', undefined, response.status);
  }

  return payload as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
