import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminMetricsDto,
  ApplicationDto,
  ApplicationStatus,
  Paginated,
  SubsidyDto,
} from '@ecwt/types';
import type { ChangeStatusInput, UpsertSubsidyInput } from '@ecwt/validation';

import { PrismaService } from '../../prisma/prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationStateService } from '../applications/application-state.service';
import { SubsidiesService } from '../subsidies/subsidies.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly state: ApplicationStateService,
    private readonly subsidies: SubsidiesService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /* ------------------------------ metrikalar ---------------------------- */

  async metrics(): Promise<AdminMetricsDto> {
    const [users, artisans, applications, pending, approved, rejected, paid, products, paidSum] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.artisanProfile.count({ where: { completionPercent: { gt: 30 } } }),
        this.prisma.subsidyApplication.count(),
        this.prisma.subsidyApplication.count({
          where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'SCORING', 'LOCAL_REVIEW'] } },
        }),
        this.prisma.subsidyApplication.count({ where: { status: 'APPROVED' } }),
        this.prisma.subsidyApplication.count({ where: { status: 'REJECTED' } }),
        this.prisma.subsidyApplication.count({ where: { status: 'PAID' } }),
        this.prisma.product.count(),
        this.prisma.subsidyApplication.aggregate({
          where: { status: 'PAID' },
          _sum: { approvedAmount: true },
        }),
      ]);

    return {
      users,
      artisans,
      applications,
      pending,
      approved,
      rejected,
      paid,
      products,
      paidAmount: paidSum._sum.approvedAmount ?? 0,
    };
  }

  /* ----------------------------- foydalanuvchi -------------------------- */

  /**
   * Bitta hunarmandning TO'LIQ kartochkasi.
   *
   * Ro'yxatdan o'tishning barcha 10 qadamida to'plangan javoblar, yuklangan
   * hujjatlar va tekshiruv holatlari bir joyda — xodim boshqa ekranlarga
   * o'tmasdan ariza bilan tanishishi uchun.
   *
   * Maxfiylik: JShShIR va bank hisobi niqoblangan holda qaytadi (profil
   * servisidagi qoida bilan bir xil), karta raqami esa umuman saqlanmaydi.
   */
  async userCard(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: { include: { craftCategory: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        _count: { select: { applications: true, products: true } },
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const p = user.profile;

    return {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      applicationsCount: user._count.applications,
      productsCount: user._count.products,

      profile: p
        ? {
            completionPercent: p.completionPercent,
            onboardingStage: p.onboardingStage,

            firstName: p.firstName,
            lastName: p.lastName,
            middleName: p.middleName,
            birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : null,
            gender: p.gender,
            pinfl: p.pinfl ? maskTail(p.pinfl, 2) : null,
            passportSeries: p.passportSeries,
            // Pasport raqami ham JShShIR kabi maxsus toifadagi shaxsiy
            // ma'lumot — admin panelda to'liq ko'rsatilmaydi.
            passportNumber: p.passportNumber ? maskTail(p.passportNumber, 3) : null,

            region: p.region,
            district: p.district,
            mahalla: p.mahalla,
            street: p.street,
            houseNumber: p.houseNumber,
            contactPhone: p.contactPhone,

            activityType: p.activityType,
            craft: p.craftCategory?.nameUz ?? null,
            yearsOfExperience: p.yearsOfExperience,
            businessType: p.businessType,
            stir: p.stir,
            membershipStatus: p.membershipStatus,
            membershipNumber: p.membershipNumber,
            description: p.description,

            selectedMarketplaces: p.selectedMarketplaces,
            wantsBrandSite: p.wantsBrandSite,
            wantsDropshipping: p.wantsDropshipping,
            wantsChinaImport: p.wantsChinaImport,
            paymentMethod: p.paymentMethod,

            bankAccount: p.bankAccount ? maskTail(p.bankAccount, 4) : null,
            bankMfo: p.bankMfo,
            bankName: p.bankName,
            bankSwift: p.bankSwift,
            bankHolderName: p.bankHolderName,

            identityVerification: p.identityVerification,
            faceVerification: p.faceVerification,
            businessVerification: p.businessVerification,
            membershipVerification: p.membershipVerification,
            bankVerification: p.bankVerification,
            contractSignedAt: p.contractSignedAt?.toISOString() ?? null,
          }
        : null,

      documents: user.documents.map((d) => ({
        id: d.id,
        type: d.type,
        fileName: d.fileName,
        sizeBytes: d.sizeBytes,
        verified: d.verified,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }

  async users(page = 1, pageSize = 20, search?: string): Promise<Paginated<Record<string, unknown>>> {
    const where = search
      ? {
          OR: [
            { phone: { contains: search } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: {
            select: {
              completionPercent: true,
              region: true,
              businessType: true,
              membershipStatus: true,
              craftCategory: { select: { nameUz: true } },
            },
          },
          _count: { select: { applications: true, products: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        phone: u.phone,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        completionPercent: u.profile?.completionPercent ?? 0,
        region: u.profile?.region ?? null,
        businessType: u.profile?.businessType ?? 'NONE',
        membershipStatus: u.profile?.membershipStatus ?? 'NONE',
        craft: u.profile?.craftCategory?.nameUz ?? null,
        applicationsCount: u._count.applications,
        productsCount: u._count.products,
      })),
      total,
      page,
      pageSize,
    };
  }

  /* -------------------------------- arizalar ---------------------------- */

  async applicationsList(
    page = 1,
    pageSize = 20,
    filters: { status?: ApplicationStatus; search?: string } = {},
  ): Promise<Paginated<ApplicationDto>> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { number: { contains: filters.search, mode: 'insensitive' } },
        { user: { phone: { contains: filters.search } } },
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.subsidyApplication.findMany({
        where: where as never,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          subsidy: { select: { id: true, title: true, organization: true, processingDays: true, isDemo: true } },
          documents: { include: { document: true } },
          history: { orderBy: { createdAt: 'asc' } },
          user: { select: { fullName: true, phone: true } },
        },
      }),
      this.prisma.subsidyApplication.count({ where: where as never }),
    ]);

    return {
      items: rows.map((r) => ({
        ...this.applications.toDto(r),
        applicantName: r.user.fullName,
        applicantPhone: r.user.phone,
      })) as ApplicationDto[],
      total,
      page,
      pageSize,
    };
  }

  async application(id: string): Promise<ApplicationDto> {
    const app = await this.prisma.subsidyApplication.findUnique({
      where: { id },
      include: {
        subsidy: { select: { id: true, title: true, organization: true, processingDays: true, isDemo: true } },
        documents: { include: { document: true } },
        history: { orderBy: { createdAt: 'asc' } },
        user: { select: { fullName: true, phone: true } },
      },
    });
    if (!app) throw new NotFoundException('Ariza topilmadi');

    /*
     * Ariza yuborilganda saqlangan moslik natijasidan tasdiqlanmagan
     * da'volarni ajratib olamiz. Bular foydalanuvchi o'zi kiritgan, lekin
     * davlat reyestri orqali tekshirilmagan ma'lumotlar (masalan uyushma
     * a'zoligi) — xodim ularni qo'lda tekshirishi kerak.
     */
    const snapshot = app.profileSnapshot as { eligibility?: { unverified?: unknown } } | null;
    const unverified = snapshot?.eligibility?.unverified;

    return {
      ...this.applications.toDto(app),
      applicantName: app.user.fullName,
      applicantPhone: app.user.phone,
      unverifiedClaims: Array.isArray(unverified) ? unverified : [],
    } as ApplicationDto;
  }

  async changeStatus(
    id: string,
    input: ChangeStatusInput,
    actor: { id: string; name: string },
  ): Promise<ApplicationDto> {
    await this.state.transition(id, input.toStatus, actor, {
      comment: input.comment,
      reason: input.reason,
      approvedAmount: input.approvedAmount,
    });
    return this.application(id);
  }

  /* ------------------------------- subsidiya ---------------------------- */

  async subsidiesList(): Promise<SubsidyDto[]> {
    const rows = await this.prisma.subsidy.findMany({
      include: { requirements: true, requiredDocuments: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.subsidies.toDto(r));
  }

  async upsertSubsidy(
    input: UpsertSubsidyInput,
    actor: { id: string; name: string },
    id?: string,
  ): Promise<SubsidyDto> {
    const { requirements, requiredDocuments, activeFrom, activeUntil, ...data } = input;
    const scalar = {
      ...data,
      activeFrom: activeFrom ? new Date(activeFrom) : null,
      activeUntil: activeUntil ? new Date(activeUntil) : null,
    };

    /*
     * Hammasi bitta tranzaksiyada: eski talablar o'chirilib, yangilari
     * yozilmay qolsa, subsidiya "talabsiz" holatda qolardi — bunday
     * subsidiya barcha foydalanuvchilarga avtomatik "mos" ko'rinadi
     * (eligibility mantig'i talab bo'lmasa ELIGIBLE qaytaradi).
     * Tranzaksiya bu oraliq holatni butunlay yo'q qiladi.
     */
    const subsidy = await this.prisma.$transaction(async (tx) => {
      const saved = id
        ? await tx.subsidy.update({ where: { id }, data: scalar as never })
        : await tx.subsidy.create({ data: scalar as never });

      await tx.subsidyRequirement.deleteMany({ where: { subsidyId: saved.id } });
      await tx.subsidyDocumentRequirement.deleteMany({ where: { subsidyId: saved.id } });

      if (requirements.length) {
        await tx.subsidyRequirement.createMany({
          data: requirements.map((r, i) => ({
            subsidyId: saved.id,
            type: r.type,
            condition: r.condition as never,
            humanReadableText: r.humanReadableText,
            fixRoute: r.fixRoute ?? null,
            fixLabel: r.fixLabel ?? null,
            order: r.order ?? i,
          })),
        });
      }
      if (requiredDocuments.length) {
        await tx.subsidyDocumentRequirement.createMany({
          data: requiredDocuments.map((d) => ({
            subsidyId: saved.id,
            documentType: d.documentType,
            title: d.title,
            hint: d.hint ?? null,
            isOptional: d.isOptional ?? false,
          })),
        });
      }

      return saved;
    });

    await this.audit.record({
      actorId: actor.id,
      actorName: actor.name,
      action: id ? 'subsidy.update' : 'subsidy.create',
      entity: 'Subsidy',
      entityId: subsidy.id,
    });

    return this.subsidies.getById(subsidy.id);
  }

  /* ------------------------------- audit log ---------------------------- */

  async auditLog(page = 1, pageSize = 50): Promise<Paginated<Record<string, unknown>>> {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);
    return {
      items: items.map((a) => ({
        id: a.id,
        action: a.action,
        actorName: a.actorName,
        entity: a.entity,
        entityId: a.entityId,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  /* ---------------------------- bildirishnoma --------------------------- */

  async sendNotification(
    input: { userIds?: string[]; title: string; body: string; route?: string | null },
    actor: { id: string; name: string },
  ): Promise<{ sent: number }> {
    const userIds =
      input.userIds?.length
        ? input.userIds
        : (await this.prisma.user.findMany({ where: { role: 'USER' }, select: { id: true } })).map(
            (u) => u.id,
          );

    const sent = await this.notifications.createMany(userIds, {
      type: 'SYSTEM',
      title: input.title,
      body: input.body,
      route: input.route ?? null,
    });

    await this.audit.record({
      actorId: actor.id,
      actorName: actor.name,
      action: 'notification.broadcast',
      entity: 'Notification',
      metadata: { count: sent },
    });

    return { sent };
  }

  /* --------------------------- hujjat tasdiqlash ------------------------ */

  async verifyDocument(
    documentId: string,
    verified: boolean,
    actor: { id: string; name: string },
  ): Promise<void> {
    await this.prisma.document.update({ where: { id: documentId }, data: { verified } });
    await this.audit.record({
      actorId: actor.id,
      actorName: actor.name,
      action: verified ? 'document.verify' : 'document.reject',
      entity: 'Document',
      entityId: documentId,
    });
  }

  async setProfileVerification(
    userId: string,
    kind: 'identity' | 'business' | 'membership' | 'bank',
    status: 'VERIFIED' | 'FAILED' | 'PENDING',
    actor: { id: string; name: string },
  ): Promise<void> {
    const field = {
      identity: 'identityVerification',
      business: 'businessVerification',
      membership: 'membershipVerification',
      bank: 'bankVerification',
    }[kind];

    await this.prisma.artisanProfile.update({
      where: { userId },
      data: { [field]: status } as never,
    });

    await this.audit.record({
      actorId: actor.id,
      actorName: actor.name,
      action: `profile.verification.${kind}`,
      entity: 'ArtisanProfile',
      entityId: userId,
      metadata: { status },
    });
  }
}

/** Raqamning oxirgi bir necha belgisidan boshqasini yashiradi */
function maskTail(value: string, visible: number): string {
  if (value.length <= visible) return '•'.repeat(value.length);
  return '•'.repeat(value.length - visible) + value.slice(-visible);
}
