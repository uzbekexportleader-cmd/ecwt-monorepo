import { ageFromBirthDate, birthDateSchema, MIN_AGE_YEARS } from '@ecwt/validation';

/**
 * Tug'ilgan sana — davlat subsidiyasi arizasidagi maydon.
 *
 * Faqat "YYYY-MM-DD" naqshini tekshirish yetarli emas edi: mavjud bo'lmagan
 * sana ("2025-02-30"), kelajakdagi sana yoki mantiqsiz yosh ham o'tib
 * ketardi. Bu sxema mobil ilova va server tomonida BIR XIL ishlaydi.
 */
describe('Tug‘ilgan sana sxemasi', () => {
  it('to‘g‘ri sanani qabul qiladi', () => {
    expect(birthDateSchema.safeParse('1990-05-20').success).toBe(true);
  });

  it('noto‘g‘ri formatni rad etadi', () => {
    expect(birthDateSchema.safeParse('20.05.1990').success).toBe(false);
    expect(birthDateSchema.safeParse('1990-5-20').success).toBe(false);
  });

  it('mavjud bo‘lmagan sanani rad etadi', () => {
    // Naqshga mos, lekin bunday kun yo'q
    const result = birthDateSchema.safeParse('2025-02-30');
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain('mavjud emas');
  });

  it('mavjud bo‘lmagan oyni rad etadi', () => {
    expect(birthDateSchema.safeParse('1990-13-01').success).toBe(false);
  });

  it('kabisa yilidagi 29-fevralni qabul qiladi', () => {
    expect(birthDateSchema.safeParse('1992-02-29').success).toBe(true);
  });

  it('kabisa bo‘lmagan yildagi 29-fevralni rad etadi', () => {
    expect(birthDateSchema.safeParse('1991-02-29').success).toBe(false);
  });

  it('kelajakdagi sanani rad etadi', () => {
    const nextYear = new Date().getUTCFullYear() + 1;
    expect(birthDateSchema.safeParse(`${nextYear}-01-01`).success).toBe(false);
  });

  it('juda katta yoshni rad etadi', () => {
    expect(birthDateSchema.safeParse('1850-01-01').success).toBe(false);
  });

  it(`${MIN_AGE_YEARS} yoshdan kichikni rad etadi`, () => {
    const tooYoung = new Date();
    tooYoung.setUTCFullYear(tooYoung.getUTCFullYear() - (MIN_AGE_YEARS - 1));
    expect(birthDateSchema.safeParse(tooYoung.toISOString().slice(0, 10)).success).toBe(false);
  });
});

describe('Yosh hisoblash', () => {
  it('tug‘ilgan kun hali kelmagan bo‘lsa yoshni kamaytiradi', () => {
    // Bugun 2026-01-01, tug'ilgan kun 1990-06-15 → hali 35 yosh
    expect(ageFromBirthDate('1990-06-15', new Date('2026-01-01T00:00:00Z'))).toBe(35);
  });

  it('tug‘ilgan kun o‘tgan bo‘lsa to‘liq yosh', () => {
    expect(ageFromBirthDate('1990-06-15', new Date('2026-07-01T00:00:00Z'))).toBe(36);
  });

  it('aynan tug‘ilgan kunda to‘liq yosh', () => {
    expect(ageFromBirthDate('1990-06-15', new Date('2026-06-15T00:00:00Z'))).toBe(36);
  });
});
