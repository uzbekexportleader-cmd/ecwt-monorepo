import { Injectable, Logger } from '@nestjs/common';
import type { SmsProvider } from './sms.provider';

/**
 * Development uchun. SMS yuborilmaydi — konsolga yoziladi.
 * Productionda ISHLATILMAYDI (env.SMS_PROVIDER=mock faqat dev uchun).
 */
@Injectable()
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock';
  private readonly logger = new Logger('MockSms');

  async send(phone: string, text: string): Promise<void> {
    this.logger.log(`[MOCK SMS] ${phone}: ${text}`);
  }
}
