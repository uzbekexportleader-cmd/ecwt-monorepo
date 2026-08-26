import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  type ChangePasswordInput,
  type LoginInput,
  type RefreshInput,
  type RegisterInput,
} from '@ecwt/contracts';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, Public } from '../../common/decorators';
import type { AppRequest } from '../../common/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Ro'yxatdan o'tish — soatiga 5 marta (bot va spam himoyasi) */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput,
    @Req() req: AppRequest,
  ) {
    return this.auth.register(dto, sessionContext(req));
  }

  /** Kirish — daqiqasiga 10 marta */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginInput, @Req() req: AppRequest) {
    return this.auth.login(dto, sessionContext(req));
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshInput, @Req() req: AppRequest) {
    return this.auth.refresh(dto.refreshToken, sessionContext(req));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@CurrentUser('sid') sessionId: string): Promise<void> {
    await this.auth.logout(sessionId);
  }

  /** Barcha qurilmalardan chiqish */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout-all')
  async logoutAll(@CurrentUser('sub') userId: string): Promise<void> {
    await this.auth.logoutAll(userId);
  }

  @Get('me')
  me(@CurrentUser('sub') userId: string) {
    return this.auth.me(userId);
  }

  @Get('sessions')
  sessions(@CurrentUser('sub') userId: string, @CurrentUser('sid') sessionId: string) {
    return this.auth.listSessions(userId, sessionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('change-password')
  async changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordInput,
    @CurrentUser('sub') userId: string,
    @CurrentUser('sid') sessionId: string,
  ): Promise<void> {
    await this.auth.changePassword(userId, dto, sessionId);
  }

  /** Bitta sessiyani yopish (masalan, yo'qolgan telefon) */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUser('sub') userId: string,
    @Param('id') sessionId: string,
  ): Promise<void> {
    await this.auth.revokeSession(userId, sessionId);
  }
}

function sessionContext(req: AppRequest) {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    deviceId: typeof req.headers['x-device-id'] === 'string' ? req.headers['x-device-id'] : undefined,
  };
}
