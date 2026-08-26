import { z } from 'zod';
import { paginationQuerySchema } from './common';
import { PAYOUT_STATUSES, type PayoutStatus } from './enums';

/**
 * Payout = ECWT'dan hamkorga to'lanadigan pul.
 * Yetkazib berilgan (DELIVERED) buyurtmalar bo'yicha yig'iladi.
 */
export const createPayoutSchema = z.object({
  supplierId: z.string().min(1),
  /** Qaysi buyurtmalar shu to'lovga kiradi */
  orderIds: z.array(z.string().min(1)).min(1, 'Kamida bitta buyurtma tanlang').max(500),
  /** UZS ga o'tkazish kursi. Bo'sh bo'lsa faqat USD yoziladi */
  exchangeRate: z.number().positive().max(1_000_000).optional(),
  note: z.string().trim().max(500).optional(),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

export const markPayoutPaidSchema = z.object({
  reference: z.string().trim().min(1, 'To‘lov hujjati raqamini kiriting').max(120),
  paidAt: z.coerce.date().optional(),
});
export type MarkPayoutPaidInput = z.infer<typeof markPayoutPaidSchema>;

export const failPayoutSchema = z.object({
  reason: z.string().trim().min(5, 'Sababni yozing').max(500),
});
export type FailPayoutInput = z.infer<typeof failPayoutSchema>;

export const PAYOUT_TRANSITIONS: Record<PayoutStatus, readonly PayoutStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PAID', 'FAILED'],
  PAID: [],
  FAILED: ['PROCESSING', 'CANCELLED'],
  CANCELLED: [],
};

export function canTransitionPayout(from: PayoutStatus, to: PayoutStatus): boolean {
  return PAYOUT_TRANSITIONS[from].includes(to);
}

export const payoutListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PAYOUT_STATUSES).optional(),
  supplierId: z.string().optional(),
});
export type PayoutListQuery = z.infer<typeof payoutListQuerySchema>;

export interface Payout {
  id: string;
  supplierId: string;
  reference: string | null;
  amountUsd: number;
  amountUzs: number | null;
  exchangeRate: number | null;
  status: PayoutStatus;
  ordersCount: number;
  periodStart: string | null;
  periodEnd: string | null;
  note: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}
