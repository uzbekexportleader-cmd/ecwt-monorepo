import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import type { PaymentStatus } from '@ecwt/contracts';
import type {
  CreateChargeParams,
  CreateChargeResult,
  PaymentProviderAdapter,
  RawWebhook,
  WebhookVerification,
} from './payment-provider.interface';
import { safeCompare } from './payme.provider';

/**
 * Uzum Bank (Uzum Nasiya / Uzum Pay) integratsiyasi.
 *
 * ⚠️ DIQQAT: Uzum'ning merchant API si Payme va Click kabi keng tarqalgan
 * yagona standartga ega emas — shartnoma turiga qarab endpoint va imzo
 * algoritmi farq qiladi.
 *
 * Bu yerda umumiy sxema berilgan: HMAC-SHA256 imzo `X-Signature`
 * sarlavhasida keladi deb faraz qilinadi. Uzum bilan shartnoma tuzganingizda
 * ular bergan hujjat asosida `createCharge` va `verifyWebhook` metodlarini
 * moslashtiring — qolgan kodga tegish shart emas.
 */
@Injectable()
export class UzumProvider implements PaymentProviderAdapter {
  readonly name = 'UZUM';
  private readonly logger = new Logger(UzumProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('UZUM_MERCHANT_ID') && this.config.get<string>('UZUM_SECRET_KEY'),
    );
  }

  async createCharge(params: CreateChargeParams): Promise<CreateChargeResult> {
    const merchantId = this.config.getOrThrow<string>('UZUM_MERCHANT_ID');

    const url = new URL('https://checkout.uzumbank.uz/pay');
    url.searchParams.set('merchant_id', merchantId);
    url.searchParams.set('order_id', params.paymentId);
    url.searchParams.set('amount', String(Math.round(params.amount * 100)));
    if (params.returnUrl) url.searchParams.set('return_url', params.returnUrl);

    return {
      providerPaymentId: null,
      redirectUrl: url.toString(),
      clientSecret: null,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    };
  }

  verifyWebhook(raw: RawWebhook): WebhookVerification {
    const invalid: WebhookVerification = {
      valid: false,
      externalEventId: '',
      paymentId: null,
      providerPaymentId: null,
      status: 'FAILED',
      amount: null,
    };

    const secret = this.config.get<string>('UZUM_SECRET_KEY');
    if (!secret) return invalid;

    const signature = raw.headers['x-signature'];
    if (typeof signature !== 'string') {
      this.logger.warn('Uzum webhook: X-Signature sarlavhasi yo‘q');
      return invalid;
    }

    // Imzo XOM tana bo'yicha hisoblanadi — JSON qayta seriyalanganda
    // bo'shliqlar o'zgarib, imzo buzilishi mumkin.
    const expected = createHmac('sha256', secret).update(raw.rawBody).digest('hex');

    if (!safeCompare(signature.toLowerCase(), expected)) {
      this.logger.warn('Uzum webhook: imzo mos kelmadi');
      return invalid;
    }

    const body = raw.parsedBody as UzumWebhookBody | undefined;
    if (!body?.order_id) return invalid;

    return {
      valid: true,
      externalEventId: body.event_id ?? `${body.order_id}:${body.status ?? ''}`,
      paymentId: body.order_id,
      providerPaymentId: body.transaction_id ?? null,
      status: mapUzumStatus(body.status),
      amount: body.amount !== undefined ? Number(body.amount) / 100 : null,
      ...(body.status === 'FAILED' ? { failureReason: body.error_message ?? 'Uzum: to‘lov amalga oshmadi' } : {}),
    };
  }
}

interface UzumWebhookBody {
  event_id?: string;
  order_id?: string;
  transaction_id?: string;
  status?: string;
  amount?: string | number;
  error_message?: string;
}

function mapUzumStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case 'SUCCESS':
    case 'PAID':
      return 'SUCCEEDED';
    case 'HOLD':
    case 'AUTHORIZED':
      return 'AUTHORIZED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'REFUNDED':
      return 'REFUNDED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}
