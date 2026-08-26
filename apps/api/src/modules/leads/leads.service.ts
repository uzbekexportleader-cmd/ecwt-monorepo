import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateLeadInput,
  type Lead as LeadDto,
  type LeadListQuery,
  type Paginated,
  type UpdateLeadInput,
} from '@ecwt/contracts';
import type { Lead, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { paginate, toSkipTake } from '../../common/pagination';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Saytdagi ariza formasi. Ochiq endpoint.
   *
   * Honeypot: `website` maydonini faqat bot to'ldiradi (u foydalanuvchiga
   * ko'rinmaydi). To'ldirilgan bo'lsa muvaffaqiyat qaytaramiz, lekin
   * saqlamaymiz — bot xato ko'rmasa, formani qayta urinmaydi.
   */
  async create(input: CreateLeadInput, ip?: string): Promise<{ ok: true }> {
    if (input.website) {
      this.logger.warn(`Honeypot ishga tushdi (ip=${ip ?? '-'}), ariza saqlanmadi`);
      return { ok: true };
    }

    // Bir xil raqamdan 10 daqiqada takroriy ariza — saqlamaymiz.
    // Foydalanuvchi tugmani ikki marta bosgan bo'lishi mumkin.
    const recent = await this.prisma.lead.findFirst({
      where: {
        phone: input.phone,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (recent) {
      this.logger.log(`Takroriy ariza e’tiborsiz qoldirildi: ${input.phone}`);
      return { ok: true };
    }

    await this.prisma.lead.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        companyName: input.companyName ?? null,
        productCategory: input.productCategory ?? null,
        message: input.message ?? null,
        locale: input.locale ?? 'uz',
        source: input.source ?? null,
        ip,
        status: 'NEW',
      },
    });

    this.logger.log(`Yangi ariza: ${input.name} (${input.phone})`);

    return { ok: true };
  }

  async list(query: LeadListQuery): Promise<Paginated<LeadDto>> {
    const where: Prisma.LeadWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = toSkipTake(query);

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({ where, skip, take, orderBy: { createdAt: query.order } }),
      this.prisma.lead.count({ where }),
    ]);

    return paginate(items.map(toLeadDto), total, query);
  }

  async update(leadId: string, input: UpdateLeadInput): Promise<LeadDto> {
    const existing = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });
    if (!existing) throw AppError.notFound('Ariza topilmadi');

    const lead = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: input.status,
        ...(input.note !== undefined ? { note: input.note } : {}),
      },
    });

    return toLeadDto(lead);
  }
}

function toLeadDto(lead: Lead): LeadDto {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    companyName: lead.companyName,
    productCategory: lead.productCategory,
    message: lead.message,
    locale: lead.locale,
    source: lead.source,
    status: lead.status,
    note: lead.note,
    createdAt: lead.createdAt.toISOString(),
  };
}
