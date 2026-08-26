import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
  requestId?: string;
}

/**
 * Muhim amallar tarixi: kim, qachon, nimani o'zgartirdi.
 *
 * Audit yozuvi asosiy amalni to'xtatmasligi kerak — agar log yozishda
 * xato bo'lsa, u faqat log'ga chiqadi va so'rov muvaffaqiyatli yakunlanadi.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorUserId: entry.actorUserId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata,
          ip: entry.ip,
          requestId: entry.requestId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Audit yozuvini saqlab bo‘lmadi: ${entry.action} ${entry.entityType}/${entry.entityId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async listForEntity(entityType: string, entityId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
  }
}
