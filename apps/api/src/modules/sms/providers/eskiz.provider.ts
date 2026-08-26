import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../../common/errors';
import type {
  SendSmsParams,
  SendSmsResult,
  SmsProviderAdapter,
} from '../sms-provider.interface';

/**
 * Eskiz.uz integratsiyasi (notify.eskiz.uz).
 *
 * Autentifikatsiya ikki bosqichli: email+parol bilan `/auth/login` ga
 * murojaat qilinadi va ~30 kun yashaydigan JWT olinadi. Token shu yerda
 * xotirada saqlanadi; 401 kelsa bir marta qayta login qilinadi. Tayyor
 * token `.env` da berilgan bo'lsa (SMS_API_TOKEN), login umuman
 * chaqirilmaydi.
 *
 * ⚠️ MUHIM: Eskiz oldindan moderatsiyadan o'tgan matnlarnigina yuboradi.
 * Yangi matn kabinetda tasdiqlanmaguncha so'rov xato qaytaradi. Matn
 * `SMS_OTP_TEMPLATE` sozlamasida turadi — tasdiqlangan variantni kodga
 * tegmasdan qo'yish uchun.
 */
@Injectable()
export class EskizProvider implements SmsProviderAdapter {
  readonly name = 'ESKIZ';
  private readonly logger = new Logger(EskizProvider.name);

  /** Login orqali olingan token — jarayon xotirasida yashaydi */
  private cachedToken: string | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    if (this.config.get<string>('SMS_API_TOKEN')) return true;

    return Boolean(
      this.config.get<string>('SMS_API_EMAIL') && this.config.get<string>('SMS_API_PASSWORD'),
    );
  }

  async send({ phone, text }: SendSmsParams): Promise<SendSmsResult> {
    // Birinchi urinish, keyin — token eskirgan bo'lsa yangilab, ikkinchisi
    let token = await this.getToken();
    let response = await this.postMessage(token, phone, text);

    if (response.status === 401) {
      this.cachedToken = null;
      token = await this.getToken();
      response = await this.postMessage(token, phone, text);
    }

    const body = await this.readBody(response);

    if (!response.ok) {
      // Eskiz xato sababini `message` da qaytaradi (masalan, moderatsiyadan
      // o'tmagan matn yoki balans yetishmasligi). Uni jurnalga yozamiz,
      // foydalanuvchiga esa umumiy xabar boradi.
      this.logger.error(
        `Eskiz SMS yuborilmadi (${response.status}): ${JSON.stringify(body).slice(0, 400)}`,
      );
      throw AppError.dependencyFailure('SMS yuborilmadi. Birozdan keyin qayta urinib ko‘ring.');
    }

    return { externalId: readId(body) };
  }

  private postMessage(token: string, phone: string, text: string): Promise<Response> {
    const form = new FormData();
    // Eskiz raqamni "+" siz, 998XXXXXXXXX ko'rinishida kutadi
    form.append('mobile_phone', phone.replace(/^\+/, ''));
    form.append('message', text);
    form.append('from', this.config.get<string>('SMS_SENDER') ?? '4546');

    return fetch(`${this.baseUrl()}/message/sms/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  }

  private async getToken(): Promise<string> {
    const manual = this.config.get<string>('SMS_API_TOKEN');
    if (manual) return manual;

    if (this.cachedToken) return this.cachedToken;

    const email = this.config.get<string>('SMS_API_EMAIL');
    const password = this.config.get<string>('SMS_API_PASSWORD');

    if (!email || !password) {
      throw AppError.dependencyFailure('SMS xizmati sozlanmagan');
    }

    const form = new FormData();
    form.append('email', email);
    form.append('password', password);

    const response = await fetch(`${this.baseUrl()}/auth/login`, { method: 'POST', body: form });
    const body = await this.readBody(response);

    if (!response.ok) {
      this.logger.error(
        `Eskiz login muvaffaqiyatsiz (${response.status}): ${JSON.stringify(body).slice(0, 300)}`,
      );
      throw AppError.dependencyFailure('SMS xizmatiga ulanib bo‘lmadi');
    }

    const token = readToken(body);
    if (!token) {
      this.logger.error('Eskiz login javobida token topilmadi');
      throw AppError.dependencyFailure('SMS xizmatiga ulanib bo‘lmadi');
    }

    this.cachedToken = token;
    return token;
  }

  private baseUrl(): string {
    const raw = this.config.get<string>('SMS_API_URL') ?? 'https://notify.eskiz.uz/api';
    return raw.replace(/\/+$/, '');
  }

  /** Eskiz xato holatlarida ham JSON qaytaradi, lekin kafolat yo'q */
  private async readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
}

/** `{ data: { token } }` yoki `{ token }` — ikkalasini ham qabul qilamiz */
function readToken(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;

  const root = body as Record<string, unknown>;
  const data = root.data;

  if (typeof data === 'object' && data !== null) {
    const token = (data as Record<string, unknown>).token;
    if (typeof token === 'string' && token.length > 0) return token;
  }

  return typeof root.token === 'string' && root.token.length > 0 ? root.token : null;
}

/** Yuborilgan xabar ID'si — `{ id }` yoki `{ data: { id } }` */
function readId(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;

  const root = body as Record<string, unknown>;
  const direct = root.id ?? (typeof root.data === 'object' && root.data !== null
    ? (root.data as Record<string, unknown>).id
    : undefined);

  if (typeof direct === 'string') return direct;
  if (typeof direct === 'number') return String(direct);
  return null;
}
