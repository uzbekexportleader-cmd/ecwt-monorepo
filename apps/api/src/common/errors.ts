import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from '@ecwt/contracts';

const STATUS_BY_CODE: Record<ApiErrorCode, HttpStatus> = {
  validation_error: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  rate_limited: HttpStatus.TOO_MANY_REQUESTS,
  dependency_failure: HttpStatus.BAD_GATEWAY,
  internal_error: HttpStatus.INTERNAL_SERVER_ERROR,
};

/**
 * Ilovadagi barcha kutilgan xatolar shu klass orqali chiqadi.
 * `message` foydalanuvchiga ko'rsatiladi — hech qachon ichki tafsilot yozmang.
 */
export class AppError extends HttpException {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super({ code, message, details }, STATUS_BY_CODE[code]);
  }

  static validation(message: string, details?: Record<string, string[]>): AppError {
    return new AppError('validation_error', message, details);
  }

  static unauthorized(message = 'Avtorizatsiyadan o‘ting'): AppError {
    return new AppError('unauthorized', message);
  }

  static forbidden(message = 'Bu amalga ruxsatingiz yo‘q'): AppError {
    return new AppError('forbidden', message);
  }

  static notFound(message = 'Ma’lumot topilmadi'): AppError {
    return new AppError('not_found', message);
  }

  static conflict(message: string): AppError {
    return new AppError('conflict', message);
  }

  static dependencyFailure(message = 'Tashqi xizmat javob bermadi'): AppError {
    return new AppError('dependency_failure', message);
  }

  static internal(message = 'Serverda kutilmagan xato'): AppError {
    return new AppError('internal_error', message);
  }
}
