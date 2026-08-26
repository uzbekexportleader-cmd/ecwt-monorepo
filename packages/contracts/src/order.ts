import { z } from 'zod';
import { moneySchema, paginationQuerySchema } from './common';
import { MARKETPLACES, ORDER_STATUSES, type Marketplace, type OrderStatus } from './enums';

/**
 * MarketplaceOrder = AQSH marketplace'ida sotilgan buyurtma.
 * Buni hamkor emas, ECWT (admin yoki import skripti) kiritadi.
 */
export const createOrderSchema = z.object({
  listingId: z.string().min(1),
  marketplace: z.enum(MARKETPLACES),
  /** Marketplace'dagi buyurtma raqami — takrorlanmasligi kerak */
  externalOrderId: z.string().trim().min(1).max(120),
  quantity: z.number().int().min(1).max(100_000),
  grossUsd: moneySchema.refine((v) => v > 0, 'Umumiy summa 0 dan katta bo‘lishi kerak'),
  marketplaceFeeUsd: moneySchema.default(0),
  shippingUsd: moneySchema.default(0),
  /** Bo'sh qoldirilsa listing'dagi commissionPercent'dan hisoblanadi */
  ecwtFeeUsd: moneySchema.optional(),
  buyerCountry: z.string().length(2).default('US'),
  placedAt: z.coerce.date(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingNumber: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/**
 * Pul taqsimoti. Faqat serverda chaqiriladi — klient hisoblagan raqamga ishonmaymiz.
 * netToSupplier = gross - marketplaceFee - shipping - ecwtFee
 */
export function calculateOrderSplit(params: {
  grossUsd: number;
  marketplaceFeeUsd: number;
  shippingUsd: number;
  commissionPercent: number;
  ecwtFeeUsdOverride?: number;
}): { ecwtFeeUsd: number; netToSupplierUsd: number } {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const ecwtFeeUsd =
    params.ecwtFeeUsdOverride !== undefined
      ? round2(params.ecwtFeeUsdOverride)
      : round2((params.grossUsd * params.commissionPercent) / 100);

  const netToSupplierUsd = round2(
    params.grossUsd - params.marketplaceFeeUsd - params.shippingUsd - ecwtFeeUsd,
  );

  return { ecwtFeeUsd, netToSupplierUsd };
}

export const orderListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(ORDER_STATUSES).optional(),
  marketplace: z.enum(MARKETPLACES).optional(),
  supplierId: z.string().optional(),
  productId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export interface MarketplaceOrder {
  id: string;
  listingId: string;
  supplierId: string;
  marketplace: Marketplace;
  externalOrderId: string;
  quantity: number;
  grossUsd: number;
  marketplaceFeeUsd: number;
  shippingUsd: number;
  ecwtFeeUsd: number;
  netToSupplierUsd: number;
  status: OrderStatus;
  buyerCountry: string;
  trackingNumber: string | null;
  payoutId: string | null;
  placedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  product?: { id: string; sku: string; nameUz: string; nameEn: string };
}

export interface SalesSummary {
  periodStart: string;
  periodEnd: string;
  ordersCount: number;
  grossUsd: number;
  netToSupplierUsd: number;
  byMarketplace: Array<{ marketplace: Marketplace; ordersCount: number; grossUsd: number }>;
  /** Kunlik grafik uchun */
  daily: Array<{ date: string; ordersCount: number; grossUsd: number }>;
}
