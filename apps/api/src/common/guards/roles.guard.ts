import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@ecwt/types';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '../decorators/current-user.decorator';

const RANK: Record<Role, number> = {
  USER: 0,
  REVIEWER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const role = request.user?.role;
    if (!role) throw new ForbiddenException('Ruxsat yo‘q');

    const minRequired = Math.min(...required.map((r) => RANK[r]));
    if (RANK[role] < minRequired) {
      throw new ForbiddenException('Bu amal uchun ruxsatingiz yetarli emas');
    }
    return true;
  }
}
