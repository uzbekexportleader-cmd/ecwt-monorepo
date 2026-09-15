/**
 * Telegram xabarnoma abstraksiyasi.
 *
 * ECWT rahbariyati/mutaxassisi yangi ariza haqida darhol xabar olishi uchun.
 * Real bot tokeni berilmagan bo'lsa, mock provayder ishlaydi va u
 * "yuborildi" deb ko'rsatmaydi — faqat logga yozadi.
 */
export interface TelegramSendResult {
  sent: boolean;
  reason?: string;
  provider: string;
}

export interface TelegramProvider {
  readonly name: string;
  readonly isReal: boolean;
  /** Matnli xabar yuboradi (Telegram HTML formatlash qo'llab-quvvatlanadi) */
  send(text: string): Promise<TelegramSendResult>;
  /**
   * Rasm bilan birga xabar yuboradi (caption HTML formatlashni qo'llab-quvvatlaydi).
   * Caption 1024 belgidan uzun bo'lsa, Telegram uni kesib tashlaydi — shu
   * sababli uzun caption alohida matnli xabar sifatida ham yuboriladi.
   */
  sendPhoto(photo: Buffer, filename: string, caption: string): Promise<TelegramSendResult>;
}

export const TELEGRAM_PROVIDER = 'TELEGRAM_PROVIDER';
