import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { analyticsBatchSchema, type AnalyticsBatchInput } from '@ecwt/validation';
import type { FunnelStepDto } from '@ecwt/types';

import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  /**
   * Hodisalarni qabul qiladi.
   *
   * `@Public`: "ilova ochildi" kabi hodisalar kirishdan oldin ham keladi.
   * Kirgan foydalanuvchida token bo'lsa — `userId` bilan yoziladi.
   *
   * Limit odatdagidan yuqoriroq: mijoz to'plamlarni (batch) yuboradi, lekin
   * offline navbat to'planib qolsa bir vaqtda bir nechta so'rov ketishi mumkin.
   */
  @Post('events')
  @Public()
  @HttpCode(204)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: 'Mahsulot hodisalarini yozish' })
  record(
    @CurrentUser('sub') userId: string | undefined,
    @Body(zodBody(analyticsBatchSchema)) body: AnalyticsBatchInput,
  ): Promise<void> {
    return this.service.record(userId ?? null, body);
  }

  @Get('funnel')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Anketa voronkasi (faqat admin)' })
  funnel(@Query('days') days?: string): Promise<FunnelStepDto[]> {
    const parsed = Number(days);
    return this.service.onboardingFunnel(Number.isFinite(parsed) && parsed > 0 ? parsed : 30);
  }
}
