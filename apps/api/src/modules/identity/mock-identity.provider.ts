import { Injectable, Logger } from '@nestjs/common';
import type { IdentityCheckResult, IdentityProvider } from './identity.provider';

/**
 * Development mock.
 *
 * ATAYLAB "VERIFIED" qaytarmaydi: real OneID integratsiyasi yo'q ekan,
 * shaxs tasdiqlangan deb ko'rsatish noto'g'ri bo'lar edi. Buning o'rniga
 * ariza qo'lda ko'rib chiqishga (MANUAL_REVIEW) yo'naltiriladi va
 * mobil ilovada "OneID integratsiyasi ulanmagan" deb ochiq yoziladi.
 */
@Injectable()
export class MockIdentityProvider implements IdentityProvider {
  readonly name = 'mock';
  readonly isReal = false;
  private readonly logger = new Logger('MockIdentity');

  getAuthorizationUrl(): string | null {
    return null;
  }

  async exchangeCode(): Promise<IdentityCheckResult> {
    this.logger.warn('OneID mock rejimida — shaxs avtomatik tasdiqlanmaydi');
    return {
      status: 'MANUAL_REVIEW',
      reason: 'OneID integratsiyasi ulanmagan. Shaxs moderator tomonidan qo‘lda tasdiqlanadi.',
      provider: this.name,
    };
  }

  async verifyFace(): Promise<IdentityCheckResult> {
    this.logger.warn('Yuz tekshiruvi mock rejimida — biometrik solishtirish bajarilmadi');
    return {
      status: 'MANUAL_REVIEW',
      reason:
        'Biometrik tekshiruv xizmati (MyID) ulanmagan. Suratingiz saqlandi va moderator tomonidan qo‘lda tekshiriladi.',
      provider: this.name,
    };
  }

  async verifyByPinfl(pinfl: string): Promise<IdentityCheckResult> {
    if (!/^\d{14}$/.test(pinfl)) {
      return { status: 'FAILED', reason: 'JShShIR formati noto‘g‘ri', provider: this.name };
    }
    return {
      status: 'MANUAL_REVIEW',
      reason: 'OneID integratsiyasi ulanmagan. Hujjatlaringiz moderator tomonidan tekshiriladi.',
      provider: this.name,
    };
  }
}
