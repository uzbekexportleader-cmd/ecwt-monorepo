import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CompanyInfoDto, Role } from '@ecwt/types';
import {
  companyInfoSchema,
  companyLocationSchema,
  type CompanyInfoInput,
  type CompanyLocationInput,
} from '@ecwt/validation';

import { CompanyService } from './company.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('company')
@UseGuards(RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Kompaniya va asoschi haqida' })
  get(@CurrentUser('role') role: Role | undefined): Promise<CompanyInfoDto> {
    return this.service.get(role);
  }

  @Patch()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Ma’lumotni yangilash (administrator)' })
  update(
    @Body(zodBody(companyInfoSchema)) body: CompanyInfoInput,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') role: Role,
  ): Promise<CompanyInfoDto> {
    return this.service.update(body, actorId, role);
  }

  @Post('location')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Joylashuvni GPS orqali belgilash (administrator)' })
  setLocation(
    @Body(zodBody(companyLocationSchema)) body: CompanyLocationInput,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') role: Role,
  ): Promise<CompanyInfoDto> {
    return this.service.setLocation(body, actorId, role);
  }
}
