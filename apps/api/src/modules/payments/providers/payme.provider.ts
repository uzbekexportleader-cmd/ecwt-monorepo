import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { PaymentStatus } from '@ecwt/contracts';
import type {
  CreateChargeParams,
  CreateChargeResult,
  PaymentProviderAdapter,
  RawWebhook,
  WebhookVerification,
} from './payment-provider.interface';

/**
 * Payme (Paycom) integratsiyasi.
 *
 * To'lovga yo'naltirish: checkout.paycom.uz manzili base64 parametr bilan
 * quriladi — m=merchant_id;ac.payment_id=...;a=summa_tiyinda;c=qaytish_manzili
 *
 * Payme "Merchant API" ni ishlatadi: Payme SERVERI bizning `/webhooks/payme`
 * manzilimizga JSON-RPC so'rov yuboradi (CheckPerformTransaction,
 * CreateTransaction, PerformTransaction, CancelTransaction) va
 * `Authorization: Basic base64("Paycom:" + KEY)` sarlavhasi bilan tasdiqlanadi.
 *
 * ⚠️ ISHGA TUSHIRISHDAN OLDIN: Payme kabinetidagi rasmiy hujjat bo'yicha
 * har bir metod javobini sinov muhitida tekshiring. Bu yerda asosiy oqim
 * va imzo tekshiruvi berilgan.
 */
@Injectable()
export class PaymeProvider implements PaymentProviderAdapter {
  readonly name = 'PAYME';
  private readonly logger = new Logger(PaymeProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('PAYME_MERCHANT_ID') && this.config.get<string>('PAYME_KEY'),
    );
  }

  async createCharge(params: CreateChargeParams): Promise<CreateChargeResult> {
    const merchantId = this.config.getOrThrow<string>('PAYME_MERCHANT_ID');
    const checkoutUrl = this.config.get<string>('PAYME_CHECKOUT_URL') ?? 'https://checkout.paycom.uz';

    // Payme summani TIYINDA qabul qiladi (1 so'm = 100 tiyin)
    const amountTiyin = Math.round(params.amount * 100);

    const parts = [
      `m=${merchantId}`,
      `ac.payment_id=${params.paymentId}`,
      `a=${amountTiyin}`,
      `l=uz`,
    ];
    if (params.returnUrl) parts.push(`c=${params.returnUrl}`);

    const encoded = Buffer.from(parts.join(';'), 'utf8').toString('base64');

    return {
      providerPaymentId: null, // Payme tranzaksiya ID'sini webhook'da beradi
      redirectUrl: `${checkoutUrl}/${encoded}`,
      clientSecret: null,
      // Payme to'lov havolasi odatda 12 soat amal qiladi
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

    const authHeader = raw.headers['authorization'];
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Basic ')) {
      this.logger.warn('Payme webhook: Authorization sarlavhasi yo‘q');
      return invalid;
    }

    const key = this.config.get<string>('PAYME_KEY');
    if (!key) return invalid;

    const expected = Buffer.from(`Paycom:${key}`, 'utf8').toString('base64');
    const received = authHeader.slice('Basic '.length);

    if (!safeCompare(received, expected)) {
      this.logger.warn('Payme webhook: imzo mos kelmadi');
      return invalid;
    }

    const body = raw.parsedBody as PaymeRpcRequest | undefined;
    if (!body || typeof body.method !== 'string') return { ...invalid, valid: true };

    const account = body.params?.account;
    const paymentId = typeof account?.payment_id === 'string' ? account.payment_id : null;

    // JSON-RPC so'rov ID'si + metod nomi takroriy hodisani aniqlash uchun yetarli
    const externalEventId = `${body.method}:${body.params?.id ?? body.id ?? ''}`;

    return {
      valid: true,
      externalEventId,
      paymentId,
      providerPaymentId: typeof body.params?.id === 'string' ? body.params.id : null,
      status: statusFromPaymeMethod(body.method),
      amount: typeof body.params?.amount === 'number' ? body.params.amount / 100 : null,
    };
  }
}

interface PaymeRpcRequest {
  id?: number | string;
  method?: string;
  params?: {
    id?: string;
    amount?: number;
    account?: Record<string, unknown>;
    reason?: number;
  };
}

function statusFromPaymeMethod(method: string): PaymentStatus {
  switch (method) {
    case 'CheckPerformTransaction':
      return 'PENDING';
    case 'CreateTransaction':
      return 'AUTHORIZED';
    case 'PerformTransaction':
      return 'SUCCEEDED';
    case 'CancelTransaction':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

/**
 * Doimiy vaqtda solishtirish — imzoni belgima-belgi taqqoslash orqali
 * topib olishning oldini oladi.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Uzunlik farq qilsa ham vaqtni tenglashtirish uchun bir marta solishtiramiz
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
