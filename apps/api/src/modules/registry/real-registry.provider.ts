import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { GovernmentRegistryProvider, RegistryCheck } from './registry.provider';
import type { Env } from '../../config/env';

/**
 * Real reyestr adapteri karkasi.
 * Credential berilmaguncha xato qaytaradi.
 */
@Injectable()
export class RealGovernmentRegistryProvider implements GovernmentRegistryProvider {
  readonly name = 'real';
  readonly isReal = true;

  constructor(private readonly env: Env) {}

  private assertTax(): void {
    if (!this.env.TAX_REGISTRY_BASE_URL || !this.env.TAX_REGISTRY_API_KEY) {
      throw new ServiceUnavailableException(
        'Soliq reyestri sozlanmagan: TAX_REGISTRY_BASE_URL va TAX_REGISTRY_API_KEY kerak',
      );
    }
  }

  private assertMembership(): void {
    if (!this.env.HUNARMAND_REGISTRY_BASE_URL || !this.env.HUNARMAND_REGISTRY_API_KEY) {
      throw new ServiceUnavailableException(
        'Uyushma reyestri sozlanmagan: HUNARMAND_REGISTRY_BASE_URL va HUNARMAND_REGISTRY_API_KEY kerak',
      );
    }
  }

  private async call(url: string, apiKey: string): Promise<Record<string, unknown>> {
    const res = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
    if (!res.ok) throw new ServiceUnavailableException('Reyestr javob bermadi');
    return (await res.json()) as Record<string, unknown>;
  }

  async checkBusinessRegistration(stir: string): Promise<RegistryCheck> {
    this.assertTax();
    const data = await this.call(
      `${this.env.TAX_REGISTRY_BASE_URL}/taxpayer/${stir}`,
      this.env.TAX_REGISTRY_API_KEY!,
    );
    const active = data.status === 'ACTIVE';
    return {
      status: active ? 'CONFIRMED' : 'NOT_FOUND',
      note: active ? 'Soliq reyestrida faol holatda' : 'Reyestrda faol tadbirkor topilmadi',
      provider: this.name,
      checkedAt: new Date().toISOString(),
    };
  }

  async checkTaxDebt(stir: string): Promise<RegistryCheck> {
    this.assertTax();
    const data = await this.call(
      `${this.env.TAX_REGISTRY_BASE_URL}/taxpayer/${stir}/debt`,
      this.env.TAX_REGISTRY_API_KEY!,
    );
    const hasDebt = Number(data.amount ?? 0) > 0;
    return {
      status: hasDebt ? 'NOT_FOUND' : 'CONFIRMED',
      note: hasDebt ? 'Soliq qarzi mavjud' : 'Soliq qarzi aniqlanmadi',
      provider: this.name,
      checkedAt: new Date().toISOString(),
    };
  }

  async checkCraftsmanMembership(pinfl: string): Promise<RegistryCheck> {
    this.assertMembership();
    const data = await this.call(
      `${this.env.HUNARMAND_REGISTRY_BASE_URL}/members/${pinfl}`,
      this.env.HUNARMAND_REGISTRY_API_KEY!,
    );
    const active = data.status === 'ACTIVE';
    return {
      status: active ? 'CONFIRMED' : 'NOT_FOUND',
      note: active ? 'Uyushma reyestrida a’zolik tasdiqlandi' : 'A’zolik topilmadi yoki muddati tugagan',
      provider: this.name,
      checkedAt: new Date().toISOString(),
    };
  }
}
