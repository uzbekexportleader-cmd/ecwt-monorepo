import { Body, Controller, Get, Ip, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ContractDto, ContractPreviewDto } from '@ecwt/types';
import {
  contractSignedSchema,
  contractTemplateSchema,
  type ContractSignedInput,
  type ContractTemplateInput,
} from '@ecwt/validation';

import { ContractService } from './contract.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('contract')
@UseGuards(RolesGuard)
@Controller('contract')
export class ContractController {
  constructor(private readonly service: ContractService) {}

  @Get()
  @ApiOperation({ summary: 'Mening shartnomam: to‘ldirilgan matn va holat' })
  preview(@CurrentUser('sub') userId: string): Promise<ContractPreviewDto> {
    return this.service.preview(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Shartnoma tuzish' })
  create(@CurrentUser('sub') userId: string): Promise<ContractDto> {
    return this.service.create(userId);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Shartnomani tasdiqlash (hunarmand)' })
  accept(@CurrentUser('sub') userId: string, @Ip() ip: string): Promise<ContractDto> {
    return this.service.accept(userId, ip ?? null);
  }

  @Post('send')
  @ApiOperation({ summary: 'Elektron imzoga yuborish' })
  send(@CurrentUser('sub') userId: string): Promise<ContractDto> {
    return this.service.sendForSigning(userId);
  }

  /* ------------------------------ shablon ------------------------------- */

  @Get('templates')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Shablon versiyalari (administrator)' })
  templates() {
    return this.service.listTemplates();
  }

  @Post('templates')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Yangi shablon versiyasini saqlash (administrator)' })
  saveTemplate(
    @Body(zodBody(contractTemplateSchema)) body: ContractTemplateInput,
    @CurrentUser('sub') actorId: string,
  ) {
    return this.service.saveTemplate(body.title, body.body, actorId);
  }

  /* ----------------------------- operator ------------------------------- */

  @Post(':userId/signed')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Imzolangan deb belgilash (administrator)' })
  markSigned(
    @Param('userId') userId: string,
    @Body(zodBody(contractSignedSchema)) body: ContractSignedInput,
    @CurrentUser('sub') actorId: string,
  ): Promise<ContractDto> {
    return this.service.markSigned(userId, body.documentId ?? null, actorId);
  }
}
