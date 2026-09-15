import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Sentry, sentryEnabled } from '../../instrument';

/** Maxfiy maydonlar hech qachon log'ga tushmaydi. */
const REDACTED_KEYS = [
  'password',
  'passwordHash',
  'code',
  'codeHash',
  'refreshToken',
  'accessToken',
  'pinfl',
  'bankAccount',
  'bankCard',
  'authorization',
];

/**
 * Framework va kutubxonalar inglizcha xato matnlarini qaytaradi.
 * Foydalanuvchi ularni hech qachon ko'rmasligi kerak — shu yerda
 * o'zbekchaga aylantiriladi.
 */
const MESSAGE_MAP: { match: RegExp; message: string }[] = [
  {
    match: /throttler|too many requests/i,
    message: 'Juda tez-tez urinyapsiz. Bir oz kutib, qayta urinib ko‘ring.',
  },
  { match: /^unauthorized$/i, message: 'Avtorizatsiya talab qilinadi. Qaytadan kiring.' },
  { match: /^forbidden(\s+resource)?$/i, message: 'Bu amal uchun ruxsatingiz yo‘q.' },
  { match: /^not found$|^cannot (get|post|put|patch|delete)/i, message: 'So‘ralgan ma’lumot topilmadi.' },
  { match: /payload too large|file too large|entity too large/i, message: 'Fayl hajmi juda katta. 10 MB gacha fayl yuklang.' },
  { match: /unexpected field|multipart|unsupported media/i, message: 'Fayl formati noto‘g‘ri. PDF, JPG yoki PNG yuklang.' },
  { match: /request timeout|timed? ?out/i, message: 'Server javob bermadi. Qaytadan urinib ko‘ring.' },
  { match: /internal server error/i, message: 'Ichki xatolik yuz berdi. Birozdan so‘ng urinib ko‘ring.' },
  { match: /bad request/i, message: 'So‘rovda xatolik bor. Ma’lumotlarni tekshirib qayta yuboring.' },
  { match: /validation failed/i, message: 'Kiritilgan ma’lumotlar to‘g‘ri emas.' },
];

/** Matn o'zbekchami? (bizning xabarlarimiz o'zgarmasligi kerak) */
function translate(message: string): string {
  for (const rule of MESSAGE_MAP) {
    if (rule.match.test(message)) return rule.message;
  }
  return message;
}

function redact(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    out[k] = REDACTED_KEYS.includes(k) ? '***' : redact(v);
  }
  return out;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let payload: Record<string, unknown>;
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      payload = typeof res === 'string' ? { message: res } : { ...(res as Record<string, unknown>) };
    } else {
      payload = { message: 'Ichki xatolik yuz berdi', code: 'INTERNAL_ERROR' };
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Foydalanuvchiga ko'rinadigan matnni o'zbekchaga keltiramiz
    if (typeof payload.message === 'string') {
      payload.message = translate(payload.message);
    } else if (Array.isArray(payload.message)) {
      payload.message = (payload.message as unknown[]).map((m) =>
        typeof m === 'string' ? translate(m) : m,
      );
    } else if (payload.message === undefined) {
      payload.message = translate(String((payload as { error?: string }).error ?? 'Xatolik'));
    }
    // Nest'ning inglizcha "error" maydoni mobil ilovada ishlatilmaydi, lekin
    // tasodifan ko'rinib qolmasligi uchun olib tashlaymiz.
    delete (payload as { error?: unknown }).error;

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}`, JSON.stringify(redact(request.body)));

      /*
       * Sentry'ga faqat server xatolari yuboriladi (5xx).
       *
       * 4xx — bu foydalanuvchi xatosi (noto'g'ri parol, to'ldirilmagan
       * maydon): ular kunda minglab bo'ladi va Sentry'ni ko'mib tashlaydi.
       * Bizga kerak bo'lgani — bizning kodimiz singan joylar.
       *
       * So'rov tanasi qo'shilmaydi: unda pasport va bank ma'lumotlari
       * bo'lishi mumkin.
       */
      if (sentryEnabled) {
        Sentry.captureException(exception, {
          tags: { method: request.method, path: request.route?.path ?? request.url },
        });
      }
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  }
}
