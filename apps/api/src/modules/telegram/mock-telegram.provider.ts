import { Injectable, Logger } from '@nestjs/common';

import type { TelegramProvider, TelegramSendResult } from './telegram.provider';

/**
 * Development mock.
 *
 * ATAYLAB "yuborildi" deb ko'rsatmaydi: bot tokeni yo'q ekan, xabar hech
 * kimga bormaydi. Buni yashirish keyinchalik "nega xabar kelmadi?" degan
 * chalkashlikka olib keladi.
 */
@Injectable()
export class MockTelegramProvider implements TelegramProvider {
  readonly name = 'mock';
  readonly isReal = false;
  private readonly logger = new Logger('MockTelegram');

  async send(text: string): Promise<TelegramSendResult> {
    this.logger.warn(
      `Telegram sozlanmagan — xabar YUBORILMADI. Matn: ${text.slice(0, 120)}...`,
    );
    return {
      sent: false,
      reason: 'TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID berilmagan',
      provider: this.name,
    };
  }

  async sendPhoto(_photo: Buffer, _filename: string, caption: string): Promise<TelegramSendResult> {
    this.logger.warn(
      `Telegram sozlanmagan — rasm YUBORILMADI. Caption: ${caption.slice(0, 120)}...`,
    );
    return {
      sent: false,
      reason: 'TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID berilmagan',
      provider: this.name,
    };
  }
}
