import { Injectable, Logger } from '@nestjs/common';

import type { Env } from '../../config/env';

/**
 * Elektron imzo tizimi adapteri (didox.uz).
 *
 * DIQQAT: hisob ma'lumotlari berilmagan bo'lsa adapter O'ZINI ULANGAN
 * DEB KO'RSATMAYDI. `isConfigured` `false` bo'lsa ilova shartnomani
 * "yuborildi" deb ko'rsatmaydi — foydalanuvchi shartnomani ko'radi,
 * imzolangan nusxani qo'lda yuklaydi, va bu holat ochiq aytiladi.
 *
 * Integratsiya yoqilganda ilovada hech narsa o'zgarmaydi: bir xil
 * holatlar, bir xil ekran.
 */

export interface SendForSigningResult {
  status: 'SENT' | 'UNAVAILABLE';
  externalId: string | null;
  externalUrl: string | null;
  message: string | null;
}

@Injectable()
export class ESignatureProvider {
  private readonly logger = new Logger('ESignature');

  constructor(private readonly env: Env) {}

  /** Kalitlar berilganmi */
  get isConfigured(): boolean {
    return Boolean(this.env.ESIGN_API_URL && this.env.ESIGN_API_KEY);
  }

  /**
   * Shartnomani imzoga yuborish.
   *
   * Hozircha faqat "ulanmagan" javobini qaytaradi: tizimning haqiqiy
   * so'rov formati hisob ochilgach, rasmiy hujjat bo'yicha yoziladi.
   * Taxminiy so'rov yozib qo'yilsa, u ishlamaydi va xatosi kech
   * bilinadi.
   */
  async sendForSigning(): Promise<SendForSigningResult> {
    if (!this.isConfigured) {
      return {
        status: 'UNAVAILABLE',
        externalId: null,
        externalUrl: null,
        message: 'Elektron imzo tizimi hali ulanmagan',
      };
    }

    this.logger.warn('E-imzo adapteri hali implement qilinmagan');
    return {
      status: 'UNAVAILABLE',
      externalId: null,
      externalUrl: null,
      message: 'Elektron imzo adapteri hali implement qilinmagan',
    };
  }
}
