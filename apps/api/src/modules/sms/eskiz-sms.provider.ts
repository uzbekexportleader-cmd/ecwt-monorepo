import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { SmsProvider } from './sms.provider';
import type { Env } from '../../config/env';

/**
 * Eskiz.uz adapteri.
 *
 * DIQQAT: real credential (ESKIZ_EMAIL / ESKIZ_PASSWORD) berilmagan bo'lsa
 * bu provayder ATAYLAB xato qaytaradi — "ishlayapti" deb ko'rsatmaydi.
 */
@Injectable()
export class EskizSmsProvider implements SmsProvider {
  readonly name = 'eskiz';
  private readonly logger = new Logger('EskizSms');
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly env: Env) {}

  /**
   * Yuboruvchi nomi.
   *
   * Moderatsiyagacha Eskiz sinov raqami (4546) ishlatiladi; shartnoma
   * tuzilib o‘z nikingiz tasdiqlangach  orqali almashtiriladi
   * — kodga tegish shart emas.
   */
  private get baseUrl(): string {
    return this.env.ESKIZ_BASE_URL ?? 'https://notify.eskiz.uz/api';
  }

  private assertConfigured(): void {
    if (!this.env.ESKIZ_EMAIL || !this.env.ESKIZ_PASSWORD) {
      throw new ServiceUnavailableException(
        'Eskiz SMS provayderi sozlanmagan: ESKIZ_EMAIL va ESKIZ_PASSWORD kerak',
      );
    }
  }

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;
    this.assertConfigured();

    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.env.ESKIZ_EMAIL, password: this.env.ESKIZ_PASSWORD }),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException('Eskiz autentifikatsiyasi muvaffaqiyatsiz');
    }
    const data = (await res.json()) as { data?: { token?: string } };
    const token = data.data?.token;
    if (!token) throw new ServiceUnavailableException('Eskiz token qaytarmadi');

    this.token = token;
    this.tokenExpiresAt = Date.now() + 25 * 24 * 60 * 60 * 1000;
    return token;
  }

  async send(phone: string, text: string): Promise<void> {
    const token = await this.authenticate();
    const res = await fetch(`${this.baseUrl}/message/sms/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_phone: phone, message: text, from: this.env.ESKIZ_FROM }),
    });
    if (!res.ok) {
      this.logger.error(`Eskiz SMS xatosi: ${res.status}`);
      throw new ServiceUnavailableException('SMS yuborib bo‘lmadi. Keyinroq urinib ko‘ring.');
    }
  }
}
