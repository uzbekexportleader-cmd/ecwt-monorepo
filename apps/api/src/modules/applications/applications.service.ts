import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { ApplicationDto, ApplicationStatus } from '@ecwt/types';
import type { SubmitApplicationInput, UpdateApplicationInput } from '@ecwt/validation';

import { PrismaService } from '../../prisma/prisma.service';
import { SubsidiesService } from '../subsidies/subsidies.service';
import { EligibilityService } from '../subsidies/eligibility.service';
import { ApplicationStateService } from './application-state.service';
import { DocumentsService } from '../documents/documents.service';
import { SIGNATURE_PROVIDER, type DigitalSignatureProvider } from '../signature/signature.provider';
import { AuditService } from '../../common/audit/audit.service';

const OPEN_STATUSES: ApplicationStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_CORRECTION',
  'SCORING',
  'LOCAL_REVIEW',
  'APPROVED',
  'PAYMENT_PROCESSING',
];

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subsidies: SubsidiesService,
    private readonly eligibility: EligibilityService,
    private readonly state: ApplicationStateService,
    private readonly documents: DocumentsService,
    private readonly audit: AuditService,
    @Inject(SIGNATURE_PROVIDER) private readonly signature: DigitalSignatureProvider,
  ) {}

  /* -------------------------------- CRUD -------------------------------- */

  async create(userId: string, subsidyId: string): Promise<ApplicationDto> {
    const subsidy = await this.prisma.subsidy.findUnique({
      where: { id: subsidyId },
      include: { requirements: true },
    });
    if (!subsidy) throw new NotFoundException('Subsidiya topilmadi');
    if (subsidy.status !== 'ACTIVE') {
      throw new BadRequestException('Bu dastur hozirda faol emas');
    }

    const existing = await this.prisma.subsidyApplication.findFirst({
      where: { userId, subsidyId, status: { in: OPEN_STATUSES } },
    });
    if (existing) {
      throw new ConflictException(
        'Bu dastur bo‘yicha ochiq arizangiz allaqachon mavjud. Uni davom ettiring.',
      );
    }

    const facts = await this.subsidies.buildFacts(userId);
    const number = await this.nextNumber();

    const app = await this.prisma.subsidyApplication.create({
      data: {
        number,
        userId,
        subsidyId,
        status: 'DRAFT',
        requestedAmount: this.eligibility.estimateAmount(subsidy, facts),
        formData: {},
      },
    });

    await this.audit.record({
      actorId: userId,
      action: 'application.create',
      entity: 'SubsidyApplication',
      entityId: app.id,
      metadata: { subsidyId },
    });

    return this.get(userId, app.id);
  }

  async update(userId: string, id: string, input: UpdateApplicationInput): Promise<ApplicationDto> {
    const app = await this.findOwned(userId, id);
    if (app.status !== 'DRAFT' && app.status !== 'NEEDS_CORRECTION') {
      throw new BadRequestException('Yuborilgan arizani tahrirlab bo‘lmaydi');
    }

    const formData = {
      ...((app.formData as Record<string, unknown>) ?? {}),
      ...(input.formData ?? {}),
    };

    // Xarajatga bog'liq summani qayta hisoblaymiz
    const subsidy = await this.prisma.subsidy.findUniqueOrThrow({
      where: { id: app.subsidyId },
      include: { requirements: true },
    });
    const facts = await this.subsidies.buildFacts(userId, formData);
    const requestedAmount =
      input.requestedAmount ?? this.eligibility.estimateAmount(subsidy, facts) ?? app.requestedAmount;

    await this.prisma.subsidyApplication.update({
      where: { id },
      data: { formData: formData as never, requestedAmount },
    });

    if (input.documentIds?.length) {
      for (const documentId of input.documentIds) {
        await this.attachDocument(userId, id, documentId);
      }
    }

    return this.get(userId, id);
  }

  async attachDocument(userId: string, applicationId: string, documentId: string): Promise<ApplicationDto> {
    const app = await this.findOwned(userId, applicationId);
    if (app.status !== 'DRAFT' && app.status !== 'NEEDS_CORRECTION') {
      throw new BadRequestException('Bu bosqichda hujjat qo‘shib bo‘lmaydi');
    }
    const doc = await this.prisma.document.findFirst({ where: { id: documentId, userId } });
    if (!doc) throw new NotFoundException('Hujjat topilmadi');

    await this.prisma.applicationDocument.upsert({
      where: { applicationId_documentId: { applicationId, documentId } },
      create: { applicationId, documentId, documentType: doc.type },
      update: {},
    });
    return this.get(userId, applicationId);
  }

  /* ------------------------------- yuborish ----------------------------- */

  async submit(userId: string, id: string, input: SubmitApplicationInput): Promise<ApplicationDto> {
    const app = await this.findOwned(userId, id);
    if (app.status !== 'DRAFT' && app.status !== 'NEEDS_CORRECTION') {
      throw new BadRequestException('Bu ariza allaqachon yuborilgan');
    }

    const subsidy = await this.prisma.subsidy.findUniqueOrThrow({
      where: { id: app.subsidyId },
      include: { requirements: true, requiredDocuments: true },
    });

    // 1. Moslik tekshiruvi
    const formData = (app.formData as Record<string, unknown>) ?? {};
    const facts = await this.subsidies.buildFacts(userId, formData);
    const eligibility = this.eligibility.evaluate(subsidy, facts);
    if (eligibility.verdict === 'NOT_ELIGIBLE') {
      throw new BadRequestException({
        message: 'Talablar bajarilmagani uchun arizani yuborib bo‘lmaydi',
        code: 'NOT_ELIGIBLE',
        details: eligibility.checks.filter((c) => c.result === 'FAILED'),
      });
    }

    // 2. Majburiy hujjatlar
    const attached = await this.prisma.applicationDocument.findMany({
      where: { applicationId: id },
      select: { documentType: true },
    });
    const attachedTypes = new Set(attached.map((a) => a.documentType));
    const missing = subsidy.requiredDocuments.filter((d) => !d.isOptional && !attachedTypes.has(d.documentType));
    if (missing.length) {
      throw new BadRequestException({
        message: `Hujjat yetishmayapti: ${missing.map((m) => m.title).join(', ')}`,
        code: 'DOCUMENTS_MISSING',
        details: missing.map((m) => ({ documentType: m.documentType, title: m.title })),
      });
    }

    // 3. Profil nusxasi va elektron tasdiqlash
    const profile = await this.prisma.artisanProfile.findUniqueOrThrow({ where: { userId } });
    const snapshot = {
      profile: JSON.parse(JSON.stringify(profile, dateReplacer)) as Record<string, unknown>,
      formData,
      subsidyVersion: subsidy.updatedAt.toISOString(),
      capturedAt: new Date().toISOString(),
      /*
       * Moslik natijasi ham saqlanadi. Muhimi — `NEEDS_CHECK` bandlar:
       * bular foydalanuvchi O'ZI kiritgan, lekin davlat reyestri orqali
       * hali TASDIQLANMAGAN da'volar (masalan uyushma a'zoligi). Ariza
       * ko'rib chiquvchi xodim ularni qo'lda tekshirishi shart — shuning
       * uchun ro'yxat arizaga biriktirib qo'yiladi.
       */
      eligibility: {
        verdict: eligibility.verdict,
        matchPercent: eligibility.matchPercent,
        unverified: eligibility.checks
          .filter((c) => c.result === 'NEEDS_CHECK')
          .map((c) => ({ type: c.type, text: c.text, reason: c.reason })),
      },
    };
    const documentHash = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
    const signed = await this.signature.sign({
      userId,
      documentHash,
      token: input.signatureToken,
    });

    await this.prisma.subsidyApplication.update({
      where: { id },
      data: {
        profileSnapshot: {
          ...snapshot,
          signature: {
            ref: signed.signatureRef,
            provider: signed.provider,
            isCryptographic: signed.isCryptographic,
            signedAt: signed.signedAt,
          },
        } as never,
        signatureRef: signed.signatureRef,
        requestedAmount: eligibility.estimatedAmount ?? app.requestedAmount,
      },
    });

    // 4. Status: SUBMITTED → avtomatik UNDER_REVIEW (dastlabki qabul)
    const actor = { id: userId, name: 'Ariza beruvchi' };
    await this.state.transition(id, 'SUBMITTED', actor, { comment: 'Ariza elektron tasdiqlandi' });
    await this.state.transition(id, 'UNDER_REVIEW', { id: null, name: 'Tizim' }, {
      comment: 'Dastlabki tekshiruvga qabul qilindi',
    });

    return this.get(userId, id);
  }

  async resubmit(userId: string, id: string, input: SubmitApplicationInput): Promise<ApplicationDto> {
    const app = await this.findOwned(userId, id);
    if (app.status !== 'NEEDS_CORRECTION') {
      throw new BadRequestException('Faqat tuzatishga qaytarilgan arizani qayta yuborish mumkin');
    }
    return this.submit(userId, id, input);
  }

  async cancel(userId: string, id: string): Promise<ApplicationDto> {
    const app = await this.findOwned(userId, id);
    await this.state.transition(id, 'CANCELLED', { id: userId, name: 'Ariza beruvchi' }, {
      comment: 'Foydalanuvchi tomonidan bekor qilindi',
    });
    void app;
    return this.get(userId, id);
  }

  /* --------------------------------- o'qish ----------------------------- */

  async list(userId: string): Promise<ApplicationDto[]> {
    const rows = await this.prisma.subsidyApplication.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        subsidy: { select: { id: true, title: true, organization: true, processingDays: true, isDemo: true } },
        documents: { include: { document: true } },
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
    return rows.map((r) => this.toDto(r));
  }

  async get(userId: string, id: string): Promise<ApplicationDto> {
    const app = await this.prisma.subsidyApplication.findFirst({
      where: { id, userId },
      include: {
        subsidy: { select: { id: true, title: true, organization: true, processingDays: true, isDemo: true } },
        documents: { include: { document: true } },
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!app) throw new NotFoundException('Ariza topilmadi');
    return this.toDto(app);
  }

  private async findOwned(userId: string, id: string) {
    const app = await this.prisma.subsidyApplication.findFirst({ where: { id, userId } });
    if (!app) throw new NotFoundException('Ariza topilmadi');
    return app;
  }

  private async nextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.subsidyApplication.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
    });
    return `ARZ-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  toDto(app: {
    id: string;
    number: string;
    subsidyId: string;
    subsidy?: { id: string; title: string; organization: string; processingDays: number; isDemo: boolean };
    status: ApplicationStatus;
    requestedAmount: number | null;
    approvedAmount: number | null;
    formData: unknown;
    rejectionReason: string | null;
    correctionNote: string | null;
    submittedAt: Date | null;
    decidedAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    documents?: {
      id: string;
      documentType: ApplicationDto['documents'][number]['documentType'];
      document: Parameters<DocumentsService['toDto']>[0];
    }[];
    history?: {
      id: string;
      fromStatus: ApplicationStatus | null;
      toStatus: ApplicationStatus;
      comment: string | null;
      reasonCode: string | null;
      actorName: string;
      createdAt: Date;
    }[];
  }): ApplicationDto {
    return {
      id: app.id,
      number: app.number,
      subsidyId: app.subsidyId,
      subsidy: app.subsidy,
      status: app.status,
      requestedAmount: app.requestedAmount,
      approvedAmount: app.approvedAmount,
      formData: (app.formData ?? {}) as Record<string, unknown>,
      rejectionReason: app.rejectionReason,
      correctionNote: app.correctionNote,
      submittedAt: app.submittedAt?.toISOString() ?? null,
      decidedAt: app.decidedAt?.toISOString() ?? null,
      paidAt: app.paidAt?.toISOString() ?? null,
      documents: (app.documents ?? []).map((d) => ({
        id: d.id,
        documentType: d.documentType,
        document: this.documents.toDto(d.document),
      })),
      history: (app.history ?? []).map((h) => ({
        id: h.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        comment: h.comment,
        reasonCode: h.reasonCode,
        actorName: h.actorName,
        createdAt: h.createdAt.toISOString(),
      })),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }
}

function dateReplacer(_key: string, value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value;
}
