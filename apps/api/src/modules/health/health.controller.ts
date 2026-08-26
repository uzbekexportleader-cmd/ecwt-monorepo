import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators';
import { AppError } from '../../common/errors';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness — jarayon tirikmi. Hosting platformasi shuni tekshiradi. */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness — so'rovlarni qabul qilishga tayyormi.
   * Bazaga ulanib bo'lmasa 502 qaytaradi va yangi trafik yuborilmaydi.
   */
  @Public()
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw AppError.dependencyFailure('Ma’lumotlar bazasiga ulanib bo‘lmadi');
    }

    return { status: 'ready', database: 'up', timestamp: new Date().toISOString() };
  }
}
