/** SMS yuborish abstraksiyasi. Yangi provayder qo'shish = shu interfeysni implement qilish. */
export interface SmsProvider {
  readonly name: string;
  /** @param phone 998XXXXXXXXX ko'rinishida */
  send(phone: string, text: string): Promise<void>;
}

export const SMS_PROVIDER = 'SMS_PROVIDER';
