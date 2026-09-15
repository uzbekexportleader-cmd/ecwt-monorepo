import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ServicePaymentDto } from '@ecwt/types';
import {
  servicePaymentDecisionSchema,
  servicePaymentProofSchema,
  subsidyArrivedSchema,
  type ServicePaymentDecisionInput,
  type ServicePaymentProofInput,
  type SubsidyArrivedInput,
} from '@ecwt/validation';

import { ServicePaymentService } from './service-payment.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('service-payment')
@UseGuards(RolesGuard)
@Controller('service-payment')
export class ServicePaymentController {
  constructor(private readonly service: ServicePaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Mening xizmat to‘lovim holati' })
  mine(@CurrentUser('sub') userId: string): Promise<ServicePaymentDto> {
    return this.service.getMine(userId);
  }

  @Post('subsidy-arrived')
  @ApiOperation({ summary: 'Subsidiya bank hisobiga tushdi' })
  arrived(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(subsidyArrivedSchema)) body: SubsidyArrivedInput,
  ): Promise<ServicePaymentDto> {
    return this.service.markSubsidyArrived(userId, body.note ?? null);
  }

  @Post('proof')
  @ApiOperation({ summary: 'O‘tkazma hujjatini yuborish' })
  proof(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(servicePaymentProofSchema)) body: ServicePaymentProofInput,
  ): Promise<ServicePaymentDto> {
    return this.service.submitProof(userId, body.documentId, body.amount, body.note ?? null);
  }

  /* ----------------------------- operator ------------------------------ */

  @Get('queue')
  @Roles('REVIEWER', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Tekshirilishi kerak bo‘lgan to‘lovlar' })
  queue() {
    return this.service.queue();
  }

  @Post(':userId/decision')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'To‘lov bo‘yicha qaror (administrator)' })
  decide(
    @Param('userId') userId: string,
    @Body(zodBody(servicePaymentDecisionSchema)) body: ServicePaymentDecisionInput,
    @CurrentUser('sub') actorId: string,
  ): Promise<ServicePaymentDto> {
    return this.service.decide(userId, body.decision, body.note ?? null, actorId);
  }
}
