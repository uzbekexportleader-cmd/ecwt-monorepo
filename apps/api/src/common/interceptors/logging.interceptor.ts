import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Response } from 'express';
import type { AppRequest } from '../types';

/**
 * Tuzilmali so'rov log'i. Parol, token, OTP kabi maxfiy ma'lumot yozilmaydi —
 * faqat marshrut, holat kodi va davomiylik.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AppRequest>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - startedAt;
        this.logger.log(
          `[${request.requestId ?? '-'}] ${request.method} ${request.originalUrl} ${response.statusCode} ${ms}ms user=${request.user?.sub ?? 'anon'}`,
        );
      }),
    );
  }
}
