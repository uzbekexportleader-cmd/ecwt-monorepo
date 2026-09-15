import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env';
import { SMS_PROVIDER, type SmsProvider } from './sms.provider';
import { MockSmsProvider } from './mock-sms.provider';
import { EskizSmsProvider } from './eskiz-sms.provider';
import { PlayMobileSmsProvider } from './playmobile-sms.provider';

@Module({
  providers: [
    {
      provide: SMS_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env): SmsProvider => {
        switch (env.SMS_PROVIDER) {
          case 'eskiz':
            return new EskizSmsProvider(env);
          case 'playmobile':
            return new PlayMobileSmsProvider(env);
          default:
            return new MockSmsProvider();
        }
      },
    },
  ],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
