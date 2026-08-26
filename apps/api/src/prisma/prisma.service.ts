import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }]
          : [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Ma’lumotlar bazasiga ulandi');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Prisma Decimal -> number. API javoblarida pul qiymatlari son sifatida ketadi.
   * JS soni 2^53 gacha aniq — UZS millionlari uchun ham yetarli.
   */
  static toNumber(value: Prisma.Decimal | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Number(value.toString());
  }

  static toNumberOrNull(value: Prisma.Decimal | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    return Number(value.toString());
  }
}
