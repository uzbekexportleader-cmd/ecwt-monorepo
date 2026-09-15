import { PushService } from './push.service';
import type { PrismaService } from '../../prisma/prisma.service';

/** Expo javobini taqlid qiluvchi fetch */
function mockFetch(tickets: Array<Record<string, unknown>>, ok = true) {
  return jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ data: tickets }),
    text: async () => '',
  });
}

function makePrisma(tokens: string[]) {
  return {
    deviceToken: {
      findMany: jest.fn().mockResolvedValue(tokens.map((token) => ({ token }))),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as PrismaService & {
    deviceToken: Record<string, jest.Mock>;
  };
}

describe('PushService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('qurilmasi yo‘q foydalanuvchiga so‘rov yubormaydi', async () => {
    const prisma = makePrisma([]);
    const fetchMock = mockFetch([]);
    global.fetch = fetchMock as unknown as typeof fetch;

    await new PushService(prisma).sendToUsers(['u1'], { title: 'Salom', body: 'Matn' });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bo‘sh ro‘yxatda bazaga ham murojaat qilmaydi', async () => {
    const prisma = makePrisma([]);
    await new PushService(prisma).sendToUsers([], { title: 'a', body: 'b' });
    expect(prisma.deviceToken.findMany).not.toHaveBeenCalled();
  });

  it('xabar Expo formatida yuboriladi va route data ichida ketadi', async () => {
    const prisma = makePrisma(['ExponentPushToken[aaa]']);
    const fetchMock = mockFetch([{ status: 'ok', id: '1' }]);
    global.fetch = fetchMock as unknown as typeof fetch;

    await new PushService(prisma).sendToUsers(['u1'], {
      title: 'Ariza tasdiqlandi',
      body: 'Tabriklaymiz',
      route: '/applications/abc',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual([
      {
        to: 'ExponentPushToken[aaa]',
        title: 'Ariza tasdiqlandi',
        body: 'Tabriklaymiz',
        sound: 'default',
        data: { route: '/applications/abc' },
      },
    ]);
  });

  /**
   * Ilova o'chirilgan qurilmaga qayta-qayta urinish Expo limitini yeydi va
   * jurnalni ifloslantiradi — bunday token o'chirilishi kerak.
   */
  it('DeviceNotRegistered kelganda token faolsizlantiriladi', async () => {
    const prisma = makePrisma(['ExponentPushToken[dead]']);
    global.fetch = mockFetch([
      { status: 'error', message: 'not registered', details: { error: 'DeviceNotRegistered' } },
    ]) as unknown as typeof fetch;

    await new PushService(prisma).sendToUsers(['u1'], { title: 'a', body: 'b' });

    expect(prisma.deviceToken.updateMany).toHaveBeenCalledWith({
      where: { token: { in: ['ExponentPushToken[dead]'] } },
      data: { isActive: false },
    });
  });

  it('boshqa xatolarda token saqlanib qoladi', async () => {
    const prisma = makePrisma(['ExponentPushToken[ok]']);
    global.fetch = mockFetch([
      { status: 'error', message: 'xabar juda uzun', details: { error: 'MessageTooBig' } },
    ]) as unknown as typeof fetch;

    await new PushService(prisma).sendToUsers(['u1'], { title: 'a', body: 'b' });

    expect(prisma.deviceToken.updateMany).not.toHaveBeenCalled();
  });

  /**
   * Push tashqi xizmat — u yiqilsa ariza holati o'zgarishi kabi asosiy
   * amallar ham yiqilib qolmasligi kerak.
   */
  it('tarmoq xatosi yuqoriga otilmaydi', async () => {
    const prisma = makePrisma(['ExponentPushToken[aaa]']);
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNRESET')) as unknown as typeof fetch;

    await expect(
      new PushService(prisma).sendToUsers(['u1'], { title: 'a', body: 'b' }),
    ).resolves.toBeUndefined();
  });

  it('qurilma ro‘yxatga olinganda token egasi yangilanadi', async () => {
    const prisma = makePrisma([]);
    await new PushService(prisma).registerDevice('u2', 'ExponentPushToken[x]', 'android');

    expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
      where: { token: 'ExponentPushToken[x]' },
      create: { userId: 'u2', token: 'ExponentPushToken[x]', platform: 'android' },
      update: { userId: 'u2', platform: 'android', isActive: true },
    });
  });
});
