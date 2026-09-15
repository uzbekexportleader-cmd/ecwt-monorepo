import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ExternalSubsidyDto, MahallaPacketDto } from '@ecwt/types';
import {
  externalSubsidyStatusSchema,
  externalSubsidySubmitSchema,
  type ExternalSubsidyStatusInput,
  type ExternalSubsidySubmitInput,
} from '@ecwt/validation';

import { MahallaSubsidyService } from './mahalla-subsidy.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('mahalla-subsidy')
@Controller('mahalla-subsidy')
export class MahallaSubsidyController {
  constructor(private readonly service: MahallaSubsidyService) {}

  @Get('packet')
  @ApiOperation({ summary: 'online-mahalla.uz formasiga tayyor ma’lumot' })
  packet(@CurrentUser('sub') userId: string): Promise<MahallaPacketDto> {
    return this.service.getPacket(userId);
  }

  @Post('handoff')
  @ApiOperation({ summary: 'Saytga o‘tish qayd etiladi (hali topshirilmagan)' })
  handoff(@CurrentUser('sub') userId: string): Promise<ExternalSubsidyDto> {
    return this.service.startHandoff(userId);
  }

  @Post('submission')
  @ApiOperation({ summary: 'Platformadan olingan ariza raqamini saqlash' })
  submission(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(externalSubsidySubmitSchema)) body: ExternalSubsidySubmitInput,
  ): Promise<ExternalSubsidyDto> {
    return this.service.recordSubmission(userId, body.externalNumber, body.note ?? null);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Ariza holatini qo‘lda yangilash' })
  status(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(externalSubsidyStatusSchema)) body: ExternalSubsidyStatusInput,
  ): Promise<ExternalSubsidyDto> {
    return this.service.updateStatus(userId, body.status, body.note ?? null);
  }
}
