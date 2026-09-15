import { MahallaSubsidyService } from './mahalla-subsidy.service';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Paketning uchta qoidasi tekshiriladi:
 *  1. profilda yo'q maydon to'qib chiqarilmaydi (`null` qaytadi);
 *  2. summa "yetishmayapti" ro'yxatiga tushmaydi — uni foydalanuvchi
 *     saytda o'zi yozadi, aks holda paket hech qachon tayyor bo'lmaydi;
 *  3. yuridik shaxsda STIR va tashkilot nomi so'raladi.
 */

const profile = (over: Record<string, unknown> = {}) => ({
  firstName: 'Ali',
  lastName: 'Valiyev',
  middleName: 'Botir o‘g‘li',
  businessType: 'NONE',
  organizationName: null,
  stir: null,
  region: 'Toshkent shahri',
  district: 'Shayxontohur t.',
  mahalla: 'Katta Jar-ariq',
  street: 'Bunyodkor',
  houseNumber: '33',
  contactPhone: null,
  ...over,
});

const makeService = (profileRow: Record<string, unknown> | null, phone = '998901234567') => {
  const prisma = {
    artisanProfile: { findUnique: jest.fn().mockResolvedValue(profileRow) },
    user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ phone }) },
    externalSubsidyApplication: { findFirst: jest.fn().mockResolvedValue(null) },
  } as unknown as PrismaService;
  return new MahallaSubsidyService(prisma);
};

describe('MahallaSubsidyService', () => {
  it('to‘liq profilda paket tayyor va summa so‘ralmaydi', async () => {
    const packet = await makeService(profile()).getPacket('u1');

    expect(packet.ready).toBe(true);
    expect(packet.missing).toEqual([]);

    const amount = packet.fields.find((f) => f.key === 'amount');
    // Summa ataylab bo'sh: davlat mablag'i miqdorini ilova o'zi yozmaydi
    expect(amount?.value).toBeNull();
  });

  it('yuridik shaxsda STIR va tashkilot nomi so‘raladi', async () => {
    const packet = await makeService(
      profile({ businessType: 'YATT', stir: null, organizationName: null }),
    ).getPacket('u1');

    expect(packet.ready).toBe(false);
    expect(packet.missing).toEqual(expect.arrayContaining(['СТИР', 'Ташкилот номи']));
  });

  it('manzil to‘ldirilmagan bo‘lsa to‘qib chiqarilmaydi', async () => {
    const packet = await makeService(profile({ mahalla: null })).getPacket('u1');

    const mahalla = packet.fields.find((f) => f.key === 'mahalla');
    expect(mahalla?.value).toBeNull();
    expect(mahalla?.fixRoute).toBeTruthy();
    expect(packet.missing).toContain('mahalla');
  });

  it('kirish raqamiga «+» qo‘shiladi', async () => {
    const packet = await makeService(profile()).getPacket('u1');
    expect(packet.fields.find((f) => f.key === 'phone')?.value).toBe('+998901234567');
  });

  it('profil yo‘q bo‘lsa xato qaytaradi', async () => {
    await expect(makeService(null).getPacket('u1')).rejects.toThrow();
  });
});
