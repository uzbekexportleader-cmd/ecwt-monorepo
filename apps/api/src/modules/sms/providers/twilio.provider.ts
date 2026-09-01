import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../../common/errors';
import type {
  SendSmsParams,
  SendSmsResult,
  SmsProviderAdapter,
} from '../sms-provider.interface';

/**
 * Twilio integratsiyasi (api.twilio.com).
 *
 * Eskiz'dan farqli o'laroq bu yerda login bosqichi yo'q: har so'rov
 * Basic auth bilan imzolanadi (AccountSid:AuthToken), shuning uchun
 * token keshlash ham kerak emas.
 *
 * Nega kerak: Eskiz faqat yuridik shaxslarga ochiladi va matn
 * moderatsiyadan o'tishi shart — demo uchun bu juda sekin. Twilio esa
 * bir necha daqiqada ishga tushadi. Uzoq muddatda O'zbekiston uchun
 * Eskiz arzonroq (95 so'm), shuning uchun ikkalasi yonma-yon turadi va
 * `SMS_PROVIDER` bilan almashtiriladi.
 *
 * ⚠️ Sinov (trial) hisobi ikki cheklov qo'yadi:
 *   1. SMS faqat kabinetda tasdiqlangan raqamlarga ketadi;
 *   2. matn boshiga "Sent from your Twilio trial account -" qo'shiladi.
 * Ikkalasi ham hisob to'ldirilgach yo'qoladi.
 *
 * `TWILIO_FROM` ikki xil bo'lishi mumkin: raqam (+1...) yoki Messaging
 * Service identifikatori (MG bilan boshlanadi). Twilio ularni turli
 * maydonda kutadi, shuning uchun prefiksga qarab ajratamiz.
 */
@Injectable()
export class TwilioProvider implements SmsProviderAdapter {
  readonly name = 'TWILIO';
  private readonly logger = new Logger(TwilioProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('TWILIO_ACCOUNT_SID') &&
        this.config.get<string>('TWILIO_AUTH_TOKEN') &&
        this.config.get<string>('TWILIO_FROM'),
    );
  }

  async send({ phone, text }: SendSmsParams): Promise<SendSmsResult> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_FROM');

    if (!accountSid || !authToken || !from) {
      throw AppError.dependencyFailure('SMS xizmati sozlanmagan');
    }

    const form = new URLSearchParams();
    // Twilio raqamni "+" bilan, E.164 ko'rinishida kutadi — Eskiz'ning
    // aksi. Kelayotgan qiymat allaqachon shunday, baribir kafolatlaymiz.
    form.set('To', phone.startsWith('+') ? phone : `+${phone}`);
    form.set('Body', text);
    form.set(from.startsWith('MG') ? 'MessagingServiceSid' : 'From', from);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      },
    );

    const body = await this.readBody(response);

    if (!response.ok) {
      // Twilio sababni `code` + `message` da qaytaradi (masalan, 21608 —
      // raqam trial hisobida tasdiqlanmagan). Jurnalga to'liq yozamiz,
      // foydalanuvchiga umumiy xabar boradi.
      this.logger.error(
        `Twilio SMS yuborilmadi (${response.status}): ${JSON.stringify(body).slice(0, 400)}`,
      );
      throw AppError.dependencyFailure('SMS yuborilmadi. Birozdan keyin qayta urinib ko‘ring.');
    }

    // 201 qaytdi, lekin Twilio xabarni keyin rad etishi mumkin. `failed`
    // holati darhol ko'rinsa — jimgina "yuborildi" demaymiz.
    const status = readField(body, 'status');
    if (status === 'failed' || status === 'undelivered') {
      this.logger.error(`Twilio xabarni rad etdi: ${JSON.stringify(body).slice(0, 400)}`);
      throw AppError.dependencyFailure('SMS yuborilmadi. Birozdan keyin qayta urinib ko‘ring.');
    }

    return { externalId: readField(body, 'sid') };
  }

  /** Twilio xato holatlarida ham JSON qaytaradi, lekin kafolat yo'q */
  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
}

/** Javobdagi matnli maydon — bo'lmasa `null` */
function readField(body: unknown, key: string): string | null {
  if (typeof body !== 'object' || body === null) return null;

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
