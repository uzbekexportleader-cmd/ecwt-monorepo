import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  actorName?: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

/**
 * Har bir admin harakati va muhim domen voqeasi audit jurnaliga yoziladi.
 * Jurnal append-only — o'chirish yoki tahrirlash API'si yo'q.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          actorName: entry.actorName ?? 'Tizim',
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          metadata: (entry.metadata ?? undefined) as never,
          ip: entry.ip ?? null,
        },
      });
    } catch (error) {
      // Audit yozuvi asosiy amalni to'xtatmasligi kerak
      this.logger.error(`Audit yozib bo'lmadi: ${entry.action}`, error as Error);
    }
  }
}
