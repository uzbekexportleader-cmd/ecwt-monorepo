import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload } from '../decorators/current-user.decorator';
import { ENV, type Env } from '../../config/env';
import { Inject } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const header = request.headers.authorization;

    /*
     * Ochiq marshrutlar ham foydalanuvchini bilishi mumkin.
     *
     * Masalan analitika: hodisa kirishdan oldin ham keladi (token yo'q), ham
     * kirgandan keyin (token bor). Token bo'lsa uni o'qiymiz — aks holda
     * barcha hodisalar "noma'lum foydalanuvchi" bo'lib qolib, voronkada
     * nechta ODAM qolganini hisoblab bo'lmasdi.
     *
     * Yaroqsiz token bu yerda XATO EMAS: marshrut baribir ochiq, shunchaki
     * foydalanuvchi aniqlanmagan holda davom etadi.
     */
    if (isPublic) {
      if (header?.startsWith('Bearer ')) {
        try {
          request.user = await this.jwt.verifyAsync<JwtPayload>(header.slice(7), {
            secret: this.env.JWT_ACCESS_SECRET,
          });
        } catch {
          /* token yaroqsiz — ochiq marshrut anonim holda davom etadi */
        }
      }
      return true;
    }

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Avtorizatsiya talab qilinadi');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(header.slice(7), {
        secret: this.env.JWT_ACCESS_SECRET,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Sessiya muddati tugagan yoki token yaroqsiz');
    }
  }
}
