import { Global, Module } from '@nestjs/common';

import { SellerApplicationController } from './seller-application.controller';
import { SellerApplicationService } from './seller-application.service';

/**
 * `@Global`: arizani anketa tugaganda `artisan-profile` moduli yaratadi,
 * shuning uchun servis boshqa modullarga ham ochiq bo'lishi kerak.
 */
@Global()
@Module({
  controllers: [SellerApplicationController],
  providers: [SellerApplicationService],
  exports: [SellerApplicationService],
})
export class SellerApplicationModule {}
