import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { DigitalSignatureProvider, SignatureResult } from './signature.provider';
import type { Env } from '../../config/env';

/**
 * E-IMZO adapteri — real integratsiya uchun karkas.
 * EIMZO_BASE_URL va EIMZO_API_KEY berilmaguncha ishlamaydi (mock qilmaydi).
 */
@Injectable()
export class EImzoSignatureProvider implements DigitalSignatureProvider {
  readonly name = 'eimzo';
  readonly isReal = true;

  constructor(private readonly env: Env) {}

  private assertConfigured(): void {
    if (!this.env.EIMZO_BASE_URL || !this.env.EIMZO_API_KEY) {
      throw new ServiceUnavailableException(
        'E-IMZO sozlanmagan: EIMZO_BASE_URL va EIMZO_API_KEY kerak',
      );
    }
  }

  async sign(payload: { userId: string; documentHash: string; token: string }): Promise<SignatureResult> {
    this.assertConfigured();
    const res = await fetch(`${this.env.EIMZO_BASE_URL}/sign/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': this.env.EIMZO_API_KEY! },
      body: JSON.stringify({ pkcs7: payload.token, documentHash: payload.documentHash }),
    });
    if (!res.ok) throw new ServiceUnavailableException('E-IMZO imzoni tasdiqlamadi');
    const data = (await res.json()) as { signatureId?: string };
    if (!data.signatureId) throw new ServiceUnavailableException('E-IMZO imzo identifikatorini qaytarmadi');
    return {
      signatureRef: `eimzo:${data.signatureId}`,
      isCryptographic: true,
      provider: this.name,
      signedAt: new Date().toISOString(),
    };
  }

  async verify(signatureRef: string): Promise<boolean> {
    this.assertConfigured();
    const res = await fetch(`${this.env.EIMZO_BASE_URL}/sign/${encodeURIComponent(signatureRef)}`, {
      headers: { 'X-Api-Key': this.env.EIMZO_API_KEY! },
    });
    return res.ok;
  }
}
