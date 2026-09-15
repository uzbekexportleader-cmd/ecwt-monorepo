import { Inject, Injectable } from '@nestjs/common';
import type {
  EligibilityDto,
  EligibilityVerdict,
  RequirementCheckDto,
  RequirementResult,
} from '@ecwt/types';

import { ENV, type Env } from '../../config/env';

/** Eligibility dvigateli uchun profil "faktlari". */
export interface EligibilityFacts {
  age: number | null;
  businessType: string;
  businessVerified: boolean;
  membershipStatus: string;
  membershipVerified: boolean;
  identityVerified: boolean;
  region: string | null;
  craftCategorySlug: string | null;
  apprenticeCount: number;
  hasBankAccount: boolean;
  bankVerified: boolean;
  yearsOfExperience: number;
  completionPercent: number;
  hasWorkshop: boolean;
  uploadedDocumentTypes: string[];
  /** Ariza formasidan keladigan qiymatlar (masalan marketplace xarajati) */
  formData: Record<string, unknown>;
}

interface RequirementLike {
  id: string;
  type: string;
  condition: unknown;
  humanReadableText: string;
  fixRoute: string | null;
  fixLabel: string | null;
  order: number;
}

interface SubsidyLike {
  id: string;
  amountType: string;
  minAmount: number | null;
  maxAmount: number | null;
  amountFactor: number | null;
  amountPerApprentice: boolean;
  requirements: RequirementLike[];
}

@Injectable()
export class EligibilityService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  evaluate(subsidy: SubsidyLike, facts: EligibilityFacts): EligibilityDto {
    const checks: RequirementCheckDto[] = [...subsidy.requirements]
      .sort((a, b) => a.order - b.order)
      .map((req) => this.checkOne(req, facts));

    const total = checks.length;
    const passed = checks.filter((c) => c.result === 'PASSED').length;
    const failed = checks.filter((c) => c.result === 'FAILED').length;

    let verdict: EligibilityVerdict;
    if (total === 0 || failed === 0) {
      verdict = checks.some((c) => c.result === 'NEEDS_CHECK') ? 'PARTIAL' : 'ELIGIBLE';
    } else if (total > 0 && passed / total >= 0.5) {
      verdict = 'PARTIAL';
    } else {
      verdict = 'NOT_ELIGIBLE';
    }

    const matchPercent = total === 0 ? 100 : Math.round((passed / total) * 100);

    return {
      subsidyId: subsidy.id,
      verdict,
      matchPercent,
      passedCount: passed,
      totalCount: total,
      checks,
      estimatedAmount: this.estimateAmount(subsidy, facts),
      message: this.message(verdict, passed, total, failed),
    };
  }

  private message(
    verdict: EligibilityVerdict,
    passed: number,
    total: number,
    failed: number,
  ): string {
    switch (verdict) {
      case 'ELIGIBLE':
        return 'Ushbu subsidiya sizga mos keladi.';
      case 'PARTIAL':
        return failed > 0
          ? `${total} ta talabdan ${passed} tasi bajarilgan. ${failed} ta talab yetishmayapti.`
          : `${total} ta talabdan ${passed} tasi tasdiqlangan. Qolganlari tekshirilmoqda.`;
      default:
        return `Hozircha ushbu subsidiya uchun ${failed} ta talab yetishmayapti.`;
    }
  }

  private checkOne(req: RequirementLike, facts: EligibilityFacts): RequirementCheckDto {
    const cond = (req.condition ?? {}) as Record<string, unknown>;
    const base = {
      requirementId: req.id,
      type: req.type as RequirementCheckDto['type'],
      text: req.humanReadableText,
      fixRoute: req.fixRoute,
      fixLabel: req.fixLabel,
    };
    const make = (result: RequirementResult, reason: string | null = null): RequirementCheckDto => ({
      ...base,
      result,
      reason,
    });

    switch (req.type) {
      case 'AGE_RANGE': {
        if (facts.age === null) return make('FAILED', 'Tug‘ilgan sana kiritilmagan');
        const min = num(cond.min);
        const max = num(cond.max);
        if (min !== null && facts.age < min) return make('FAILED', `Yosh ${min} dan katta bo‘lishi kerak`);
        if (max !== null && facts.age > max) return make('FAILED', `Yosh ${max} dan kichik bo‘lishi kerak`);
        return make('PASSED');
      }

      case 'BUSINESS_TYPE': {
        const allowed = arr(cond.in) ?? ['YATT', 'MCHJ'];
        if (!allowed.includes(facts.businessType)) {
          return make('FAILED', 'Tadbirkor sifatida davlat ro‘yxatidan o‘tish talab qilinadi');
        }
        return facts.businessVerified
          ? make('PASSED')
          : make('NEEDS_CHECK', 'Tadbirkorlik holati hali tasdiqlanmagan');
      }

      case 'MEMBERSHIP': {
        const allowed = arr(cond.in) ?? ['ACTIVE'];
        if (!allowed.includes(facts.membershipStatus)) {
          return make('FAILED', '“Hunarmand” uyushmasi a’zoligi topilmadi');
        }
        return facts.membershipVerified
          ? make('PASSED')
          : make('NEEDS_CHECK', 'A’zolik hali tasdiqlanmagan');
      }

      case 'IDENTITY_VERIFIED':
        return facts.identityVerified
          ? make('PASSED')
          : make('NEEDS_CHECK', 'Shaxs tasdiqlash jarayonida');

      case 'REGION': {
        const allowed = arr(cond.in);
        if (!facts.region) return make('FAILED', 'Manzil kiritilmagan');
        if (allowed && !allowed.includes(facts.region)) {
          return make('FAILED', 'Bu dastur sizning hududingizda amal qilmaydi');
        }
        return make('PASSED');
      }

      case 'CRAFT_CATEGORY': {
        const allowed = arr(cond.in);
        if (!facts.craftCategorySlug) return make('FAILED', 'Hunar yo‘nalishi tanlanmagan');
        if (allowed && !allowed.includes(facts.craftCategorySlug)) {
          return make('FAILED', 'Hunar yo‘nalishingiz bu dasturga kirmaydi');
        }
        return make('PASSED');
      }

      case 'HAS_APPRENTICE': {
        const min = num(cond.min) ?? 1;
        return facts.apprenticeCount >= min
          ? make('PASSED')
          : make('FAILED', `Kamida ${min} ta shogird biriktirilgan bo‘lishi kerak`);
      }

      case 'HAS_BANK_ACCOUNT': {
        if (!facts.hasBankAccount) return make('FAILED', 'Bank rekviziti kiritilmagan');
        if (cond.verified === true && !facts.bankVerified) {
          return make('NEEDS_CHECK', 'Bank rekviziti tasdiqlanmagan');
        }
        return make('PASSED');
      }

      case 'EXPERIENCE_YEARS': {
        const min = num(cond.min) ?? 1;
        return facts.yearsOfExperience >= min
          ? make('PASSED')
          : make('FAILED', `Kamida ${min} yil tajriba talab qilinadi`);
      }

      case 'PROFILE_COMPLETION': {
        const min = num(cond.min) ?? 70;
        return facts.completionPercent >= min
          ? make('PASSED')
          : make('FAILED', `Profil kamida ${min}% to‘ldirilishi kerak`);
      }

      case 'HAS_WORKSHOP':
        return facts.hasWorkshop ? make('PASSED') : make('FAILED', 'Ustaxona ma’lumoti kiritilmagan');

      case 'DOCUMENT_UPLOADED': {
        const docType = typeof cond.documentType === 'string' ? cond.documentType : null;
        if (!docType) return make('PASSED');
        return facts.uploadedDocumentTypes.includes(docType)
          ? make('PASSED')
          : make('FAILED', 'Talab qilingan hujjat yuklanmagan');
      }

      case 'MARKETPLACE_EXPENSE': {
        const min = num(cond.min) ?? 1;
        const expense = num(facts.formData.expense) ?? 0;
        return expense >= min
          ? make('PASSED')
          : make('FAILED', 'Marketplace/reklama xarajati kiritilmagan');
      }

      default:
        return make('NEEDS_CHECK', 'Bu talab qo‘lda tekshiriladi');
    }
  }

  /** Taxminiy summa. Yakuniy summani har doim vakolatli organ belgilaydi. */
  estimateAmount(subsidy: SubsidyLike, facts: EligibilityFacts): number | null {
    switch (subsidy.amountType) {
      case 'FIXED':
        return subsidy.maxAmount ?? subsidy.minAmount ?? null;

      case 'RANGE':
        return subsidy.maxAmount ?? null;

      case 'BHM_MULTIPLE': {
        const factor = subsidy.amountFactor ?? 1;
        const multiplier = subsidy.amountPerApprentice ? Math.max(1, facts.apprenticeCount) : 1;
        const raw = Math.round(this.env.BHM * factor * multiplier);
        return subsidy.maxAmount ? Math.min(raw, subsidy.maxAmount) : raw;
      }

      case 'PERCENT_OF_EXPENSE': {
        const expense = num(facts.formData.expense);
        if (expense === null) return null;
        const percent = subsidy.amountFactor ?? 50;
        const raw = Math.round((expense * percent) / 100);
        return subsidy.maxAmount ? Math.min(raw, subsidy.maxAmount) : raw;
      }

      default:
        return null;
    }
  }
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function arr(value: unknown): string[] | null {
  return Array.isArray(value) ? value.map(String) : null;
}
