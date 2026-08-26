export interface SendSmsParams {
  /** Xalqaro formatda: +998XXXXXXXXX */
  phone: string;
  text: string;
}

export interface SendSmsResult {
  /** Provayderdagi xabar identifikatori — qo'llab-quvvatlash uchun kerak */
  externalId: string | null;
}

/**
 * Har bir SMS provayderi shu interfeysni bajaradi.
 *
 * To'lov provayderlaridagi bilan bir xil sxema (`PaymentProviderAdapter`):
 * yangi provayder qo'shish uchun adapter yozib, `SmsModule` dagi ro'yxatga
 * qo'shish yetarli — `SmsService` va OTP kodi o'zgarmaydi.
 */
export interface SmsProviderAdapter {
  /** `SMS_PROVIDER` qiymati bilan solishtiriladi */
  readonly name: string;
  /** Kalitlar .env da berilganmi */
  isConfigured(): boolean;
  send(params: SendSmsParams): Promise<SendSmsResult>;
}
