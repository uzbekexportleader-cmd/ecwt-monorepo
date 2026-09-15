import { ALLOWED_TRANSITIONS, canTransition, isTerminal, type ApplicationStatus } from '@ecwt/types';

/**
 * Status mashinasi — tizimning eng kritik qismi.
 * Noqonuniy o'tish pul to'lanishiga olib kelishi mumkin, shuning uchun
 * bu qoidalar test bilan qotirilgan.
 */
describe('Ariza status mashinasi', () => {
  it('to‘g‘ri yo‘l: DRAFT → ... → PAID', () => {
    const path: ApplicationStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'SCORING',
      'LOCAL_REVIEW',
      'APPROVED',
      'PAYMENT_PROCESSING',
      'PAID',
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it('bosqichlarni sakrab o‘tib bo‘lmaydi', () => {
    expect(canTransition('SUBMITTED', 'PAID')).toBe(false);
    expect(canTransition('UNDER_REVIEW', 'PAID')).toBe(false);
    expect(canTransition('UNDER_REVIEW', 'APPROVED')).toBe(false);
    expect(canTransition('DRAFT', 'APPROVED')).toBe(false);
    expect(canTransition('SCORING', 'PAYMENT_PROCESSING')).toBe(false);
  });

  it('tuzatish sikli: UNDER_REVIEW → NEEDS_CORRECTION → SUBMITTED', () => {
    expect(canTransition('UNDER_REVIEW', 'NEEDS_CORRECTION')).toBe(true);
    expect(canTransition('NEEDS_CORRECTION', 'SUBMITTED')).toBe(true);
    expect(canTransition('NEEDS_CORRECTION', 'APPROVED')).toBe(false);
  });

  it('rad etish faqat ko‘rib chiqish bosqichlarida mumkin', () => {
    expect(canTransition('UNDER_REVIEW', 'REJECTED')).toBe(true);
    expect(canTransition('SCORING', 'REJECTED')).toBe(true);
    expect(canTransition('LOCAL_REVIEW', 'REJECTED')).toBe(true);
    expect(canTransition('APPROVED', 'REJECTED')).toBe(true);
    expect(canTransition('PAYMENT_PROCESSING', 'REJECTED')).toBe(false);
    expect(canTransition('PAID', 'REJECTED')).toBe(false);
  });

  it('yakuniy holatlardan chiqish yo‘q', () => {
    for (const status of ['PAID', 'REJECTED', 'CANCELLED'] as ApplicationStatus[]) {
      expect(isTerminal(status)).toBe(true);
      expect(ALLOWED_TRANSITIONS[status]).toHaveLength(0);
    }
  });

  it('to‘lov faqat PAYMENT_PROCESSING dan keyin bo‘ladi', () => {
    const canReachPaid = (Object.keys(ALLOWED_TRANSITIONS) as ApplicationStatus[]).filter((from) =>
      ALLOWED_TRANSITIONS[from].includes('PAID'),
    );
    expect(canReachPaid).toEqual(['PAYMENT_PROCESSING']);
  });

  it('bekor qilish faqat yuborilmagan yoki tuzatishdagi arizada mumkin', () => {
    const canCancel = (Object.keys(ALLOWED_TRANSITIONS) as ApplicationStatus[]).filter((from) =>
      ALLOWED_TRANSITIONS[from].includes('CANCELLED'),
    );
    expect(canCancel.sort()).toEqual(['DRAFT', 'NEEDS_CORRECTION', 'SUBMITTED']);
  });

  it('har bir status jadvalda mavjud', () => {
    const statuses: ApplicationStatus[] = [
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'NEEDS_CORRECTION',
      'SCORING',
      'LOCAL_REVIEW',
      'APPROVED',
      'PAYMENT_PROCESSING',
      'PAID',
      'REJECTED',
      'CANCELLED',
    ];
    for (const s of statuses) {
      expect(ALLOWED_TRANSITIONS[s]).toBeDefined();
    }
  });
});
