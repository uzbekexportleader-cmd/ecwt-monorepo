import { Body, Controller, Get, HttpCode, Ip, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  adminLoginSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
  setPasswordSchema,
  type AdminLoginInput,
  type LoginInput,
  type OtpRequestInput,
  type OtpVerifyInput,
  type RefreshInput,
  type SetPasswordInput,
} from '@ecwt/validation';

import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { zodBody } from '../../common/pipes/zod-validation.pipe';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('otp/request')
  @ApiOperation({ summary: 'Telefon raqamiga tasdiqlash kodini yuborish' })
  requestOtp(
    @Body(zodBody(otpRequestSchema)) body: OtpRequestInput,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.auth.requestOtp(body.phone, { ip, userAgent: req.headers['user-agent'] });
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('otp/verify')
  @ApiOperation({ summary: 'Kodni tasdiqlash va tizimga kirish' })
  verifyOtp(
    @Body(zodBody(otpVerifySchema)) body: OtpVerifyInput,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.auth.verifyOtp(body.phone, body.code, { ip, userAgent: req.headers['user-agent'] });
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('admin/login')
  @ApiOperation({ summary: 'Admin panel uchun parol bilan kirish' })
  adminLogin(
    @Body(zodBody(adminLoginSchema)) body: AdminLoginInput,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.auth.adminLogin(body.phone, body.password, { ip, userAgent: req.headers['user-agent'] });
  }

  /**
   * Telefon + parol bilan kirish (hunarmandlar uchun).
   *
   * Limit OTP bilan bir xil darajada qat'iy: parol taxmin qilinadigan
   * narsa, shuning uchun urinishlar soni cheklanadi.
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Telefon va parol bilan kirish' })
  login(
    @Body(zodBody(loginSchema)) body: LoginInput,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.auth.login(body.phone, body.password, { ip, userAgent: req.headers['user-agent'] });
  }

  /** Parol o'rnatish yoki almashtirish (kirgan foydalanuvchi uchun) */
  @Post('password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Parol o‘rnatish yoki almashtirish' })
  async setPassword(
    @CurrentUser('sub') userId: string,
    @Body(zodBody(setPasswordSchema)) body: SetPasswordInput,
  ): Promise<void> {
    await this.auth.setPassword(userId, body.currentPassword, body.newPassword);
  }

  /** Parol o'rnatilganmi — ilova sozlamalar ekranini shunga qarab chizadi */
  @Get('password')
  @ApiOperation({ summary: 'Parol o‘rnatilganmi' })
  async hasPassword(@CurrentUser('sub') userId: string): Promise<{ hasPassword: boolean }> {
    return { hasPassword: await this.auth.hasPassword(userId) };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Access tokenni yangilash (refresh rotation)' })
  refresh(@Body(zodBody(refreshSchema)) body: RefreshInput, @Ip() ip: string, @Req() req: Request) {
    return this.auth.refresh(body.refreshToken, { ip, userAgent: req.headers['user-agent'] });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Sessiyani yopish' })
  async logout(@Body(zodBody(refreshSchema)) body: RefreshInput): Promise<{ ok: true }> {
    await this.auth.logout(body.refreshToken);
    return { ok: true };
  }
}
