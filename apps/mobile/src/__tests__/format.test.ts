import { formatPhone, formatSom, maskPhone } from '@ecwt/ui';
import { REGIONS, districtOptions } from '../constants/regions';

describe('Formatlash', () => {
  it('so‘m summasini bo‘shliq bilan ajratadi', () => {
    expect(formatSom(2472000)).toBe("2 472 000 so'm");
    expect(formatSom(0)).toBe("0 so'm");
    expect(formatSom(null)).toBe('—');
  });

  it('telefon raqamini o‘qiladigan ko‘rinishga keltiradi', () => {
    expect(formatPhone('998901234567')).toBe('+998 90 123 45 67');
    expect(formatPhone('12345')).toBe('12345');
  });

  it('maskalangan telefon o‘rta raqamlarni yashiradi', () => {
    const masked = maskPhone('998901234567');
    expect(masked).toContain('***');
    expect(masked).not.toContain('123');
  });
});

describe('Hududlar klassifikatori', () => {
  it('14 ta hudud mavjud', () => {
    expect(REGIONS.length).toBe(14);
  });

  it('har bir hududda kamida bitta tuman bor', () => {
    for (const r of REGIONS) {
      expect(r.districts.length).toBeGreaterThan(0);
    }
  });

  it('tanlangan viloyat bo‘yicha tumanlarni qaytaradi', () => {
    const options = districtOptions('Samarqand');
    expect(options.length).toBeGreaterThan(0);
    expect(options.some((o) => o.label === 'Urgut')).toBe(true);
  });

  it('noma’lum viloyat uchun bo‘sh ro‘yxat', () => {
    expect(districtOptions('Yo‘q hudud')).toEqual([]);
    expect(districtOptions(null)).toEqual([]);
  });
});
