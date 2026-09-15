import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { NotificationDto } from '@ecwt/types';
import { registerDeviceSchema, type RegisterDeviceInput } from '@ecwt/validation';

import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Bildirishnomalar ro‘yxati' })
  list(@CurrentUser('sub') userId: string): Promise<NotificationDto[]> {
    return this.service.list(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'O‘qilmagan bildirishnomalar soni' })
  async unread(@CurrentUser('sub') userId: string): Promise<{ count: number }> {
    return { count: await this.service.unreadCount(userId) };
  }

  @Post(':id/read')
  @HttpCode(204)
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string): Promise<void> {
    return this.service.markRead(userId, id);
  }

  @Post('read-all')
  @HttpCode(204)
  markAllRead(@CurrentUser('sub') userId: string): Promise<void> {
    return this.service.markAllRead(userId);
  }

  @Post('device')
  @HttpCode(204)
  @ApiOperation({ summary: 'Qurilmani push uchun ro‘yxatga olish' })
  registerDevice(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(registerDeviceSchema)) body: RegisterDeviceInput,
  ): Promise<void> {
    return this.push.registerDevice(userId, body.token, body.platform);
  }

  @Delete('device')
  @HttpCode(204)
  @ApiOperation({ summary: 'Qurilmani push ro‘yxatidan chiqarish' })
  unregisterDevice(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(registerDeviceSchema)) body: RegisterDeviceInput,
  ): Promise<void> {
    return this.push.unregisterDevice(userId, body.token);
  }
}
