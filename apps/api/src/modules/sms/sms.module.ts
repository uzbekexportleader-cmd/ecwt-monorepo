import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SMS_PROVIDERS_TOKEN } from './sms.tokens';
import { EskizProvider } from './providers/eskiz.provider';
import { TwilioProvider } from './providers/twilio.provider';

@Module({
  providers: [
    SmsService,
    EskizProvider,
    TwilioProvider,
    {
      // Yangi SMS provayderi qo'shish: adapterni yozib, shu ro'yxatga
      // qo'shing. SmsService o'zgartirilmaydi.
      provide: SMS_PROVIDERS_TOKEN,
      inject: [EskizProvider, TwilioProvider],
      useFactory: (eskiz: EskizProvider, twilio: TwilioProvider) => [eskiz, twilio],
    },
  ],
  exports: [SmsService],
})
export class SmsModule {}
