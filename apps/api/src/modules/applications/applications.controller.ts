import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createApplicationSchema,
  submitApplicationSchema,
  updateApplicationSchema,
  type CreateApplicationInput,
  type SubmitApplicationInput,
  type UpdateApplicationInput,
} from '@ecwt/validation';
import type { ApplicationDto } from '@ecwt/types';
import { z } from 'zod';

import { ApplicationsService } from './applications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

const attachSchema = z.object({ documentId: z.string().min(1) });

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Mening arizalarim' })
  list(@CurrentUser('sub') userId: string): Promise<ApplicationDto[]> {
    return this.service.list(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ariza tafsiloti va status tarixi' })
  get(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<ApplicationDto> {
    return this.service.get(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Yangi ariza (qoralama) yaratish' })
  create(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(createApplicationSchema)) body: CreateApplicationInput,
  ): Promise<ApplicationDto> {
    return this.service.create(userId, body.subsidyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Qoralamani to‘ldirish' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(zodBody(updateApplicationSchema)) body: UpdateApplicationInput,
  ): Promise<ApplicationDto> {
    return this.service.update(userId, id, body);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Arizaga hujjat biriktirish' })
  attach(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(zodBody(attachSchema)) body: z.infer<typeof attachSchema>,
  ): Promise<ApplicationDto> {
    return this.service.attachDocument(userId, id, body.documentId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Arizani yuborish (elektron tasdiqlash bilan)' })
  submit(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(zodBody(submitApplicationSchema)) body: SubmitApplicationInput,
  ): Promise<ApplicationDto> {
    return this.service.submit(userId, id, body);
  }

  @Post(':id/resubmit')
  @ApiOperation({ summary: 'Tuzatilgan arizani qayta yuborish' })
  resubmit(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body(zodBody(submitApplicationSchema)) body: SubmitApplicationInput,
  ): Promise<ApplicationDto> {
    return this.service.resubmit(userId, id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Arizani bekor qilish' })
  cancel(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<ApplicationDto> {
    return this.service.cancel(userId, id);
  }
}
