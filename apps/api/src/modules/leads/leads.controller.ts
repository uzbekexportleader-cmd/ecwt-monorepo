import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  createLeadSchema,
  leadListQuerySchema,
  updateLeadSchema,
  type CreateLeadInput,
  type LeadListQuery,
  type UpdateLeadInput,
} from '@ecwt/contracts';
import { LeadsService } from './leads.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public, Roles } from '../../common/decorators';
import type { AppRequest } from '../../common/types';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  /**
   * Saytdagi "Ariza qoldirish" formasi — ochiq.
   * Bitta IP'dan soatiga 5 ta ariza.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post()
  create(
    @Body(new ZodValidationPipe(createLeadSchema)) dto: CreateLeadInput,
    @Req() req: AppRequest,
  ) {
    return this.leads.create(dto, req.ip);
  }

  @Roles('ADMIN', 'STAFF')
  @Get()
  list(@Query(new ZodValidationPipe(leadListQuerySchema)) query: LeadListQuery) {
    return this.leads.list(query);
  }

  @Roles('ADMIN', 'STAFF')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) dto: UpdateLeadInput,
  ) {
    return this.leads.update(id, dto);
  }
}
