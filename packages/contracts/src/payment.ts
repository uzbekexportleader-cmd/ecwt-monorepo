import { z } from 'zod';
import { moneySchema, paginationQuerySchema } from './common';
import {
  CURRENCIES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  PROVIDER_CURRENCY,
  type Currency,
  type PaymentProvider,
  type PaymentStatus,
} from './enums';

/**
 * Payment = hamkor ECWT'ga to'laydigan xizmat haqi
 * (obuna, listing paketi, reklama byudjeti va h.k.).
 *
 * Hamkorga chiqadigan pul bu emas — u Payout.
 */
export const PAYMENT_PURPOSES = [
  'SUBSCRIPTION',
  'LISTING_PACKAGE',
  'ADVERTISING',
  'LOGISTICS',
  'OTHER',
] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const createPaymentSchema = z
  .object({
    provider: z.enum(PAYMENT_PROVIDERS),
    amount: moneySchema.refine((v) => v > 0, 'Summa 0 dan katta bo‘lishi kerak'),
    currency: z.enum(CURRENCIES),
    purpose: z.enum(PAYMENT_PURPOSES).default('OTHER'),
    description: z.string().trim().max(300).optional(),
    /** To'lovdan keyin qaytish manzili (web uchun) */
    returnUrl: z.string().url().max(600).optional(),
  })
  .refine((v) => PROVIDER_CURRENCY[v.provider] === v.currency, {
    message: 'Bu to‘lov tizimi tanlangan valyutani qo‘llab-quvvatlamaydi',
    path: ['currency'],
  });
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export interface CreatePaymentResult {
  paymentId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  /** Foydalanuvchini yo'naltirish kerak bo'lgan manzil (Payme/Click/Uzum) */
  redirectUrl: string | null;
  /** Stripe uchun — klient tomonda tasdiqlash */
  clientSecret: string | null;
  amount: number;
  currency: Currency;
  expiresAt: string | null;
}

export const paymentListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PAYMENT_STATUSES).optional(),
  provider: z.enum(PAYMENT_PROVIDERS).optional(),
  supplierId: z.string().optional(),
});
export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;

export interface Payment {
  id: string;
  supplierId: string;
  provider: PaymentProvider;
  providerPaymentId: string | null;
  purpose: PaymentPurpose;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  description: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

/**
 * To'lov holati o'tishlari. Webhook takroran kelganda ham
 * holat orqaga qaytmasligi uchun kerak.
 */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: ['AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED'],
  AUTHORIZED: ['SUCCEEDED', 'FAILED', 'CANCELLED'],
  SUCCEEDED: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  FAILED: [],
  CANCELLED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ['REFUNDED'],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true; // idempotent webhook — o'zgarish yo'q, xato ham emas
  return PAYMENT_TRANSITIONS[from].includes(to);
}

/** Yakuniy holatlar — bundan keyin webhook holatni o'zgartira olmaydi */
export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return status === 'FAILED' || status === 'CANCELLED' || status === 'REFUNDED';
}
