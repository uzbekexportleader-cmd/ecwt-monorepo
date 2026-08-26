import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentStatus } from '@ecwt/contracts';
import type {
  CreateChargeParams,
  CreateChargeResult,
  PaymentProviderAdapter,
  RawWebhook,
  WebhookVerification,
} from './payment-provider.interface';

/** Imzo shuncha sekunddan eski bo'lsa qabul qilinmaydi (replay himoyasi) */
const SIGNATURE_TOLERANCE_SECONDS = 300;

/**
 * Stripe integratsiyasi — AQSH kompaniyasi ochilgach xorijiy to'lovlar uchun.
 *
 * `stripe` npm paketi o'rniga to'g'ridan-to'g'ri REST API ishlatiladi:
 * bitta bog'liqlik kam, kerakli funksiya esa ikkita — PaymentIntent yaratish
 * va webhook imzosini tekshirish.
 */
@Injectable()
export class StripeProvider implements PaymentProviderAdapter {
  readonly name = 'STRIPE';
  private readonly logger = new Logger(StripeProvider.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('STRIPE_SECRET_KEY'));
  }

  async createCharge(params: CreateChargeParams): Promise<CreateChargeResult> {
    const secretKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');

    // Stripe summani eng kichik birlikda (sent) qabul qiladi
    const body = new URLSearchParams({
      amount: String(Math.round(params.amount * 100)),
      currency: params.currency.toLowerCase(),
      description: params.description,
      'metadata[payment_id]': params.paymentId,
      // Takroriy so'rov ikkita to'lov yaratmasligi uchun
      'automatic_payment_methods[enabled]': 'true',
    });

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        // Stripe tomonida ham idempotentlik
        'Idempotency-Key': params.paymentId,
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`Stripe PaymentIntent yaratilmadi: ${response.status} ${text}`);
      throw new Error('Stripe javob bermadi');
    }

    const intent = (await response.json()) as { id: string; client_secret: string };

    return {
      providerPaymentId: intent.id,
      redirectUrl: null,
      clientSecret: intent.client_secret,
      expiresAt: null,
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

    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    const header = raw.headers['stripe-signature'];

    if (!secret || typeof header !== 'string') {
      this.logger.warn('Stripe webhook: imzo yoki maxfiy kalit yo‘q');
      return invalid;
    }

    if (!verifyStripeSignature(raw.rawBody, header, secret)) {
      this.logger.warn('Stripe webhook: imzo mos kelmadi');
      return invalid;
    }

    const event = raw.parsedBody as StripeEvent | undefined;
    if (!event?.id || !event.type) return invalid;

    const intent = event.data?.object;

    return {
      valid: true,
      externalEventId: event.id,
      paymentId: typeof intent?.metadata?.payment_id === 'string' ? intent.metadata.payment_id : null,
      providerPaymentId: intent?.id ?? null,
      status: mapStripeEvent(event.type),
      amount: typeof intent?.amount === 'number' ? intent.amount / 100 : null,
      ...(event.type === 'payment_intent.payment_failed'
        ? { failureReason: intent?.last_payment_error?.message ?? 'To‘lov rad etildi' }
        : {}),
    };
  }
}

interface StripeEvent {
  id?: string;
  type?: string;
  data?: {
    object?: {
      id?: string;
      amount?: number;
      metadata?: Record<string, unknown>;
      last_payment_error?: { message?: string };
    };
  };
}

function mapStripeEvent(type: string): PaymentStatus {
  switch (type) {
    case 'payment_intent.succeeded':
      return 'SUCCEEDED';
    case 'payment_intent.processing':
      return 'PENDING';
    case 'payment_intent.amount_capturable_updated':
      return 'AUTHORIZED';
    case 'payment_intent.payment_failed':
      return 'FAILED';
    case 'payment_intent.canceled':
      return 'CANCELLED';
    case 'charge.refunded':
      return 'REFUNDED';
    default:
      return 'PENDING';
  }
}

/**
 * Stripe-Signature: t=1234567890,v1=abc...,v1=def...
 * Imzo `${timestamp}.${rawBody}` satridan HMAC-SHA256 bilan hisoblanadi.
 */
export function verifyStripeSignature(rawBody: Buffer, header: string, secret: string): boolean {
  const parts = header.split(',').map((p) => p.trim());

  let timestamp: string | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!key || !value) continue;
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  // Eski imzoni qayta yuborish (replay) hujumidan himoya
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody.toString('utf8')}`, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');

  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig, 'utf8');
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
