import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { DigitalSignatureProvider, SignatureResult } from './signature.provider';

/**
 * Development uchun tasdiqlash.
 *
 * MUHIM: bu KRIPTOGRAFIK IMZO EMAS. `isCryptographic: false` qaytadi va
 * ariza ustida "Elektron imzo mock rejimida" belgisi saqlanadi, shunda
 * hech kim buni haqiqiy E-IMZO deb o'ylamaydi.
 */
@Injectable()
export class MockSignatureProvider implements DigitalSignatureProvider {
  readonly name = 'mock';
  readonly isReal = false;
  private readonly logger = new Logger('MockSignature');
  private readonly issued = new Map<string, string>();

  async sign(payload: { userId: string; documentHash: string; token: string }): Promise<SignatureResult> {
    const ref = `mock:${randomUUID()}`;
    const digest = createHash('sha256')
      .update(`${payload.userId}:${payload.documentHash}:${payload.token}`)
      .digest('hex');
    this.issued.set(ref, digest);
    this.logger.warn('E-IMZO mock rejimida — kriptografik imzo qo‘yilmadi');
    return {
      signatureRef: ref,
      isCryptographic: false,
      provider: this.name,
      signedAt: new Date().toISOString(),
    };
  }

  async verify(signatureRef: string): Promise<boolean> {
    return signatureRef.startsWith('mock:');
  }
}
