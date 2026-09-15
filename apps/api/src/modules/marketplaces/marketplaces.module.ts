import { Module } from '@nestjs/common';
import { MARKETPLACES } from '@ecwt/config';

import { ENV, type Env } from '../../config/env';
import { MarketplacesController } from './marketplaces.controller';
import { MarketplacesService } from './marketplaces.service';
import { MARKETPLACE_REGISTRY, type MarketplaceProvider } from './marketplace.provider';
import { MockMarketplaceProvider } from './mock-marketplace.provider';
import {
  AmazonMarketplaceProvider,
  EbayMarketplaceProvider,
  WalmartMarketplaceProvider,
} from './real-marketplace.provider';

@Module({
  controllers: [MarketplacesController],
  providers: [
    {
      provide: MARKETPLACE_REGISTRY,
      inject: [ENV],
      useFactory: (env: Env): Map<string, MarketplaceProvider> => {
        const map = new Map<string, MarketplaceProvider>();
        for (const m of MARKETPLACES) map.set(m.code, new MockMarketplaceProvider(m.code));

        // Real adapterlar faqat MARKETPLACE_PROVIDER=real bo'lganda ulanadi.
        // Credential bo'lmasa ular ochiq xato qaytaradi (mock qilmaydi).
        if (env.MARKETPLACE_PROVIDER === 'real') {
          map.set('AMAZON', new AmazonMarketplaceProvider('AMAZON', {}));
          map.set('EBAY', new EbayMarketplaceProvider('EBAY', {}));
          map.set('WALMART', new WalmartMarketplaceProvider('WALMART', {}));
        }
        return map;
      },
    },
    MarketplacesService,
  ],
  exports: [MarketplacesService, MARKETPLACE_REGISTRY],
})
export class MarketplacesModule {}
