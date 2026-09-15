import {
  assertServiceChoiceValid,
  assertStageReachable,
  type ProfileFieldsSnapshot,
} from './artisan-profile.service';

/**
 * Ro'yxatdan o'tish oqimining server tomonidagi qo'riqchilari.
 *
 * Bu tekshiruvlar mobil ilovadagi UI cheklovlarini takrorlaydi — chunki
 * API'ga to'g'ridan-to'g'ri so'rov yuborish (Postman, skript) UI'ni
 * butunlay chetlab o'tadi.
 */

/** To'liq to'ldirilgan profil — testlar undan kerakli maydonni "buzadi" */
function fullProfile(overrides: Partial<ProfileFieldsSnapshot> = {}): ProfileFieldsSnapshot {
  return {
    firstName: 'Ali',
    lastName: 'Valiyev',
    middleName: 'Aliyevich',
    birthDate: new Date('1990-01-01'),
    gender: 'MALE',
    region: 'Toshkent',
    district: 'Chilonzor',
    mahalla: 'Yangi hayot',
    street: 'Bunyodkor',
    houseNumber: '12',
    activityType: 'TADBIRKOR',
    craftCategoryId: null,
    craftSubcategoryId: null,
    yearsOfExperience: 5,
    selectedMarketplaces: ['amazon'],
    wantsBrandSite: false,
    wantsDropshipping: false,
    wantsChinaImport: false,
    bankAccount: '12345678901234567890',
    bankMfo: '00014',
    bankName: 'Ipoteka bank',
    paymentMethod: 'SELF',
    ...overrides,
  };
}

describe('Xizmat tanlash — bir-birini istisno qilish', () => {
  it('bitta marketplace — ruxsat', () => {
    expect(() => assertServiceChoiceValid(fullProfile())).not.toThrow();
  });

  it('bitta xizmat — ruxsat', () => {
    const p = fullProfile({ selectedMarketplaces: [], wantsBrandSite: true });
    expect(() => assertServiceChoiceValid(p)).not.toThrow();
  });

  it('marketplace va xizmat birga — rad etiladi', () => {
    const p = fullProfile({ selectedMarketplaces: ['amazon'], wantsDropshipping: true });
    expect(() => assertServiceChoiceValid(p)).toThrow(/birga tanlanmaydi/);
  });

  it('ikkita marketplace — rad etiladi', () => {
    const p = fullProfile({ selectedMarketplaces: ['amazon', 'ebay'] });
    expect(() => assertServiceChoiceValid(p)).toThrow(/bitta marketplace/);
  });

  it('ikkita xizmat — rad etiladi', () => {
    const p = fullProfile({
      selectedMarketplaces: [],
      wantsBrandSite: true,
      wantsChinaImport: true,
    });
    expect(() => assertServiceChoiceValid(p)).toThrow(/bitta xizmat/);
  });

  it('hech narsa tanlanmagan — bu bosqichda ruxsat (SERVICES qadamida tekshiriladi)', () => {
    const p = fullProfile({ selectedMarketplaces: [] });
    expect(() => assertServiceChoiceValid(p)).not.toThrow();
  });
});

describe('Bosqich ketma-ketligi', () => {
  it('to‘liq profil DONE ga o‘ta oladi', () => {
    expect(() => assertStageReachable('DONE', fullProfile())).not.toThrow();
  });

  it('bo‘sh profil DONE ga o‘ta olmaydi', () => {
    const empty = fullProfile({
      firstName: null,
      lastName: null,
      middleName: null,
      birthDate: null,
      gender: null,
    });
    expect(() => assertStageReachable('DONE', empty)).toThrow(/ism, familiya/);
  });

  it('manzilsiz ACTIVITY_TYPE ga o‘tib bo‘lmaydi', () => {
    const p = fullProfile({ region: null, district: null });
    expect(() => assertStageReachable('ACTIVITY_TYPE', p)).toThrow(/viloyat, tuman/);
  });

  it('banksiz PAYMENT ga o‘tib bo‘lmaydi', () => {
    const p = fullProfile({ bankAccount: null });
    expect(() => assertStageReachable('PAYMENT', p)).toThrow(/hisob raqami, MFO/);
  });

  it('to‘lov usulisiz CONTRACT ga o‘tib bo‘lmaydi', () => {
    const p = fullProfile({ paymentMethod: null });
    expect(() => assertStageReachable('CONTRACT', p)).toThrow(/to‘lov usulini tanlang/);
  });

  it('xizmat tanlanmagan bo‘lsa BANK ga o‘tib bo‘lmaydi', () => {
    const p = fullProfile({ selectedMarketplaces: [] });
    expect(() => assertStageReachable('BANK', p)).toThrow(/marketplace yoki xizmat turini tanlang/);
  });

  it('hunarmand uchun hunar yo‘nalishi majburiy', () => {
    const p = fullProfile({
      activityType: 'HUNARMAND',
      craftCategoryId: null,
      craftSubcategoryId: null,
    });
    expect(() => assertStageReachable('SERVICES', p)).toThrow(/hunar yo‘nalishini tanlang/);
  });

  /*
   * Ro'yxatdan o'tish oqimida hunar turi SLUG sifatida `craftSubcategoryId`ga
   * yoziladi ("kulolchilik"), chunki `craftCategoryId` — reyestr jadvaliga
   * tashqi kalit (UUID). Tekshiruv ilgari faqat `craftCategoryId`ni qarab,
   * haqiqiy foydalanuvchini SERVICES bosqichida bloklab qo'ygan edi.
   */
  it('hunar turi slug bilan tanlangan bo‘lsa — o‘tadi', () => {
    const p = fullProfile({
      activityType: 'HUNARMAND',
      craftCategoryId: null,
      craftSubcategoryId: 'kulolchilik',
    });
    expect(() => assertStageReachable('SERVICES', p)).not.toThrow();
  });

  it('hunar kategoriyasi UUID bilan berilgan bo‘lsa ham — o‘tadi', () => {
    const p = fullProfile({
      activityType: 'HUNARMAND',
      craftCategoryId: 'b1f0c2d4-0000-4000-8000-000000000001',
      craftSubcategoryId: null,
    });
    expect(() => assertStageReachable('SERVICES', p)).not.toThrow();
  });

  it('hunarmand bo‘lmasa hunar yo‘nalishi talab qilinmaydi', () => {
    const p = fullProfile({
      activityType: 'TADBIRKOR',
      craftCategoryId: null,
      craftSubcategoryId: null,
    });
    expect(() => assertStageReachable('SERVICES', p)).not.toThrow();
  });

  it('birinchi bosqichga (PERSONAL) o‘tish har doim ruxsat — orqaga qaytish', () => {
    const empty = fullProfile({ firstName: null, lastName: null, birthDate: null });
    expect(() => assertStageReachable('PERSONAL', empty)).not.toThrow();
  });

  /*
   * Xato matni hunarmandga ko'rinadi. Unda dasturchi atamalari
   * (ACTIVITY_DETAILS, SERVICES) bo'lmasligi kerak — aks holda odam
   * nima qilishini tushunmaydi va ilovaga ishonchi yo'qoladi.
   */
  it('xato matnida ichki bosqich nomlari ko‘rinmaydi', () => {
    const p = fullProfile({ region: null });
    let message = '';
    try {
      assertStageReachable('SERVICES', p);
    } catch (e) {
      message = (e as { message: string }).message;
    }

    expect(message).toContain('Manzil');
    for (const internal of ['ACTIVITY_DETAILS', 'ACTIVITY_TYPE', 'SERVICES', 'PERSONAL', 'BANK']) {
      expect(message).not.toContain(internal);
    }
  });
});
