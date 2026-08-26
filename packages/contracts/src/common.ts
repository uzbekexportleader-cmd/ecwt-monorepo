import { z } from 'zod';
import { LOCALES } from './enums';

/** O'zbekiston telefon raqami: +998901234567 */
export const UZ_PHONE_REGEX = /^\+998\d{9}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => UZ_PHONE_REGEX.test(v), {
    message: "Telefon raqami +998XXXXXXXXX ko'rinishida bo'lishi kerak",
  });

export const emailSchema = z.string().trim().toLowerCase().email('Email manzili noto‘g‘ri');

export const localeSchema = z.enum(LOCALES);

export const cuidSchema = z.string().min(1, 'ID bo‘sh bo‘lishi mumkin emas');

/** Pul miqdori — manfiy emas, eng ko'pi bilan 2 xonali kasr */
export const moneySchema = z
  .number()
  .nonnegative('Summa manfiy bo‘lishi mumkin emas')
  .finite()
  .refine((v) => Number(v.toFixed(2)) === v, {
    message: 'Summada eng ko‘pi bilan 2 ta kasr xona bo‘lishi mumkin',
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
}

/** Barcha API xatolari shu kodlardan biriga tushadi */
export const API_ERROR_CODES = [
  'validation_error',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'dependency_failure',
  'internal_error',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    /** Foydalanuvchiga ko'rsatish xavfsiz bo'lgan xabar */
    message: string;
    /** Maydon nomi -> xato matnlari (validation_error uchun) */
    details?: Record<string, string[]>;
    /** Loglarda qidirish uchun */
    requestId?: string;
  };
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false;
  const err = (value as { error?: unknown }).error;
  if (typeof err !== 'object' || err === null) return false;
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' && (API_ERROR_CODES as readonly string[]).includes(code);
}
