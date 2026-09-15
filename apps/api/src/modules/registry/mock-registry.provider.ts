import { Injectable, Logger } from '@nestjs/common';
import type { GovernmentRegistryProvider, RegistryCheck } from './registry.provider';

/**
 * Development mock.
 *
 * Real reyestr API'lari ulanmagani uchun hech qachon "CONFIRMED" qaytarmaydi:
 * formatni tekshiradi, so'ng MANUAL_REVIEW beradi. Shunday qilib ilova
 * foydalanuvchini "tasdiqlangansiz" deb aldab qo'ymaydi — hujjat moderator
 * tomonidan ko'riladi.
 */
@Injectable()
export class MockGovernmentRegistryProvider implements GovernmentRegistryProvider {
  readonly name = 'mock';
  readonly isReal = false;
  private readonly logger = new Logger('MockRegistry');

  private manual(note: string): RegistryCheck {
    return { status: 'MANUAL_REVIEW', note, provider: this.name, checkedAt: new Date().toISOString() };
  }

  private notFound(note: string): RegistryCheck {
    return { status: 'NOT_FOUND', note, provider: this.name, checkedAt: new Date().toISOString() };
  }

  async checkBusinessRegistration(stir: string): Promise<RegistryCheck> {
    if (!/^\d{9}$/.test(stir)) {
      return this.notFound('STIR 9 ta raqamdan iborat bo‘lishi kerak');
    }
    this.logger.warn('Soliq reyestri mock rejimida');
    return this.manual(
      'Soliq qo‘mitasi reyestriga ulanish sozlanmagan. Tadbirkorlik guvohnomasini yuklang — moderator tekshiradi.',
    );
  }

  async checkTaxDebt(stir: string): Promise<RegistryCheck> {
    if (!/^\d{9}$/.test(stir)) return this.notFound('STIR formati noto‘g‘ri');
    return this.manual('Soliq qarzi bo‘yicha avtomatik tekshiruv ulanmagan.');
  }

  async checkCraftsmanMembership(pinfl: string, membershipNumber?: string): Promise<RegistryCheck> {
    if (!/^\d{14}$/.test(pinfl)) return this.notFound('JShShIR formati noto‘g‘ri');
    if (!membershipNumber) {
      return this.notFound('A’zolik raqami kiritilmagan');
    }
    return this.manual(
      '“Hunarmand” uyushmasi reyestriga ulanish sozlanmagan. A’zolik guvohnomasini yuklang.',
    );
  }
}
