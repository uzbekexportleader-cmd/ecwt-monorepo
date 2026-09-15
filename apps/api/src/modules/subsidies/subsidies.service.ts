import { Injectable, NotFoundException } from '@nestjs/common';
import type { EligibilityDto, SubsidyDto, SubsidyWithEligibilityDto } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { EligibilityService, type EligibilityFacts } from './eligibility.service';

@Injectable()
export class SubsidiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibility: EligibilityService,
  ) {}

  /** Profil + hujjatlardan eligibility faktlarini yig'ish. */
  async buildFacts(userId: string, formData: Record<string, unknown> = {}): Promise<EligibilityFacts> {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: { craftCategory: { select: { slug: true } } },
    });
    const documents = await this.prisma.document.findMany({
      where: { userId },
      select: { type: true },
    });

    return {
      age: profile?.birthDate ? ageFrom(profile.birthDate) : null,
      businessType: profile?.businessType ?? 'NONE',
      businessVerified: profile?.businessVerification === 'VERIFIED',
      membershipStatus: profile?.membershipStatus ?? 'NONE',
      membershipVerified: profile?.membershipVerification === 'VERIFIED',
      identityVerified: profile?.identityVerification === 'VERIFIED',
      region: profile?.region ?? null,
      craftCategorySlug: profile?.craftCategory?.slug ?? null,
      apprenticeCount: profile?.apprenticeCount ?? 0,
      hasBankAccount: !!(profile?.bankAccount || profile?.bankCardMasked),
      bankVerified: profile?.bankVerification === 'VERIFIED',
      yearsOfExperience: profile?.yearsOfExperience ?? 0,
      completionPercent: profile?.completionPercent ?? 0,
      hasWorkshop: profile?.hasWorkshop ?? false,
      uploadedDocumentTypes: [...new Set(documents.map((d) => d.type))],
      formData,
    };
  }

  async listWithEligibility(userId: string, onlyEligible = false): Promise<SubsidyWithEligibilityDto[]> {
    const now = new Date();
    const subsidies = await this.prisma.subsidy.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ activeUntil: null }, { activeUntil: { gte: now } }],
      },
      include: { requirements: true, requiredDocuments: true },
      orderBy: { createdAt: 'asc' },
    });

    const facts = await this.buildFacts(userId);
    const result = subsidies.map((s) => ({
      ...this.toDto(s),
      eligibility: this.eligibility.evaluate(s, facts),
    }));

    const sorted = result.sort((a, b) => b.eligibility.matchPercent - a.eligibility.matchPercent);
    return onlyEligible ? sorted.filter((s) => s.eligibility.verdict !== 'NOT_ELIGIBLE') : sorted;
  }

  async getById(id: string): Promise<SubsidyDto> {
    const subsidy = await this.prisma.subsidy.findUnique({
      where: { id },
      include: { requirements: true, requiredDocuments: true },
    });
    if (!subsidy) throw new NotFoundException('Subsidiya topilmadi');
    return this.toDto(subsidy);
  }

  async eligibilityFor(
    userId: string,
    subsidyId: string,
    formData: Record<string, unknown> = {},
  ): Promise<EligibilityDto> {
    const subsidy = await this.prisma.subsidy.findUnique({
      where: { id: subsidyId },
      include: { requirements: true },
    });
    if (!subsidy) throw new NotFoundException('Subsidiya topilmadi');
    const facts = await this.buildFacts(userId, formData);
    return this.eligibility.evaluate(subsidy, facts);
  }

  toDto(s: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    fullDescription: string;
    category: string;
    organization: string;
    legalBasisUrl: string | null;
    applicationUrl: string | null;
    amountType: SubsidyDto['amountType'];
    minAmount: number | null;
    maxAmount: number | null;
    amountFactor: number | null;
    amountPerApprentice: boolean;
    processingDays: number;
    activeFrom: Date | null;
    activeUntil: Date | null;
    status: SubsidyDto['status'];
    isDemo: boolean;
    createdAt: Date;
    updatedAt: Date;
    requirements?: {
      id: string;
      type: string;
      condition: unknown;
      humanReadableText: string;
      fixRoute: string | null;
      fixLabel: string | null;
      order: number;
    }[];
    requiredDocuments?: {
      id: string;
      documentType: SubsidyDto['requiredDocuments'][number]['documentType'];
      title: string;
      hint: string | null;
      isOptional: boolean;
    }[];
  }): SubsidyDto {
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      shortDescription: s.shortDescription,
      fullDescription: s.fullDescription,
      category: s.category,
      organization: s.organization,
      legalBasisUrl: s.legalBasisUrl,
      applicationUrl: s.applicationUrl,
      amountType: s.amountType,
      minAmount: s.minAmount,
      maxAmount: s.maxAmount,
      amountFactor: s.amountFactor,
      amountPerApprentice: s.amountPerApprentice,
      processingDays: s.processingDays,
      activeFrom: s.activeFrom?.toISOString() ?? null,
      activeUntil: s.activeUntil?.toISOString() ?? null,
      status: s.status,
      isDemo: s.isDemo,
      requirements: (s.requirements ?? [])
        .sort((a, b) => a.order - b.order)
        .map((r) => ({
          id: r.id,
          type: r.type as SubsidyDto['requirements'][number]['type'],
          condition: (r.condition ?? {}) as Record<string, unknown>,
          humanReadableText: r.humanReadableText,
          fixRoute: r.fixRoute,
          fixLabel: r.fixLabel,
          order: r.order,
        })),
      requiredDocuments: (s.requiredDocuments ?? []).map((d) => ({
        id: d.id,
        documentType: d.documentType,
        title: d.title,
        hint: d.hint,
        isOptional: d.isOptional,
      })),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}

export function ageFrom(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}
