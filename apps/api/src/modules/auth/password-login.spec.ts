import { ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';

/**
 * Parol bilan kirish — xavfsizlikka tegishli, shuning uchun qoidalar
 * testlar bilan qotirilgan.
 */
describe('AuthService — parol bilan kirish', () => {
  const meta = { ip: '127.0.0.1', userAgent: 'test' };

  function makeService(user: Record<string, unknown> | null) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };

    // Tartib auth.service.ts dagi konstruktorga mos: prisma, jwt, audit, env, sms
    const service = new AuthService(
      prisma as never,
      {} as never, // jwt
      audit as never,
      {} as never, // env
      {} as never, // sms
    );

    // Token berish va sessiya qurish bu testlarning mavzusi emas
    Object.assign(service, {
      issueTokens: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
      toSessionUser: jest.fn().mockResolvedValue({ id: 'u1' }),
    });

    return { service, prisma, audit };
  }

  describe('login', () => {
    it('paroli yo‘q foydalanuvchini kiritmaydi', async () => {
      const { service } = makeService({ id: 'u1', phone: '998901234567', passwordHash: null });
      await expect(service.login('998901234567', 'parol123', meta)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('noto‘g‘ri parolni rad etadi', async () => {
      const hash = await bcrypt.hash('durisparol', 10);
      const { service } = makeService({
        id: 'u1',
        phone: '998901234567',
        passwordHash: hash,
        isActive: true,
        role: 'USER',
      });
      await expect(service.login('998901234567', 'notogri', meta)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    /**
     * Raqam yo'qligi va parol xatoligi BIR XIL xabar berishi shart — aks
     * holda ilova "bu raqam ro'yxatdan o'tganmi?" degan savolga javob
     * beruvchi asbobga aylanadi.
     */
    it('mavjud bo‘lmagan raqam va xato parol bir xil xabar beradi', async () => {
      const hash = await bcrypt.hash('durisparol', 10);

      const missing = makeService(null);
      const wrong = makeService({
        id: 'u1',
        phone: '998901234567',
        passwordHash: hash,
        isActive: true,
        role: 'USER',
      });

      const message = async (fn: () => Promise<unknown>): Promise<string> => {
        try {
          await fn();
          throw new Error('xato kutilgan edi, lekin kirish muvaffaqiyatli bo‘ldi');
        } catch (e) {
          return (e as Error).message;
        }
      };

      const e1 = await message(() => missing.service.login('998900000000', 'x', meta));
      const e2 = await message(() => wrong.service.login('998901234567', 'notogri', meta));

      expect(e1).toBe(e2);
    });

    it('bloklangan akkauntni kiritmaydi', async () => {
      const hash = await bcrypt.hash('durisparol', 10);
      const { service } = makeService({
        id: 'u1',
        phone: '998901234567',
        passwordHash: hash,
        isActive: false,
        role: 'USER',
      });
      await expect(service.login('998901234567', 'durisparol', meta)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    /** Oddiy foydalanuvchi ham kira olishi kerak — adminLogin dan asosiy farqi */
    it('to‘g‘ri parolda oddiy foydalanuvchini kiritadi', async () => {
      const hash = await bcrypt.hash('durisparol', 10);
      const { service, audit } = makeService({
        id: 'u1',
        phone: '998901234567',
        passwordHash: hash,
        isActive: true,
        role: 'USER',
        fullName: null,
      });

      const result = await service.login('998901234567', 'durisparol', meta);

      expect(result.accessToken).toBe('a');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.login.password' }),
      );
    });
  });

  describe('setPassword', () => {
    it('paroli yo‘q bo‘lsa joriy parolsiz o‘rnatiladi', async () => {
      const { service, prisma } = makeService({ id: 'u1', phone: '998901234567', passwordHash: null });

      await service.setPassword('u1', undefined, 'yangiparol1');

      expect(prisma.user.update).toHaveBeenCalled();
      const data = prisma.user.update.mock.calls[0][0].data as { passwordHash: string };
      expect(await bcrypt.compare('yangiparol1', data.passwordHash)).toBe(true);
    });

    /**
     * Parol bor bo'lsa joriy parol SHART: telefonni qo'lga kiritgan begona
     * odam parolni jimgina almashtirib, egasini chiqarib yubormasin.
     */
    it('paroli bor bo‘lsa joriy parolsiz almashtirmaydi', async () => {
      const hash = await bcrypt.hash('eskiparol', 10);
      const { service } = makeService({ id: 'u1', phone: '998901234567', passwordHash: hash });

      await expect(service.setPassword('u1', undefined, 'yangiparol1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('joriy parol xato bo‘lsa almashtirmaydi', async () => {
      const hash = await bcrypt.hash('eskiparol', 10);
      const { service, prisma } = makeService({ id: 'u1', phone: '998901234567', passwordHash: hash });

      await expect(service.setPassword('u1', 'notogri', 'yangiparol1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('joriy parol to‘g‘ri bo‘lsa almashtiradi', async () => {
      const hash = await bcrypt.hash('eskiparol', 10);
      const { service, prisma } = makeService({ id: 'u1', phone: '998901234567', passwordHash: hash });

      await service.setPassword('u1', 'eskiparol', 'yangiparol1');

      const data = prisma.user.update.mock.calls[0][0].data as { passwordHash: string };
      expect(await bcrypt.compare('yangiparol1', data.passwordHash)).toBe(true);
    });
  });
});
