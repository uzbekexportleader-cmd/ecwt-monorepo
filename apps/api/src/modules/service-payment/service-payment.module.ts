import { Global, Module } from '@nestjs/common';

import { ServicePaymentController } from './service-payment.controller';
import { ServicePaymentService } from './service-payment.service';

/**
 * `@Global`: savdo bo'limlarini ochish qoidasi boshqa modullarga ham
 * kerak (mahsulot, kanalga chiqarish), shuning uchun servis hamma joyda
 * ochiq bo'lishi kerak.
 */
@Global()
@Module({
  controllers: [ServicePaymentController],
  providers: [ServicePaymentService],
  exports: [ServicePaymentService],
})
export class ServicePaymentModule {}
