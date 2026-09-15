import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { IdentityCheckResult, IdentityData, IdentityProvider } from './identity.provider';
import type { Env } from '../../config/env';

/**
 * OneID (sso.egov.uz) adapteri — real integratsiya uchun karkas.
 *
 * Ishga tushirish uchun kerak (mendan emas, davlat organidan olinadi):
 *   ONEID_CLIENT_ID, ONEID_CLIENT_SECRET, ONEID_REDIRECT_URI
 * Ular berilmaguncha provayder xato qaytaradi.
 */
@Injectable()
export class OneIdIdentityProvider implements IdentityProvider {
  readonly name = 'oneid';
  readonly isReal = true;

  constructor(private readonly env: Env) {}

  private assertConfigured(): void {
    if (!this.env.ONEID_CLIENT_ID || !this.env.ONEID_CLIENT_SECRET || !this.env.ONEID_REDIRECT_URI) {
      throw new ServiceUnavailableException(
        'OneID sozlanmagan: ONEID_CLIENT_ID, ONEID_CLIENT_SECRET, ONEID_REDIRECT_URI kerak',
      );
    }
  }

  getAuthorizationUrl(state: string): string {
    this.assertConfigured();
    const params = new URLSearchParams({
      response_type: 'one_code',
      client_id: this.env.ONEID_CLIENT_ID!,
      redirect_uri: this.env.ONEID_REDIRECT_URI!,
      scope: 'myportal',
      state,
    });
    return `${this.env.ONEID_BASE_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<IdentityCheckResult> {
    this.assertConfigured();
    const body = new URLSearchParams({
      grant_type: 'one_authorization_code',
      client_id: this.env.ONEID_CLIENT_ID!,
      client_secret: this.env.ONEID_CLIENT_SECRET!,
      code,
    });
    const res = await fetch(this.env.ONEID_BASE_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      return { status: 'FAILED', reason: 'OneID javob bermadi', provider: this.name };
    }
    const raw = (await res.json()) as Record<string, string>;
    const data: IdentityData = {
      pinfl: raw.pin ?? '',
      firstName: raw.first_name ?? '',
      lastName: raw.sur_name ?? '',
      middleName: raw.mid_name,
      birthDate: raw.birth_date ?? '',
      region: raw.per_adr,
      passportNumber: raw.pport_no,
    };
    return { status: 'VERIFIED', data, provider: this.name };
  }

  /**
   * OneID biometrik yuz tekshiruvini bermaydi — buning uchun MyID kerak.
   * MYID_CLIENT_ID/MYID_CLIENT_SECRET berilganda shu yerga real chaqiruv qo'shiladi.
   */
  async verifyFace(): Promise<IdentityCheckResult> {
    return {
      status: 'MANUAL_REVIEW',
      reason:
        'OneID biometrik yuz tekshiruvini qo‘llab-quvvatlamaydi. Buning uchun MyID integratsiyasi kerak.',
      provider: this.name,
    };
  }

  async verifyByPinfl(): Promise<IdentityCheckResult> {
    this.assertConfigured();
    return {
      status: 'MANUAL_REVIEW',
      reason: 'OneID to‘g‘ridan-to‘g‘ri JShShIR tekshiruvini qo‘llab-quvvatlamaydi',
      provider: this.name,
    };
  }
}
