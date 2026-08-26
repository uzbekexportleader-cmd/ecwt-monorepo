import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { OtpPurpose } from '@prisma/client';
import type { OtpSendResponse } from '@ecwt/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { AppError } from '../../common/errors';

const CODE_LENGTH = 6;

/**
 * Telefonni SMS orqali tasdiqlash.
 *
 * Kod xotirada emas, `otp_codes` jadvalida saqlanadi: server qayta
 * ishga tushsa ham foydalanuvchi kodni qaytadan so'ramaydi, va bir
 * nechta nusxada ishlaganda ham bitta manba qoladi.
 *
 * Kod ochiq saqlanmaydi. Argon2 emas, HMAC-SHA256 ishlatiladi: endpoint
 * ochiq, argon2'ning 19 MiB xotirasi esa har bir tekshiruvda sarflansa
 * xotira orqali DoS yo'li ochilardi. Kalit serverda turgani uchun 10^6
 * variantni oldindan hisoblab qo'yib bo'lmaydi.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly config: ConfigService,
  ) {}

  async requestCode(phone: string): Promise<OtpSendResponse> {
    const resendAfter = this.num('OTP_RESEND_SECONDS', 60);
    const ttl = this.num('OTP_TTL_SECONDS', 300);

    await this.assertNotTooSoon(phone, resendAfter);

    const code = generateCode();

    // Avvalgi kodlar darhol kuchini yo'qotadi: faqat oxirgi yuborilgani
    // ishlaydi, aks holda eski SMS bilan ham kirish mumkin bo'lardi.
    await this.prisma.otpCode.updateMany({
      where: { destination: phone, purpose: OtpPurpose.PHONE_VERIFY, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const record = await this.prisma.otpCode.create({
      data: {
        destination: phone,
        codeHash: this.hash(phone, code),
        purpose: OtpPurpose.PHONE_VERIFY,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    // Provayder ulanmagan — bu xato emas, ataylab tanlangan holat.
    if (!this.sms.isConfigured()) {
      return {
        mode: 'demo',
        expiresInSeconds: ttl,
        resendAfterSeconds: resendAfter,
        demoCode: code,
      };
    }

    try {
      const text = (this.config.get<string>('SMS_OTP_TEMPLATE') ?? '{code}').replace(
        '{code}',
        code,
      );
      await this.sms.send(phone, text);
    } catch (error) {
      // Yuborilmagan kod bazada qolib ketmasin: aks holda foydalanuvchi
      // "qayta yuborish" ni bosa olmay, taymer tugashini kutardi.
      await this.prisma.otpCode.delete({ where: { id: record.id } }).catch(() => undefined);
      throw error;
    }

    return { mode: 'sent', expiresInSeconds: ttl, resendAfterSeconds: resendAfter };
  }

  async verifyCode(phone: string, code: string): Promise<void> {
    const record = await this.prisma.otpCode.findFirst({
      where: {
        destination: phone,
        purpose: OtpPurpose.PHONE_VERIFY,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw AppError.validation('Kod eskirgan. Yangi kod so‘rang.');
    }

    const maxAttempts = this.num('OTP_MAX_ATTEMPTS', 5);

    if (record.attempts >= maxAttempts) {
      // Kodni yopamiz — endi faqat yangisi bilan davom etish mumkin
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      throw AppError.validation('Urinishlar tugadi. Yangi kod so‘rang.');
    }

    if (!this.matches(record.codeHash, phone, code)) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw AppError.validation('Kod noto‘g‘ri. Qaytadan urinib ko‘ring.');
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
  }

  /** Qayta yuborish oralig'i — SMS xarajati va spamdan himoya */
  private async assertNotTooSoon(phone: string, resendAfter: number): Promise<void> {
    const last = await this.prisma.otpCode.findFirst({
      where: { destination: phone, purpose: OtpPurpose.PHONE_VERIFY },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (!last) return;

    const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
    if (elapsed >= resendAfter) return;

    const wait = Math.ceil(resendAfter - elapsed);
    throw new AppError('rate_limited', `Yangi kodni ${wait} soniyadan keyin so‘rash mumkin`);
  }

  /**
   * Kalit JWT sirdan hosil qilinadi, lekin alohida "domen" yorlig'i bilan:
   * shunda OTP xeshi tokenlar bilan bir kalitni baham ko'rmaydi.
   * Telefon raqam ham xeshga kiradi — bitta kod boshqa raqamga o'tmaydi.
   */
  private hash(phone: string, code: string): string {
    return createHmac('sha256', this.otpKey()).update(`${phone}:${code}`).digest('hex');
  }

  private matches(stored: string, phone: string, code: string): boolean {
    const expected = Buffer.from(this.hash(phone, code), 'hex');
    const actual = Buffer.from(stored, 'hex');

    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }

  private cachedKey: Buffer | null = null;

  private otpKey(): Buffer {
    if (this.cachedKey) return this.cachedKey;

    const secret = this.config.get<string>('JWT_ACCESS_SECRET') ?? '';
    this.cachedKey = createHmac('sha256', secret).update('ecwt-otp-v1').digest();
    return this.cachedKey;
  }

  private num(key: string, fallback: number): number {
    const raw = this.config.get<number | string>(key);
    const parsed = typeof raw === 'string' ? Number(raw) : raw;
    return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
  }
}

/** 000000–999999, birinchi raqami nol bo'lishi ham mumkin */
function generateCode(): string {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');
}
