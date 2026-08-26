import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import type { AppRequest } from '../types';

/**
 * Har bir so'rovga ID beradi. Bu ID log'larda ham, xato javobida ham chiqadi —
 * mijoz "xato chiqdi" desa, shu ID bo'yicha log topiladi.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: AppRequest, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && incoming.length <= 64 ? incoming : randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
