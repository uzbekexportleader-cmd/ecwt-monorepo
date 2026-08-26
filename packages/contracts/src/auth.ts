import { z } from 'zod';
import { emailSchema, localeSchema, phoneSchema } from './common';
import type { UserRole, UserStatus } from './enums';

/**
 * Parol siyosati: kamida 8 belgi, harf va raqam.
 * Juda murakkab qoidalar qo'ymaymiz — foydalanuvchilar parol menejeri ishlatmaydi,
 * uzunlik + brute-force himoyasi (rate limit) samaraliroq.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak')
  .max(128, 'Parol juda uzun')
  .refine((v) => /[a-zA-Z]/.test(v), { message: 'Parolda kamida bitta harf bo‘lishi kerak' })
  .refine((v) => /\d/.test(v), { message: 'Parolda kamida bitta raqam bo‘lishi kerak' });

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Ism-familiya kiriting').max(120),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  companyName: z.string().trim().min(2, 'Kompaniya nomini kiriting').max(200),
  locale: localeSchema.optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Parolni kiriting'),
  /** Qurilmani eslab qolish uchun — mobil ilova yuboradi */
  deviceId: z.string().max(120).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Joriy parolni kiriting'),
    newPassword: passwordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'Yangi parol eskisidan farq qilishi kerak',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const requestPasswordResetSchema = z.object({ email: emailSchema });
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const confirmPasswordResetSchema = z.object({
  token: z.string().min(10),
  newPassword: passwordSchema,
});
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  locale: string;
  supplierId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Access token necha sekunddan keyin tugaydi */
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/** JWT access token ichidagi ma'lumot */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  supplierId: string | null;
  /** session id — chiqib ketganda bekor qilish uchun */
  sid: string;
  iat?: number;
  exp?: number;
}
