import { Inject, Injectable } from '@nestjs/common';
import { MARKETPLACES } from '@ecwt/config';
import type { MarketplaceDto } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { MARKETPLACE_REGISTRY, type MarketplaceProvider } from './marketplace.provider';

@Injectable()
export class MarketplacesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MARKETPLACE_REGISTRY) private readonly registry: Map<string, MarketplaceProvider>,
  ) {}

  async list(): Promise<MarketplaceDto[]> {
    const rows = await this.prisma.marketplace.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      logoEmoji: m.logoEmoji,
      isActive: m.isActive,
      isMock: !this.registry.get(m.code)?.isReal,
    }));
  }

  provider(code: string): MarketplaceProvider | undefined {
    return this.registry.get(code);
  }

  /** Seed uchun: konfiguratsiyadagi marketplace'lar bazaga yoziladi. */
  async ensureSeeded(): Promise<void> {
    for (const m of MARKETPLACES) {
      await this.prisma.marketplace.upsert({
        where: { code: m.code },
        create: { code: m.code, name: m.name, logoEmoji: m.emoji, isMock: true },
        update: { name: m.name, logoEmoji: m.emoji },
      });
    }
  }
}
