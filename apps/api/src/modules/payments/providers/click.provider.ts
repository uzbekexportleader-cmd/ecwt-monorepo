import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
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
 * Click integratsiyasi (Click Merchant API — Prepare/Complete sxemasi).
 *
 * To'lovga yo'naltirish: my.click.uz/services/pay?service_id=...&merchant_id=...
 * Click serveri keyin bizning `/webhooks/click` manzilimizga ikki bosqichda
 * murojaat qiladi:
 *   action=0 → Prepare  (to'lovni tekshirish va band qilish)
 *   action=1 → Complete (to'lovni yakunlash)
 *
 * Imzo: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id +
 *           [merchant_prepare_id] + amount + action + sign_time)
 * Complete bosqichida `merchant_prepare_id` ham qatnashadi.
 *
 * ⚠️ ISHGA TUSHIRISHDAN OLDIN: Click kabinetidagi hujjat bo'yicha imzo
 * tartibini va javob formatini sinov muhitida tasdiqlang.
 */
@Injectable()
export class ClickProvider implements PaymentProviderAdapter {
  readonly name = 'CLICK';
  private readonly logger = new Logger(ClickProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('CLICK_MERCHANT_ID') &&
        this.config.get<string>('CLICK_SERVICE_ID') &&
        this.config.get<string>('CLICK_SECRET_KEY'),
    );
  }

  async createCharge(params: CreateChargeParams): Promise<CreateChargeResult> {
    const merchantId = this.config.getOrThrow<string>('CLICK_MERCHANT_ID');
    const serviceId = this.config.getOrThrow<string>('CLICK_SERVICE_ID');

    const url = new URL('https://my.click.uz/services/pay');
    url.searchParams.set('service_id', serviceId);
    url.searchParams.set('merchant_id', merchantId);
    url.searchParams.set('amount', params.amount.toFixed(2));
    url.searchParams.set('transaction_param', params.paymentId);
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

    const body = raw.parsedBody as ClickWebhookBody | undefined;
    if (!body?.click_trans_id || !body.sign_string) {
      this.logger.warn('Click webhook: majburiy maydonlar yo‘q');
      return invalid;
    }

    const secret = this.config.get<string>('CLICK_SECRET_KEY');
    const serviceId = this.config.get<string>('CLICK_SERVICE_ID');
    if (!secret || !serviceId) return invalid;

    const action = String(body.action ?? '');
    const isComplete = action === '1';

    // Complete bosqichida imzoga merchant_prepare_id ham qo'shiladi
    const signParts = [
      body.click_trans_id,
      serviceId,
      secret,
      body.merchant_trans_id ?? '',
      ...(isComplete ? [body.merchant_prepare_id ?? ''] : []),
      body.amount ?? '',
      action,
      body.sign_time ?? '',
    ];

    const expected = createHash('md5').update(signParts.join(''), 'utf8').digest('hex');

    if (!safeCompare(String(body.sign_string).toLowerCase(), expected)) {
      this.logger.warn(`Click webhook: imzo mos kelmadi (trans=${body.click_trans_id})`);
      return invalid;
    }

    // error < 0 bo'lsa Click xatoni bildiradi (bekor qilingan / muvaffaqiyatsiz)
    const errorCode = Number(body.error ?? 0);
    const failed = errorCode < 0;

    let status: PaymentStatus;
    if (failed) {
      status = 'CANCELLED';
    } else if (isComplete) {
      status = 'SUCCEEDED';
    } else {
      status = 'AUTHORIZED';
    }

    return {
      valid: true,
      externalEventId: `${body.click_trans_id}:${action}`,
      paymentId: body.merchant_trans_id ?? null,
      providerPaymentId: String(body.click_trans_id),
      status,
      amount: body.amount !== undefined ? Number(body.amount) : null,
      ...(failed ? { failureReason: `Click xatosi: ${body.error_note ?? errorCode}` } : {}),
    };
  }
}

interface ClickWebhookBody {
  click_trans_id?: string | number;
  service_id?: string;
  merchant_trans_id?: string;
  merchant_prepare_id?: string | number;
  amount?: string | number;
  action?: string | number;
  error?: string | number;
  error_note?: string;
  sign_time?: string;
  sign_string?: string;
}
