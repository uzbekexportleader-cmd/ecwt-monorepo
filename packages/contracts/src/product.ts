import { z } from 'zod';
import { moneySchema, paginationQuerySchema } from './common';
import { PRODUCT_STATUSES, type ProductStatus } from './enums';

/**
 * Mahsulot nomi/tavsifi 3 tilda saqlanadi.
 * Ingliz tili SHART — AQSH marketplace'lariga chiqarish uchun kerak.
 * Rus tili ixtiyoriy.
 */
export const productImageSchema = z.object({
  url: z.string().url('Rasm manzili noto‘g‘ri').max(600),
  sortOrder: z.number().int().min(0).max(20).default(0),
  isPrimary: z.boolean().default(false),
});
export type ProductImageInput = z.infer<typeof productImageSchema>;

export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, 'SKU kamida 2 ta belgi')
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/, 'SKU faqat harf, raqam, nuqta, tire va pastki chiziqdan iborat bo‘lsin'),
  nameUz: z.string().trim().min(2, 'Mahsulot nomini kiriting').max(200),
  nameRu: z.string().trim().max(200).optional(),
  nameEn: z.string().trim().min(2, 'Inglizcha nom shart — AQSH bozori uchun').max(200),
  descriptionUz: z.string().trim().max(5000).optional(),
  descriptionRu: z.string().trim().max(5000).optional(),
  descriptionEn: z.string().trim().max(5000).optional(),
  categoryId: z.string().optional(),
  brand: z.string().trim().max(120).optional(),
  /** Tashqi savdo tovar nomenklaturasi kodi — eksport hujjatlari uchun */
  hsCode: z
    .string()
    .trim()
    .regex(/^\d{6,10}$/, 'HS kod 6-10 ta raqamdan iborat bo‘ladi')
    .optional(),
  basePriceUzs: moneySchema.refine((v) => v > 0, 'Narx 0 dan katta bo‘lishi kerak'),
  suggestedPriceUsd: moneySchema.optional(),
  moq: z.number().int().min(1, 'Minimal partiya kamida 1').max(1_000_000).default(1),
  stock: z.number().int().min(0).max(10_000_000).default(0),
  weightGrams: z.number().int().min(1).max(50_000_000).optional(),
  lengthMm: z.number().int().min(1).max(500_000).optional(),
  widthMm: z.number().int().min(1).max(500_000).optional(),
  heightMm: z.number().int().min(1).max(500_000).optional(),
  countryOfOrigin: z.string().length(2).default('UZ'),
  images: z.array(productImageSchema).max(12, 'Eng ko‘pi 12 ta rasm').default([]),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

/** Tahrirlashda SKU o'zgarmaydi — listing'lar unga bog'langan */
export const updateProductSchema = createProductSchema.omit({ sku: true }).partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const reviewProductSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.status === 'APPROVED' || (v.reason && v.reason.length >= 5), {
    message: 'Rad etish sababini yozing',
    path: ['reason'],
  });
export type ReviewProductInput = z.infer<typeof reviewProductSchema>;

export const productListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(PRODUCT_STATUSES).optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(['createdAt', 'nameUz', 'basePriceUzs', 'stock']).default('createdAt'),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  supplierId: string;
  sku: string;
  nameUz: string;
  nameRu: string | null;
  nameEn: string;
  descriptionUz: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  categoryId: string | null;
  brand: string | null;
  hsCode: string | null;
  status: ProductStatus;
  basePriceUzs: number;
  suggestedPriceUsd: number | null;
  moq: number;
  stock: number;
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  countryOfOrigin: string;
  rejectionReason: string | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  nameUz: string;
  nameRu: string | null;
  nameEn: string;
  parentId: string | null;
}
