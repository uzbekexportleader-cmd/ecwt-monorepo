'use client';

import { isApiErrorBody, type ApiErrorCode } from '@ecwt/contracts';

/**
 * Brauzer tomonidagi API klienti.
 *
 * Har doim `/api/backend/...` ga murojaat qiladi — bu Next.js server
 * marshruti bo'lib, tokenni o'zi qo'shadi. Klient token bilan umuman
 * ishlamaydi.
 */
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

  /** Formadagi maydon uchun birinchi xato matni */
  fieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** To'lov kabi takrorlanishi mumkin bo'lgan amallar uchun */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  let response: Response;

  try {
    response = await fetch(`/api/backend/${path.replace(/^\//, '')}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch {
    throw new ApiError('dependency_failure', 'Internet aloqasi yo‘q yoki server javob bermayapti');
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

/** Auth marshrutlari BFF orqali o'tadi, `/api/backend` emas */
export async function authFetch<T>(
  path: 'login' | 'register' | 'logout',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

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
