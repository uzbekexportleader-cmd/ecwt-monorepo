import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { JwtPayload, UserRole } from '@ecwt/contracts';
import { AppError } from '../errors';
import type { AppRequest } from '../types';

export const IS_PUBLIC_KEY = 'ecwt:isPublic';
/** Bu endpoint token talab qilmaydi */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'ecwt:roles';
/** Faqat sanab o'tilgan rollar kira oladi */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

/** Kontroller metodida joriy foydalanuvchini olish */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AppRequest>();
    const user = request.user;

    if (!user) throw AppError.unauthorized();

    return data ? user[data] : user;
  },
);

/**
 * Joriy foydalanuvchining supplierId'si. Hamkor bo'lmagan foydalanuvchida
 * (masalan admin) `null` bo'ladi — kontroller buni o'zi hal qiladi.
 */
export const CurrentSupplierId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AppRequest>();
  if (!request.user) throw AppError.unauthorized();
  return request.user.supplierId;
});
