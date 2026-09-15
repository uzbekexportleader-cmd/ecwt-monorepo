import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SmsProvider } from './sms.provider';
import type { Env } from '../../config/env';

/**
 * PlayMobile adapteri.
 * Credential berilmagan bo'lsa xato qaytaradi (mock qilmaydi).
 */
@Injectable()
export class PlayMobileSmsProvider implements SmsProvider {
  readonly name = 'playmobile';

  constructor(private readonly env: Env) {}

  async send(phone: string, text: string): Promise<void> {
    const { PLAYMOBILE_LOGIN, PLAYMOBILE_PASSWORD, PLAYMOBILE_BASE_URL } = this.env;
    if (!PLAYMOBILE_LOGIN || !PLAYMOBILE_PASSWORD || !PLAYMOBILE_BASE_URL) {
      throw new ServiceUnavailableException(
        'PlayMobile sozlanmagan: PLAYMOBILE_LOGIN, PLAYMOBILE_PASSWORD, PLAYMOBILE_BASE_URL kerak',
      );
    }
    const auth = Buffer.from(`${PLAYMOBILE_LOGIN}:${PLAYMOBILE_PASSWORD}`).toString('base64');
    const res = await fetch(`${PLAYMOBILE_BASE_URL}/broker-api/send`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ recipient: phone, 'message-id': `ecwt-${Date.now()}`, sms: { originator: '3700', content: { text } } }],
      }),
    });
    if (!res.ok) throw new ServiceUnavailableException('SMS yuborib bo‘lmadi');
  }
}
