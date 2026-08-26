import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SMS_PROVIDERS_TOKEN } from './sms.tokens';
import { EskizProvider } from './providers/eskiz.provider';

@Module({
  providers: [
    SmsService,
    EskizProvider,
    {
      // Yangi SMS provayderi qo'shish: adapterni yozib, shu ro'yxatga
      // qo'shing. SmsService o'zgartirilmaydi.
      provide: SMS_PROVIDERS_TOKEN,
      inject: [EskizProvider],
      useFactory: (eskiz: EskizProvider) => [eskiz],
    },
  ],
  exports: [SmsService],
})
export class SmsModule {}
