import { EligibilityService, type EligibilityFacts } from './eligibility.service';
import type { Env } from '../../config/env';

const env = { BHM: 412_000 } as Env;
const service = new EligibilityService(env);

function facts(overrides: Partial<EligibilityFacts> = {}): EligibilityFacts {
  return {
    age: 35,
    businessType: 'YATT',
    businessVerified: true,
    membershipStatus: 'ACTIVE',
    membershipVerified: true,
    identityVerified: true,
    region: 'Samarqand',
    craftCategorySlug: 'kulolchilik',
    apprenticeCount: 2,
    hasBankAccount: true,
    bankVerified: true,
    yearsOfExperience: 10,
    completionPercent: 85,
    hasWorkshop: true,
    uploadedDocumentTypes: ['CONTRACT', 'BANK_DETAILS'],
    formData: {},
    ...overrides,
  };
}

let seq = 0;
function requirement(type: string, condition: Record<string, unknown> = {}, fixRoute?: string) {
  return {
    id: `req-${++seq}`,
    type,
    condition,
    humanReadableText: `${type} talabi`,
    fixRoute: fixRoute ?? null,
    fixLabel: fixRoute ? 'Tuzatish' : null,
    order: seq,
  };
}

function subsidy(requirements: ReturnType<typeof requirement>[], extra: Partial<Parameters<typeof service.evaluate>[0]> = {}) {
  return {
    id: 'sub-1',
    amountType: 'FIXED',
    minAmount: null,
    maxAmount: 1_000_000,
    amountFactor: null,
    amountPerApprentice: false,
    requirements,
    ...extra,
  } as Parameters<typeof service.evaluate>[0];
}

describe('Eligibility engine', () => {
  it('barcha talablar bajarilsa ELIGIBLE qaytaradi', () => {
    const result = service.evaluate(
      subsidy([
        requirement('AGE_RANGE', { min: 18 }),
        requirement('BUSINESS_TYPE', { in: ['YATT', 'MCHJ'] }),
        requirement('HAS_BANK_ACCOUNT'),
      ]),
      facts(),
    );
    expect(result.verdict).toBe('ELIGIBLE');
    expect(result.matchPercent).toBe(100);
    expect(result.passedCount).toBe(3);
  });

  it('yarmidan ko‘pi bajarilsa PARTIAL bo‘ladi', () => {
    const result = service.evaluate(
      subsidy([
        requirement('AGE_RANGE', { min: 18 }),
        requirement('BUSINESS_TYPE', { in: ['YATT'] }),
        requirement('HAS_APPRENTICE', { min: 5 }, '/profile/craft'),
      ]),
      facts({ apprenticeCount: 1 }),
    );
    expect(result.verdict).toBe('PARTIAL');
    expect(result.passedCount).toBe(2);
    expect(result.checks.find((c) => c.type === 'HAS_APPRENTICE')?.result).toBe('FAILED');
  });

  it('ko‘p talab bajarilmasa NOT_ELIGIBLE bo‘ladi', () => {
    const result = service.evaluate(
      subsidy([
        requirement('BUSINESS_TYPE', { in: ['MCHJ'] }),
        requirement('MEMBERSHIP', { in: ['ACTIVE'] }),
        requirement('HAS_WORKSHOP'),
        requirement('EXPERIENCE_YEARS', { min: 20 }),
      ]),
      facts({
        businessType: 'NONE',
        membershipStatus: 'NONE',
        hasWorkshop: false,
        yearsOfExperience: 1,
      }),
    );
    expect(result.verdict).toBe('NOT_ELIGIBLE');
    expect(result.passedCount).toBe(0);
  });

  it('tasdiqlanmagan a’zolik NEEDS_CHECK beradi, FAILED emas', () => {
    const result = service.evaluate(
      subsidy([requirement('MEMBERSHIP', { in: ['ACTIVE'] })]),
      facts({ membershipVerified: false }),
    );
    expect(result.checks[0]?.result).toBe('NEEDS_CHECK');
    expect(result.verdict).toBe('PARTIAL');
  });

  it('bajarilmagan talab uchun tuzatish yo‘nalishi qaytadi', () => {
    const result = service.evaluate(
      subsidy([requirement('HAS_BANK_ACCOUNT', {}, '/profile/bank')]),
      facts({ hasBankAccount: false }),
    );
    expect(result.checks[0]?.result).toBe('FAILED');
    expect(result.checks[0]?.fixRoute).toBe('/profile/bank');
    expect(result.checks[0]?.reason).toContain('Bank rekviziti');
  });

  it('yosh chegarasi tekshiriladi', () => {
    const under = service.evaluate(subsidy([requirement('AGE_RANGE', { min: 18 })]), facts({ age: 16 }));
    expect(under.checks[0]?.result).toBe('FAILED');

    const noBirthDate = service.evaluate(
      subsidy([requirement('AGE_RANGE', { min: 18 })]),
      facts({ age: null }),
    );
    expect(noBirthDate.checks[0]?.result).toBe('FAILED');
  });

  it('hujjat yuklanganligi tekshiriladi', () => {
    const ok = service.evaluate(
      subsidy([requirement('DOCUMENT_UPLOADED', { documentType: 'CONTRACT' })]),
      facts(),
    );
    expect(ok.checks[0]?.result).toBe('PASSED');

    const missing = service.evaluate(
      subsidy([requirement('DOCUMENT_UPLOADED', { documentType: 'INVOICE' })]),
      facts(),
    );
    expect(missing.checks[0]?.result).toBe('FAILED');
  });
});

describe('Summa hisoblash', () => {
  it('BHM_MULTIPLE shogirdlar soniga ko‘payadi', () => {
    const amount = service.estimateAmount(
      subsidy([], {
        amountType: 'BHM_MULTIPLE',
        amountFactor: 3,
        amountPerApprentice: true,
        maxAmount: null,
      }),
      facts({ apprenticeCount: 2 }),
    );
    expect(amount).toBe(412_000 * 3 * 2);
  });

  it('shogird bo‘lmasa ham kamida bittaga hisoblanadi', () => {
    const amount = service.estimateAmount(
      subsidy([], {
        amountType: 'BHM_MULTIPLE',
        amountFactor: 3,
        amountPerApprentice: true,
        maxAmount: null,
      }),
      facts({ apprenticeCount: 0 }),
    );
    expect(amount).toBe(412_000 * 3);
  });

  it('maksimal chegara oshib ketmaydi', () => {
    const amount = service.estimateAmount(
      subsidy([], {
        amountType: 'BHM_MULTIPLE',
        amountFactor: 100,
        amountPerApprentice: false,
        maxAmount: 5_000_000,
      }),
      facts(),
    );
    expect(amount).toBe(5_000_000);
  });

  it('foizli subsidiya xarajatdan hisoblanadi', () => {
    const amount = service.estimateAmount(
      subsidy([], {
        amountType: 'PERCENT_OF_EXPENSE',
        amountFactor: 50,
        maxAmount: 20_000_000,
        amountPerApprentice: false,
      }),
      facts({ formData: { expense: 10_000_000 } }),
    );
    expect(amount).toBe(5_000_000);
  });

  it('xarajat kiritilmasa summa null bo‘ladi', () => {
    const amount = service.estimateAmount(
      subsidy([], {
        amountType: 'PERCENT_OF_EXPENSE',
        amountFactor: 50,
        maxAmount: 20_000_000,
        amountPerApprentice: false,
      }),
      facts(),
    );
    expect(amount).toBeNull();
  });
});
