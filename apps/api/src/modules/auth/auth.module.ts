import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  // `global: true` — JwtAuthGuard AppModule darajasida global guard sifatida
  // ro'yxatdan o'tgan, ya'ni JwtService unga ham ko'rinishi kerak.
  //
  // Secret har chaqiruvda aniq ko'rsatiladi (access va refresh uchun har xil),
  // shuning uchun bu yerda global secret berilmaydi.
  imports: [JwtModule.register({ global: true }), SmsModule],
  controllers: [AuthController, OtpController],
  providers: [AuthService, PasswordService, TokenService, OtpService],
  exports: [AuthService, PasswordService, OtpService],
})
export class AuthModule {}
