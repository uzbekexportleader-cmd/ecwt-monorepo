import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { SessionUser } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

const updateMeSchema = z.object({
  locale: z.enum(['uz', 'ru', 'en']).optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
});

@ApiTags('me')
@Controller('me')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Joriy foydalanuvchi' })
  me(@CurrentUser('sub') userId: string): Promise<SessionUser> {
    return this.auth.toSessionUser(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Til va ismni yangilash' })
  async update(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(updateMeSchema)) body: z.infer<typeof updateMeSchema>,
  ): Promise<SessionUser> {
    await this.prisma.user.update({ where: { id: userId }, data: body });
    return this.auth.toSessionUser(userId);
  }
}
