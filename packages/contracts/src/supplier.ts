import { z } from 'zod';
import { emailSchema, paginationQuerySchema, phoneSchema } from './common';
import { SUPPLIER_STATUSES, UZ_REGIONS, type SupplierStatus, type UzRegion } from './enums';

/** STIR (INN) — O'zbekistonda 9 raqam */
export const stirSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$/, 'STIR 9 ta raqamdan iborat bo‘lishi kerak');

/** Bank hisob raqami — 20 raqam, MFO — 5 raqam */
export const bankAccountSchema = z
  .string()
  .trim()
  .regex(/^\d{20}$/, 'Hisob raqami 20 ta raqamdan iborat bo‘lishi kerak');

export const mfoSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, 'MFO 5 ta raqamdan iborat bo‘lishi kerak');

export const updateSupplierSchema = z.object({
  companyName: z.string().trim().min(2).max(200).optional(),
  legalName: z.string().trim().min(2).max(200).optional(),
  stir: stirSchema.optional(),
  region: z.enum(UZ_REGIONS).optional(),
  district: z.string().trim().max(120).optional(),
  address: z.string().trim().max(400).optional(),
  website: z.string().trim().url('Sayt manzili noto‘g‘ri').max(200).optional().or(z.literal('')),
  descriptionUz: z.string().trim().max(2000).optional(),
  descriptionRu: z.string().trim().max(2000).optional(),
  descriptionEn: z.string().trim().max(2000).optional(),
  logoUrl: z.string().url().max(500).optional().or(z.literal('')),
  contactPhone: phoneSchema.optional(),
  contactEmail: emailSchema.optional(),
  bankName: z.string().trim().max(200).optional(),
  bankAccount: bankAccountSchema.optional(),
  mfo: mfoSchema.optional(),
  /** Yillik ishlab chiqarish quvvati — marketplace'ga chiqishdan oldin muhim */
  monthlyCapacity: z.number().int().nonnegative().max(10_000_000).optional(),
});
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

/**
 * Tekshiruvga yuborish uchun to'ldirilishi shart bo'lgan maydonlar.
 * Server tomonda ham shu ro'yxat tekshiriladi — klientga ishonmaymiz.
 */
export const SUPPLIER_REQUIRED_FOR_REVIEW = [
  'companyName',
  'legalName',
  'stir',
  'region',
  'address',
  'contactPhone',
  'contactEmail',
  'bankName',
  'bankAccount',
  'mfo',
] as const;

export const reviewSupplierSchema = z
  .object({
    status: z.enum(['VERIFIED', 'REJECTED', 'SUSPENDED']),
    reason: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.status === 'VERIFIED' || (v.reason && v.reason.length >= 5), {
    message: 'Rad etish yoki to‘xtatish sababini yozing',
    path: ['reason'],
  });
export type ReviewSupplierInput = z.infer<typeof reviewSupplierSchema>;

export const supplierListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(SUPPLIER_STATUSES).optional(),
  region: z.enum(UZ_REGIONS).optional(),
  search: z.string().trim().max(120).optional(),
});
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;

export interface Supplier {
  id: string;
  companyName: string;
  legalName: string | null;
  stir: string | null;
  region: UzRegion | null;
  district: string | null;
  address: string | null;
  website: string | null;
  descriptionUz: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  monthlyCapacity: number | null;
  status: SupplierStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  /** Hisobda turgan, hali to'lanmagan mablag' (USD) */
  balanceUsd: number;
  createdAt: string;
  /** Faqat egasi va admin ko'radi */
  bankName?: string | null;
  bankAccount?: string | null;
  mfo?: string | null;
}

export interface SupplierStats {
  productsTotal: number;
  productsApproved: number;
  listingsLive: number;
  ordersTotal: number;
  revenueUsd: number;
  pendingPayoutUsd: number;
}
