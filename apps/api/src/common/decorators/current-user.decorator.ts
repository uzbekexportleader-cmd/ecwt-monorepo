import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@ecwt/types';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
