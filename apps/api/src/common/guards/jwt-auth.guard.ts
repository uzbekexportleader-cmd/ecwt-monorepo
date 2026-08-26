import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@ecwt/contracts';
import { AppError } from '../errors';
import { IS_PUBLIC_KEY } from '../decorators';
import type { AppRequest } from '../types';

/**
 * Access token'ni tekshiradi.
 *
 * Diqqat: bu guard ma'lumotlar bazasiga murojaat qilmaydi — har bir so'rovda
 * DB o'qish qimmat. Shu sababli access token muddati qisqa (15 daqiqa):
 * foydalanuvchi bloklansa yoki sessiya bekor qilinsa, u eng ko'pi bilan
 * 15 daqiqada kuchdan qoladi. Refresh token esa har safar DB'da tekshiriladi,
 * ya'ni bekor qilingan sessiya yangi access token ola olmaydi.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AppRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) throw AppError.unauthorized('Token yuborilmadi');

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      request.user = payload;
      return true;
    } catch {
      // Token muddati tugagan yoki imzo noto'g'ri — sababni oshkor qilmaymiz
      throw AppError.unauthorized('Sessiya muddati tugagan, qaytadan kiring');
    }
  }
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (!value || scheme?.toLowerCase() !== 'bearer') return null;
  return value.trim() || null;
}
