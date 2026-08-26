import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';
import { PAYMENT_PROVIDERS_TOKEN } from './payments.tokens';
import { PaymeProvider } from './providers/payme.provider';
import { ClickProvider } from './providers/click.provider';
import { UzumProvider } from './providers/uzum.provider';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  controllers: [PaymentsController, WebhooksController],
  providers: [
    PaymentsService,
    PaymeProvider,
    ClickProvider,
    UzumProvider,
    StripeProvider,
    {
      // Yangi to'lov tizimi qo'shish: adapterni yozib, shu ro'yxatga qo'shing.
      // PaymentsService o'zgartirilmaydi.
      provide: PAYMENT_PROVIDERS_TOKEN,
      inject: [PaymeProvider, ClickProvider, UzumProvider, StripeProvider],
      useFactory: (
        payme: PaymeProvider,
        click: ClickProvider,
        uzum: UzumProvider,
        stripe: StripeProvider,
      ) => [payme, click, uzum, stripe],
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
