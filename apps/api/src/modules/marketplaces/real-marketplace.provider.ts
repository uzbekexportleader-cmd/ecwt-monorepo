import { Logger } from '@nestjs/common';
import type { ListingResult, MarketplaceProvider } from './marketplace.provider';

/**
 * Real marketplace adapterlari uchun umumiy karkas
 * (Amazon SP-API, eBay Sell API, Walmart Marketplace API va h.k.).
 *
 * Har bir platforma uchun `publish` metodi to'ldiriladi. Credential
 * berilmagan bo'lsa FAILED qaytaradi — hech qachon "joylandi" demaydi.
 */
export abstract class BaseRealMarketplaceProvider implements MarketplaceProvider {
  readonly isReal = true;
  protected readonly logger: Logger;

  /** Credential berilmagan bo'lsa avtomatik joylashtirish ishlamaydi */
  get isConfigured(): boolean {
    return Boolean(this.credentials.clientId && this.credentials.clientSecret);
  }

  constructor(
    readonly code: string,
    protected readonly credentials: { clientId?: string; clientSecret?: string },
  ) {
    this.logger = new Logger(`${code}Marketplace`);
  }

  protected missingCredentials(): ListingResult {
    return {
      status: 'FAILED',
      externalId: null,
      errorMessage: `${this.code} integratsiyasi sozlanmagan: API credential kerak`,
      isMock: false,
    };
  }

  protected notImplemented(api: string): ListingResult {
    return {
      status: 'FAILED',
      externalId: null,
      errorMessage: `${api} adapteri hali implement qilinmagan`,
      isMock: false,
    };
  }

  abstract publish(): Promise<ListingResult>;
}

export class AmazonMarketplaceProvider extends BaseRealMarketplaceProvider {
  async publish(): Promise<ListingResult> {
    if (!this.credentials.clientId || !this.credentials.clientSecret) return this.missingCredentials();
    return this.notImplemented('Amazon SP-API');
  }
}

export class EbayMarketplaceProvider extends BaseRealMarketplaceProvider {
  async publish(): Promise<ListingResult> {
    if (!this.credentials.clientId || !this.credentials.clientSecret) return this.missingCredentials();
    return this.notImplemented('eBay Sell API');
  }
}

export class WalmartMarketplaceProvider extends BaseRealMarketplaceProvider {
  async publish(): Promise<ListingResult> {
    if (!this.credentials.clientId || !this.credentials.clientSecret) return this.missingCredentials();
    return this.notImplemented('Walmart Marketplace API');
  }
}
