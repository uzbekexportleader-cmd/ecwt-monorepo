import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import type { ApiErrorBody, ApiErrorCode } from '@ecwt/contracts';
import { AppError } from '../errors';
import type { AppRequest } from '../types';

/**
 * Barcha xatolarni bitta ko'rinishga keltiradi:
 *   { error: { code, message, details?, requestId } }
 *
 * Ichki tafsilotlar (stack trace, SQL xatolari) hech qachon klientga chiqmaydi —
 * ular faqat log'ga yoziladi.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AppRequest>();
    const requestId = request.requestId;

    const { status, body, logLevel } = this.normalize(exception, requestId);

    if (logLevel === 'error') {
      this.logger.error(
        `[${requestId ?? '-'}] ${request.method} ${request.url} -> ${status} ${body.error.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${requestId ?? '-'}] ${request.method} ${request.url} -> ${status} ${body.error.code}: ${body.error.message}`,
      );
    }

    response.status(status).json(body);
  }

  private normalize(
    exception: unknown,
    requestId: string | undefined,
  ): { status: number; body: ApiErrorBody; logLevel: 'warn' | 'error' } {
    // 1. Bizning xatolarimiz
    if (exception instanceof AppError) {
      return {
        status: exception.getStatus(),
        body: {
          error: {
            code: exception.code,
            message: exception.message,
            ...(exception.details ? { details: exception.details } : {}),
            ...(requestId ? { requestId } : {}),
          },
        },
        logLevel: exception.getStatus() >= 500 ? 'error' : 'warn',
      };
    }

    // 2. Rate limit
    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        body: {
          error: {
            code: 'rate_limited',
            message: 'Juda ko‘p so‘rov yubordingiz. Biroz kutib, qayta urinib ko‘ring.',
            ...(requestId ? { requestId } : {}),
          },
        },
        logLevel: 'warn',
      };
    }

    // 3. Prisma xatolari
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      return {
        status: mapped.status,
        body: {
          error: {
            code: mapped.code,
            message: mapped.message,
            ...(requestId ? { requestId } : {}),
          },
        },
        logLevel: mapped.status >= 500 ? 'error' : 'warn',
      };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          error: {
            code: 'validation_error',
            message: 'So‘rov ma’lumotlari noto‘g‘ri',
            ...(requestId ? { requestId } : {}),
          },
        },
        logLevel: 'error', // bu odatda kod xatosi — ko'rish kerak
      };
    }

    // 4. NestJS'ning o'z HttpException'lari
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        body: {
          error: {
            code: codeFromStatus(status),
            message: safeHttpMessage(exception),
            ...(requestId ? { requestId } : {}),
          },
        },
        logLevel: status >= 500 ? 'error' : 'warn',
      };
    }

    // 5. Kutilmagan hamma narsa
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: 'internal_error',
          message: 'Serverda kutilmagan xato yuz berdi',
          ...(requestId ? { requestId } : {}),
        },
      },
      logLevel: 'error',
    };
  }
}

function mapPrismaError(e: Prisma.PrismaClientKnownRequestError): {
  status: number;
  code: ApiErrorCode;
  message: string;
} {
  switch (e.code) {
    case 'P2002': {
      // Unique constraint — qaysi maydon ekanini ayta olamiz, qiymatni emas
      const target = Array.isArray(e.meta?.['target']) ? (e.meta['target'] as string[]).join(', ') : null;
      return {
        status: HttpStatus.CONFLICT,
        code: 'conflict',
        message: target
          ? `Bunday ma’lumot allaqachon mavjud (${target})`
          : 'Bunday ma’lumot allaqachon mavjud',
      };
    }
    case 'P2025':
      return { status: HttpStatus.NOT_FOUND, code: 'not_found', message: 'Ma’lumot topilmadi' };
    case 'P2003':
      return {
        status: HttpStatus.CONFLICT,
        code: 'conflict',
        message: 'Bog‘liq ma’lumot mavjudligi sababli amal bajarilmadi',
      };
    case 'P1001':
    case 'P1002':
      return {
        status: HttpStatus.BAD_GATEWAY,
        code: 'dependency_failure',
        message: 'Ma’lumotlar bazasiga ulanib bo‘lmadi',
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'internal_error',
        message: 'Ma’lumotlar bazasida xato',
      };
  }
}

function codeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'validation_error';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limited';
    case 502:
    case 503:
    case 504:
      return 'dependency_failure';
    default:
      return status >= 500 ? 'internal_error' : 'validation_error';
  }
}

/** 5xx xabarlarini oshkor qilmaymiz — ichida ichki tafsilot bo'lishi mumkin */
function safeHttpMessage(exception: HttpException): string {
  if (exception.getStatus() >= 500) return 'Serverda kutilmagan xato yuz berdi';

  const res = exception.getResponse();
  if (typeof res === 'string') return res;
  if (typeof res === 'object' && res !== null) {
    const message = (res as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  }
  return exception.message || 'So‘rovni bajarib bo‘lmadi';
}
