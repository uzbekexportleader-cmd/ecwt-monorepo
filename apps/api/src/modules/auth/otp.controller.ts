import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  otpSendSchema,
  otpVerifySchema,
  type OtpSendInput,
  type OtpSendResponse,
  type OtpVerifyInput,
  type OtpVerifyResponse,
} from '@ecwt/contracts';
import { OtpService } from './otp.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators';

@Controller('auth/otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  /**
   * Kod yuborish — har bir SMS pul turadi, shuning uchun IP bo'yicha
   * chegara qattiq. Raqam bo'yicha alohida oraliq `OtpService` ichida.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('send')
  send(@Body(new ZodValidationPipe(otpSendSchema)) dto: OtpSendInput): Promise<OtpSendResponse> {
    return this.otp.requestCode(dto.phone);
  }

  /** Tekshirish — brute-force'ga qarshi kod bo'yicha urinishlar ham sanaladi */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verify(
    @Body(new ZodValidationPipe(otpVerifySchema)) dto: OtpVerifyInput,
  ): Promise<OtpVerifyResponse> {
    await this.otp.verifyCode(dto.phone, dto.code);
    return { verified: true };
  }
}
