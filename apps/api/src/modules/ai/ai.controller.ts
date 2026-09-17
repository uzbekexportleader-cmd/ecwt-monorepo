import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { aiAskSchema, type AiAskInput } from '@ecwt/validation';
import type { AiMessageDto } from '@ecwt/types';

import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('ask')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'ECWT AI Assistant (faqat axborot beradi)' })
  ask(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(aiAskSchema)) body: AiAskInput,
  ): Promise<AiMessageDto> {
    return this.service.ask(userId, body.message);
  }

  @Get('status')
  @ApiOperation({ summary: 'AI xizmati ulanganmi' })
  status(): { connected: boolean; provider: string } {
    /*
     * Ilova "kalit ulanmagan" ogohlantirishini SHU javobga qarab
     * ko'rsatadi. Matn qo'lda yozilsa, kalit ulangach uni o'chirish
     * esdan chiqib, foydalanuvchiga yolg'on ma'lumot qolib ketardi.
     */
    return this.service.status();
  }

  @Get('history')
  @ApiOperation({ summary: 'Suhbat tarixi' })
  history(@CurrentUser('sub') userId: string): Promise<AiMessageDto[]> {
    return this.service.history(userId);
  }
}
