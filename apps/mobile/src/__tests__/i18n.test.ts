import { translate } from '../i18n';
import { uz } from '../i18n/uz';

describe('i18n (o‘zbek tili)', () => {
  it('matnni o‘zbekcha qaytaradi', () => {
    expect(translate('auth.phone.send')).toBe('Kod olish');
    expect(translate('tab.home')).toBe('Bosh sahifa');
  });

  it('o‘zgaruvchilarni almashtiradi', () => {
    expect(translate('home.greeting', 'uz', { name: 'Asror' })).toBe('Salom, Asror');
    expect(translate('wizard.step', 'uz', { current: 3, total: 6 })).toBe('3/6');
  });

  it('barcha kalitlar to‘ldirilgan (bo‘sh matn yo‘q)', () => {
    const empty = Object.entries(uz).filter(([, v]) => !v || !String(v).trim());
    expect(empty).toEqual([]);
  });

  it('UI matnlarida texnik inglizcha status qolmagan', () => {
    const technical = /\b(DRAFT|SUBMITTED|UNDER_REVIEW|NEEDS_CORRECTION|SCORING|LOCAL_REVIEW|APPROVED|PAYMENT_PROCESSING|PAID|REJECTED|CANCELLED|PENDING|VERIFIED|FAILED|NOT_STARTED|ELIGIBLE|PARTIAL)\b/;
    const bad = Object.entries(uz).filter(([, v]) => technical.test(String(v)));
    expect(bad).toEqual([]);
  });

  it('lug‘at yetarlicha to‘liq', () => {
    expect(Object.keys(uz).length).toBeGreaterThan(120);
  });
});
