import { z } from 'zod';
import { emailSchema, localeSchema, paginationQuerySchema, phoneSchema } from './common';
import { LEAD_STATUSES, type LeadStatus } from './enums';

/**
 * Lead = saytdagi "Ariza qoldirish" formasi.
 * Ochiq endpoint — rate limit va honeypot bilan himoyalangan.
 */
export const createLeadSchema = z.object({
  name: z.string().trim().min(2, 'Ismingizni kiriting').max(120),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  companyName: z.string().trim().max(200).optional(),
  productCategory: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
  locale: localeSchema.optional(),
  /** Qaysi sahifadan kelgani — marketing tahlili uchun */
  source: z.string().trim().max(120).optional(),
  /**
   * Honeypot: odam bu maydonni ko'rmaydi, bot to'ldiradi.
   * To'ldirilgan bo'lsa server jimgina 201 qaytaradi, lekin saqlamaydi.
   */
  website: z.string().max(200).optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  note: z.string().trim().max(2000).optional(),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const leadListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(LEAD_STATUSES).optional(),
  search: z.string().trim().max(120).optional(),
});
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  companyName: string | null;
  productCategory: string | null;
  message: string | null;
  locale: string;
  source: string | null;
  status: LeadStatus;
  note: string | null;
  createdAt: string;
}
