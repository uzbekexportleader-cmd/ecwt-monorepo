import { z } from 'zod';
import { phoneSchema } from './common';

/**
 * Telefon tasdiqlash (OTP).
 *
 * Maqsad (`purpose`) ataylab klientdan olinmaydi: aks holda brauzerdan
 * `PASSWORD_RESET` so'rab, boshqa oqimning kodini olish mumkin bo'lardi.
 * Server har doim `PHONE_VERIFY` bilan ishlaydi.
 */
export const otpSendSchema = z.object({
  phone: phoneSchema,
});
export type OtpSendInput = z.infer<typeof otpSendSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Kod 6 ta raqamdan iborat bo‘lishi kerak'),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

/**
 * `mode` klientga nima ko'rsatishni aytadi:
 *
 * - `sent` — SMS haqiqatan yuborildi, foydalanuvchi telefoniga qaraydi;
 * - `demo` — provayder ulanmagan (`SMS_PROVIDER=NONE`), kod ekranda
 *   ko'rsatiladi. Bu xato emas, ataylab tanlangan holat.
 *
 * `demoCode` faqat `demo` rejimida to'ldiriladi. Provayder ulangan
 * bo'lsa, kod hech qachon javobga tushmaydi.
 */
export interface OtpSendResponse {
  mode: 'sent' | 'demo';
  /** Kod necha soniyadan keyin kuchini yo'qotadi */
  expiresInSeconds: number;
  /** Qayta yuborish tugmasi necha soniyadan keyin ochiladi */
  resendAfterSeconds: number;
  demoCode?: string;
}

export interface OtpVerifyResponse {
  verified: true;
}
