import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';

import { JwtAuthGuard } from './jwt-auth.guard';
import type { Env } from '../../config/env';

interface FakeRequest {
  headers: { authorization?: string };
  user?: unknown;
}

function makeContext(request: FakeRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeGuard(opts: { isPublic: boolean; verify?: jest.Mock }) {
  const reflector = { getAllAndOverride: () => opts.isPublic } as unknown as Reflector;
  const jwt = {
    verifyAsync: opts.verify ?? jest.fn().mockResolvedValue({ sub: 'u1', role: 'USER' }),
  } as unknown as JwtService;
  const env = { JWT_ACCESS_SECRET: 'secret' } as Env;
  return new JwtAuthGuard(reflector, jwt, env);
}

describe('JwtAuthGuard', () => {
  describe('himoyalangan marshrut', () => {
    it('tokensiz so‘rovni rad etadi', async () => {
      const guard = makeGuard({ isPublic: false });
      await expect(guard.canActivate(makeContext({ headers: {} }))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('yaroqsiz tokenni rad etadi', async () => {
      const guard = makeGuard({
        isPublic: false,
        verify: jest.fn().mockRejectedValue(new Error('bad')),
      });
      await expect(
        guard.canActivate(makeContext({ headers: { authorization: 'Bearer xxx' } })),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('to‘g‘ri tokenda foydalanuvchini biriktiradi', async () => {
      const guard = makeGuard({ isPublic: false });
      const request: FakeRequest = { headers: { authorization: 'Bearer good' } };

      await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
      expect(request.user).toEqual({ sub: 'u1', role: 'USER' });
    });
  });

  /**
   * Ochiq marshrutlarda ham foydalanuvchini bilish MUHIM: analitika
   * hodisalari kirishdan oldin ham, keyin ham keladi. Token o'qilmasa
   * barcha hodisalar anonim bo'lib qolardi va voronkada nechta ODAM
   * qolganini hisoblab bo'lmasdi.
   */
  describe('ochiq marshrut', () => {
    it('tokensiz o‘tkazadi', async () => {
      const guard = makeGuard({ isPublic: true });
      const request: FakeRequest = { headers: {} };

      await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
      expect(request.user).toBeUndefined();
    });

    it('token bo‘lsa foydalanuvchini aniqlaydi', async () => {
      const guard = makeGuard({ isPublic: true });
      const request: FakeRequest = { headers: { authorization: 'Bearer good' } };

      await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
      expect(request.user).toEqual({ sub: 'u1', role: 'USER' });
    });

    it('yaroqsiz token so‘rovni buzmaydi — anonim davom etadi', async () => {
      const guard = makeGuard({
        isPublic: true,
        verify: jest.fn().mockRejectedValue(new Error('expired')),
      });
      const request: FakeRequest = { headers: { authorization: 'Bearer expired' } };

      await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
      expect(request.user).toBeUndefined();
    });
  });
});
