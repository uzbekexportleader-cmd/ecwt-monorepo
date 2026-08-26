import type { Currency, PaymentStatus } from '@ecwt/contracts';

export interface CreateChargeParams {
  /** Bizning ichki to'lov ID'imiz — provayderga `order id` sifatida ketadi */
  paymentId: string;
  amount: number;
  currency: Currency;
  description: string;
  returnUrl?: string;
}

export interface CreateChargeResult {
  /** Provayderdagi to'lov identifikatori (bo'lsa) */
  providerPaymentId: string | null;
  /** Foydalanuvchini yo'naltirish manzili (Payme/Click/Uzum) */
  redirectUrl: string | null;
  /** Klient tomonda tasdiqlash uchun (Stripe) */
  clientSecret: string | null;
  expiresAt: Date | null;
}

export interface WebhookVerification {
  valid: boolean;
  /** Takroriy hodisani aniqlash uchun provayderdagi hodisa ID'si */
  externalEventId: string;
  /** Qaysi to'lovga tegishli — bizning paymentId */
  paymentId: string | null;
  providerPaymentId: string | null;
  status: PaymentStatus;
  /** Provayder xabar qilgan summa — bizdagi bilan solishtiriladi */
  amount: number | null;
  failureReason?: string;
}

export interface RawWebhook {
  headers: Record<string, string | string[] | undefined>;
  /** Imzo tekshiruvi uchun XOM tana (parse qilinmagan) */
  rawBody: Buffer;
  parsedBody: unknown;
}

/**
 * Har bir to'lov tizimi shu interfeysni bajaradi.
 *
 * Yangi provayder qo'shish uchun shu interfeysni amalga oshirib,
 * PaymentsModule dagi ro'yxatga qo'shish yetarli — qolgan kod o'zgarmaydi.
 */
export interface PaymentProviderAdapter {
  readonly name: string;
  /** Kalitlar .env da berilganmi */
  isConfigured(): boolean;
  createCharge(params: CreateChargeParams): Promise<CreateChargeResult>;
  verifyWebhook(raw: RawWebhook): WebhookVerification;
}
