import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SellerApplicationDto } from '@ecwt/types';
import { sellerDecisionSchema, type SellerDecisionInput } from '@ecwt/validation';

import { SellerApplicationService } from './seller-application.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

/*
 * `@Roles` o'z-o'zidan hech narsani to'smaydi — u faqat metadata yozadi.
 * Roldan foydalanish uchun RolesGuard ulanishi SHART, aks holda operator
 * uchun mo'ljallangan ro'yxatni har qanday foydalanuvchi ocha oladi.
 */
@ApiTags('seller-application')
@UseGuards(RolesGuard)
@Controller('seller-application')
export class SellerApplicationController {
  constructor(private readonly service: SellerApplicationService) {}

  /**
   * Hunarmandning o'z arizasi.
   *
   * `null` qaytishi normal holat: anketa hali tugatilmagan.
   */
  @Get()
  @ApiOperation({ summary: 'Mening sotuvchi arizam' })
  mine(@CurrentUser('sub') userId: string): Promise<SellerApplicationDto | null> {
    return this.service.findMine(userId);
  }

  /* ----------------------------- operator ------------------------------ */

  @Get('all')
  @Roles('REVIEWER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Arizalar ro‘yxati (operator)' })
  list(@Query('status') status?: string) {
    return this.service.list(status as never);
  }

  @Post(':id/decision')
  @Roles('REVIEWER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Ariza bo‘yicha qaror (operator)' })
  decide(
    @Param('id') id: string,
    @Body(zodBody(sellerDecisionSchema)) body: SellerDecisionInput,
    @CurrentUser('sub') actorId: string,
  ): Promise<SellerApplicationDto> {
    return this.service.decide(id, body.status, body.note ?? null, actorId);
  }
}
