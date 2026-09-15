import { Injectable, Logger } from '@nestjs/common';
import type { NotificationDto, NotificationType } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /**
   * In-app bildirishnoma yaratadi va qurilmaga push yuboradi.
   *
   * Push kutilmaydi (`void`): u tashqi xizmatga bog'liq, sekin bo'lishi
   * mumkin va yetib bormasa ham bildirishnoma ilova ichida ko'rinadi.
   */
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    route?: string | null;
  }): Promise<NotificationDto> {
    const n = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        route: params.route ?? null,
      },
    });

    void this.push
      .sendToUsers([params.userId], {
        title: params.title,
        body: params.body,
        route: params.route,
      })
      .catch((err: Error) => this.logger.warn(`Push: ${err.message}`));

    return this.toDto(n);
  }

  async createMany(
    userIds: string[],
    params: { type: NotificationType; title: string; body: string; route?: string | null },
  ): Promise<number> {
    if (!userIds.length) return 0;
    const result = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        route: params.route ?? null,
      })),
    });

    void this.push
      .sendToUsers(userIds, { title: params.title, body: params.body, route: params.route })
      .catch((err: Error) => this.logger.warn(`Push: ${err.message}`));

    return result.count;
  }

  async list(userId: string): Promise<NotificationDto[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toDto(r));
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  private toDto(n: {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    route: string | null;
    isRead: boolean;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      route: n.route,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
