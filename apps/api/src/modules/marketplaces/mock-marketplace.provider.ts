import { Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ListingPayload, ListingResult, MarketplaceProvider } from './marketplace.provider';

/**
 * Mock provider.
 *
 * Real API credential yo'q — shuning uchun natija PENDING bo'ladi va
 * `isMock: true` bilan belgilanadi. UI'da "Demo rejim" deb ko'rsatiladi,
 * mahsulot haqiqatda chiqarilgan deb da'vo qilinmaydi.
 */
export class MockMarketplaceProvider implements MarketplaceProvider {
  readonly isReal = false;
  /** Mock hech qachon haqiqiy joylashtirmaydi — ish qo'lda bajariladi */
  readonly isConfigured = false;
  private readonly logger = new Logger('MockMarketplace');

  constructor(readonly code: string) {}

  async publish(payload: ListingPayload): Promise<ListingResult> {
    this.logger.warn(`${this.code}: mock rejim — "${payload.title}" haqiqatda joylanmadi`);
    return {
      status: 'PENDING',
      externalId: `mock-${this.code.toLowerCase()}-${randomUUID().slice(0, 8)}`,
      errorMessage: null,
      isMock: true,
    };
  }
}
