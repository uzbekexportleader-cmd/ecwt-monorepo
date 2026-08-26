import type { Request } from 'express';
import type { JwtPayload } from '@ecwt/contracts';

/** Guard'dan o'tgan so'rov — `user` va `requestId` doim mavjud */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  requestId: string;
}

/** Guard'gacha bo'lgan so'rov — `user` hali yo'q bo'lishi mumkin */
export interface AppRequest extends Request {
  user?: JwtPayload;
  requestId?: string;
  /**
   * XOM tana — webhook imzosini tekshirish uchun.
   * `NestFactory.create(AppModule, { rawBody: true })` bilan to'ldiriladi.
   */
  rawBody?: Buffer;
}
