import { Controller, HttpCode, HttpStatus, Logger, Param, Post, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PAYMENT_PROVIDERS, type PaymentProvider } from '@ecwt/contracts';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators';
import { AppError } from '../../common/errors';
import type { AppRequest } from '../../common/types';

/**
 * To'lov tizimlaridan keladigan webhook'lar.
 *
 * Bu marshrutlar ochiq (token yo'q) — himoya IMZO tekshiruvi orqali amalga
 * oshadi, uni har bir provayder adapteri bajaradi.
 *
 * Rate limit o'chirilgan: provayder ko'p urinishi normal holat, uni
 * bloklasak to'lov holati yangilanmay qoladi.
 */
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @Post(':provider')
  async handle(@Param('provider') providerParam: string, @Req() req: AppRequest) {
    const provider = normalizeProvider(providerParam);

    if (!provider) throw AppError.notFound('Noma’lum to‘lov tizimi');

    // XOM tana imzo tekshiruvi uchun shart — JSON qayta yig'ilganda
    // bo'shliqlar o'zgarib, imzo mos kelmay qolishi mumkin.
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');

    try {
      const result = await this.payments.handleWebhook(provider, {
        headers: req.headers,
        rawBody,
        parsedBody: req.body,
      });

      return formatResponse(provider, result, req.body);
    } catch (error) {
      if (error instanceof AppError && error.code === 'unauthorized') {
        this.logger.warn(`Webhook imzosi rad etildi: ${provider}`);
        // Imzo noto'g'ri bo'lsa provayderga xato qaytaramiz
        throw error;
      }

      this.logger.error(
        `Webhook qayta ishlashda xato (${provider})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}

function normalizeProvider(value: string): PaymentProvider | null {
  const upper = value.toUpperCase();
  return (PAYMENT_PROVIDERS as readonly string[]).includes(upper)
    ? (upper as PaymentProvider)
    : null;
}

/**
 * Har bir provayder o'ziga xos javob formatini kutadi.
 * Noto'g'ri format qaytarsak, ular to'lovni "muvaffaqiyatsiz" deb hisoblaydi.
 */
function formatResponse(
  provider: PaymentProvider,
  result: { ok: boolean; paymentId: string | null; message: string },
  requestBody: unknown,
): unknown {
  switch (provider) {
    case 'PAYME': {
      // Payme JSON-RPC 2.0 kutadi
      const id = (requestBody as { id?: number | string } | undefined)?.id ?? null;

      if (!result.ok) {
        return {
          id,
          error: { code: -31050, message: { uz: result.message, ru: result.message, en: result.message } },
        };
      }

      return { id, result: { allow: true } };
    }

    case 'CLICK':
      // Click uchun error=0 muvaffaqiyat degani
      return result.ok
        ? { error: 0, error_note: 'Success' }
        : { error: -9, error_note: result.message };

    case 'STRIPE':
      return { received: true };

    default:
      return { status: result.ok ? 'OK' : 'ERROR', message: result.message };
  }
}
