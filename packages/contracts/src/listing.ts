import { z } from 'zod';
import { moneySchema, paginationQuerySchema } from './common';
import {
  LISTING_STATUSES,
  MARKETPLACES,
  type ListingStatus,
  type Marketplace,
} from './enums';

/**
 * Listing = bitta mahsulotning bitta marketplace'dagi e'loni.
 * Narxni faqat ECWT (admin) belgilaydi — hamkor o'zi qo'ya olmaydi,
 * chunki marketplace komissiyasi, logistika va soliq hisobga olinadi.
 */
export const createListingSchema = z.object({
  productId: z.string().min(1),
  marketplace: z.enum(MARKETPLACES),
  priceUsd: moneySchema.refine((v) => v > 0, 'Narx 0 dan katta bo‘lishi kerak'),
  /** ECWT xizmat haqi foizi (0-50) */
  commissionPercent: z.number().min(0).max(50).default(15),
  notes: z.string().trim().max(1000).optional(),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = z.object({
  priceUsd: moneySchema.refine((v) => v > 0).optional(),
  commissionPercent: z.number().min(0).max(50).optional(),
  externalId: z.string().trim().max(120).optional(),
  externalUrl: z.string().url().max(600).optional(),
  notes: z.string().trim().max(1000).optional(),
});
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

/**
 * Ruxsat etilgan holat o'tishlari. Server shu jadval bo'yicha tekshiradi —
 * klient ixtiyoriy holatga o'tkaza olmaydi.
 */
export const LISTING_TRANSITIONS: Record<ListingStatus, readonly ListingStatus[]> = {
  DRAFT: ['SUBMITTED', 'ARCHIVED'],
  SUBMITTED: ['IN_REVIEW', 'REJECTED', 'DRAFT'],
  IN_REVIEW: ['LIVE', 'REJECTED'],
  LIVE: ['PAUSED', 'ARCHIVED'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  PAUSED: ['LIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionListing(from: ListingStatus, to: ListingStatus): boolean {
  return LISTING_TRANSITIONS[from].includes(to);
}

export const changeListingStatusSchema = z
  .object({
    status: z.enum(LISTING_STATUSES),
    reason: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.status !== 'REJECTED' || (v.reason && v.reason.length >= 5), {
    message: 'Rad etish sababini yozing',
    path: ['reason'],
  });
export type ChangeListingStatusInput = z.infer<typeof changeListingStatusSchema>;

export const listingListQuerySchema = paginationQuerySchema.extend({
  marketplace: z.enum(MARKETPLACES).optional(),
  status: z.enum(LISTING_STATUSES).optional(),
  productId: z.string().optional(),
  supplierId: z.string().optional(),
});
export type ListingListQuery = z.infer<typeof listingListQuerySchema>;

export interface Listing {
  id: string;
  productId: string;
  supplierId: string;
  marketplace: Marketplace;
  status: ListingStatus;
  priceUsd: number;
  commissionPercent: number;
  externalId: string | null;
  externalUrl: string | null;
  notes: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  liveAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Ro'yxatda ko'rsatish uchun qo'shimcha */
  product?: { id: string; sku: string; nameUz: string; nameEn: string; primaryImageUrl: string | null };
}
