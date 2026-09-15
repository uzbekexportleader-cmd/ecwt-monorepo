import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  changeStatusSchema,
  sendNotificationSchema,
  upsertSubsidySchema,
  type ChangeStatusInput,
  type SendNotificationInput,
  type UpsertSubsidyInput,
} from '@ecwt/validation';
import type { AdminMetricsDto, ApplicationDto, ApplicationStatus, SubsidyDto } from '@ecwt/types';

import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

const verifyDocSchema = z.object({ verified: z.boolean() });
const verifyProfileSchema = z.object({
  kind: z.enum(['identity', 'business', 'membership', 'bank']),
  status: z.enum(['VERIFIED', 'FAILED', 'PENDING']),
});

@ApiTags('admin')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles('REVIEWER')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Dashboard ko‘rsatkichlari' })
  metrics(): Promise<AdminMetricsDto> {
    return this.service.metrics();
  }

  @Get('users')
  @Roles('ADMIN')
  users(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.service.users(Number(page ?? 1), Number(pageSize ?? 20), search);
  }

  @Get('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Hunarmandning to‘liq kartochkasi' })
  userCard(@Param('id') id: string) {
    return this.service.userCard(id);
  }

  @Get('applications')
  applications(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: ApplicationStatus,
    @Query('search') search?: string,
  ) {
    return this.service.applicationsList(Number(page ?? 1), Number(pageSize ?? 20), { status, search });
  }

  @Get('applications/:id')
  application(@Param('id') id: string): Promise<ApplicationDto> {
    return this.service.application(id);
  }

  @Post('applications/:id/status')
  @ApiOperation({ summary: 'Ariza statusini o‘zgartirish (state machine tekshiradi)' })
  changeStatus(
    @Param('id') id: string,
    @Body(zodBody(changeStatusSchema)) body: ChangeStatusInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApplicationDto> {
    return this.service.changeStatus(id, body, { id: user.sub, name: `Xodim (${user.role})` });
  }

  @Get('subsidies')
  subsidies(): Promise<SubsidyDto[]> {
    return this.service.subsidiesList();
  }

  @Post('subsidies')
  @Roles('ADMIN')
  createSubsidy(
    @Body(zodBody(upsertSubsidySchema)) body: UpsertSubsidyInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<SubsidyDto> {
    return this.service.upsertSubsidy(body, { id: user.sub, name: `Admin (${user.phone})` });
  }

  @Put('subsidies/:id')
  @Roles('ADMIN')
  updateSubsidy(
    @Param('id') id: string,
    @Body(zodBody(upsertSubsidySchema)) body: UpsertSubsidyInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<SubsidyDto> {
    return this.service.upsertSubsidy(body, { id: user.sub, name: `Admin (${user.phone})` }, id);
  }

  @Post('documents/:id/verify')
  async verifyDocument(
    @Param('id') id: string,
    @Body(zodBody(verifyDocSchema)) body: z.infer<typeof verifyDocSchema>,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ ok: true }> {
    await this.service.verifyDocument(id, body.verified, { id: user.sub, name: `Xodim (${user.role})` });
    return { ok: true };
  }

  @Post('users/:userId/verification')
  async verifyProfile(
    @Param('userId') userId: string,
    @Body(zodBody(verifyProfileSchema)) body: z.infer<typeof verifyProfileSchema>,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ ok: true }> {
    await this.service.setProfileVerification(userId, body.kind, body.status, {
      id: user.sub,
      name: `Xodim (${user.role})`,
    });
    return { ok: true };
  }

  @Get('audit-log')
  @Roles('ADMIN')
  auditLog(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.auditLog(Number(page ?? 1), Number(pageSize ?? 50));
  }

  @Post('notifications')
  @Roles('ADMIN')
  sendNotification(
    @Body(zodBody(sendNotificationSchema)) body: SendNotificationInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ sent: number }> {
    return this.service.sendNotification(body, { id: user.sub, name: `Admin (${user.phone})` });
  }
}
