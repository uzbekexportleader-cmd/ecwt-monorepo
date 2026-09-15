import { Module } from '@nestjs/common';

import { ENV, type Env } from '../../config/env';
import { BotTelegramProvider } from './bot-telegram.provider';
import { MockTelegramProvider } from './mock-telegram.provider';
import { TELEGRAM_PROVIDER } from './telegram.provider';

/**
 * Token berilgan bo'lsa real bot, aks holda mock.
 * Tanlov ishga tushishda bir marta qilinadi va bootstrap logida ko'rinadi.
 */
@Module({
  providers: [
    {
      provide: TELEGRAM_PROVIDER,
      inject: [ENV],
      useFactory: (env: Env) =>
        env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
          ? new BotTelegramProvider(env)
          : new MockTelegramProvider(),
    },
  ],
  exports: [TELEGRAM_PROVIDER],
})
export class TelegramModule {}
