import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Server holatini tekshirish.
 *
 * Nega kerak: joylashtirilgandan keyin server "tirikmi yoki o'lganmi" degan
 * savolga avtomatik javob beradigan manzil bo'lmasa, ishdan chiqqanini
 * hunarmandlar shikoyat qilgandan keyingina bilamiz. Deploy platformalari
 * (Render, Railway, Fly va h.k.) ham ilova ishga tushganini aynan shunday
 * manzil orqali tekshiradi.
 *
 * MUHIM: bazaga haqiqiy so'rov yuboriladi. Faqat "server javob berdi" deb
 * `ok` qaytarish yetarli emas — baza uzilgan bo'lsa ilova tashqaridan sog'lom
 * ko'rinib turaveradi, aslida esa hech bir foydalanuvchi kira olmaydi.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Server va baza holati' })
  async check(): Promise<{ ok: true; database: 'up'; uptimeSec: number }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      /*
       * 503 — "vaqtincha ishlamayapti". Aynan shu kod kuzatuv tizimlariga
       * va deploy platformalariga tushunarli signal beradi; sababning
       * tafsiloti tashqariga chiqarilmaydi.
       */
      throw new ServiceUnavailableException('Ma’lumotlar bazasi javob bermayapti');
    }

    return { ok: true, database: 'up', uptimeSec: Math.floor(process.uptime()) };
  }
}
