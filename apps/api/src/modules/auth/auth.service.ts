import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { OTP_LENGTH, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from '@ecwt/config';
import type { AuthResponse, AuthTokens, OtpRequestResponse, SessionUser } from '@ecwt/types';

import { PrismaService } from '../../prisma/prisma.service';
import { ENV, limits, type Env } from '../../config/env';
import { SMS_PROVIDER, type SmsProvider } from '../sms/sms.provider';
import { AuditService } from '../../common/audit/audit.service';

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    @Inject(ENV) private readonly env: Env,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  /* ------------------------------- OTP -------------------------------- */

  async requestOtp(phone: string, meta: RequestMeta): Promise<OtpRequestResponse> {
    const { otpResendCooldownSec, otpHourlyLimit } = limits(this.env);
    const cooldownStart = new Date(Date.now() - otpResendCooldownSec * 1000);
    const recent = await this.prisma.otpRequest.findFirst({
      where: { phone, createdAt: { gt: cooldownStart } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      const waitSec = Math.ceil(
        (recent.createdAt.getTime() + otpResendCooldownSec * 1000 - Date.now()) / 1000,
      );
      throw new BadRequestException(`Yangi kod so‘rash uchun ${waitSec} soniya kuting`);
    }

    // Spam himoyasi (productionda qat'iy, developmentda yumshoq)
    const hourAgo = new Date(Date.now() - 3600_000);
    const hourlyCount = await this.prisma.otpRequest.count({
      where: { phone, createdAt: { gt: hourAgo } },
    });
    if (hourlyCount >= otpHourlyLimit) {
      throw new BadRequestException(
        'Bu raqamga juda ko‘p kod yuborildi. Biroz kutib, qayta urinib ko‘ring.',
      );
    }

    const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    const request = await this.prisma.otpRequest.create({ data: { phone, codeHash, expiresAt } });

    try {
      /*
       * Matn Eskiz.uz da TASDIQLANGAN shablon bilan belgi-ma-belgi bir xil
       * bo'lishi shart (shablon ID 90006, 15.09.2026 da tasdiqlangan):
       *
       *   Kodni hech kimga bermang! ECWT ilovasiga kirish uchun tasdiqlash kodi 000000
       *
       * DIQQAT: "kodi" dan keyin ikki nuqta YO'Q. Ilgari shu yerda ":"
       * turardi va u shablonga mos kelmasdi — Eskiz bunday xabarni
       * yubormaydi. Matnni o'zgartirsangiz, avval Eskizda yangi shablonni
       * tasdiqlating, aks holda SMS umuman ketmay qoladi.
       */
      await this.sms.send(
        phone,
        `Kodni hech kimga bermang! ECWT ilovasiga kirish uchun tasdiqlash kodi ${code}`,
      );
    } catch (error) {
      /*
       * SMS ketmasa yozuvni O'CHIRAMIZ.
       *
       * Aks holda foydalanuvchi hech qanday xabar olmagan holda "60 soniya
       * kuting" chekloviga tushib qolardi va sababini tushunmasdi: Eskiz
       * balansi tugagan yoki xizmat javob bermagan bo'lishi mumkin, lekin
       * bu uning aybi emas. Yozuv o'chirilsa — darhol qayta urina oladi.
       *
       * O'chirishning o'zi ham xato bersa, asosiy sababni yashirmaymiz.
       */
      await this.prisma.otpRequest.delete({ where: { id: request.id } }).catch(() => undefined);
      throw error;
    }

    await this.audit.record({
      action: 'auth.otp.request',
      entity: 'OtpRequest',
      metadata: { phone: maskPhone(phone), provider: this.sms.name },
      ip: meta.ip,
    });

    const exposeDevCode = this.env.EXPOSE_DEV_OTP && this.env.NODE_ENV !== 'production';
    return {
      phone: maskPhone(phone),
      expiresInSec: OTP_TTL_SECONDS,
      ...(exposeDevCode ? { devCode: code } : {}),
    };
  }

  async verifyOtp(phone: string, code: string, meta: RequestMeta): Promise<AuthResponse> {
    const otp = await this.prisma.otpRequest.findFirst({
      where: { phone, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      throw new BadRequestException('Kod topilmadi yoki muddati tugagan. Yangi kod so‘rang.');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Urinishlar tugadi. Yangi kod so‘rang.');
    }

    const matches = await bcrypt.compare(code, otp.codeHash);
    if (!matches) {
      await this.prisma.otpRequest.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      const left = OTP_MAX_ATTEMPTS - otp.attempts - 1;
      throw new BadRequestException(
        left > 0 ? `Kod noto‘g‘ri. Yana ${left} ta urinish qoldi.` : 'Kod noto‘g‘ri. Yangi kod so‘rang.',
      );
    }

    await this.prisma.otpRequest.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: { phone },
      update: { lastLoginAt: new Date() },
      include: { profile: { select: { id: true } } },
    });

    if (!user.isActive) {
      throw new ForbiddenException('Akkaunt bloklangan. Qo‘llab-quvvatlash xizmatiga murojaat qiling.');
    }

    // Birinchi kirishda bo'sh profil yaratamiz — keyingi ekranlar shu profilni to'ldiradi
    if (!user.profile) {
      await this.prisma.artisanProfile.create({ data: { userId: user.id } });
    }

    const tokens = await this.issueTokens(user.id, user.phone, user.role, meta);
    await this.audit.record({
      actorId: user.id,
      actorName: user.fullName ?? maskPhone(user.phone),
      action: 'auth.login.otp',
      entity: 'User',
      entityId: user.id,
      ip: meta.ip,
    });

    return { ...tokens, user: await this.toSessionUser(user.id) };
  }

  /* ----------------------------- admin login --------------------------- */

  async adminLogin(phone: string, password: string, meta: RequestMeta): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Telefon raqami yoki parol noto‘g‘ri');
    }
    if (user.role === 'USER') {
      throw new ForbiddenException('Bu bo‘limga kirish huquqingiz yo‘q');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Telefon raqami yoki parol noto‘g‘ri');
    }
    if (!user.isActive) throw new ForbiddenException('Akkaunt bloklangan');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens(user.id, user.phone, user.role, meta);
    await this.audit.record({
      actorId: user.id,
      actorName: user.fullName ?? maskPhone(user.phone),
      action: 'auth.login.admin',
      entity: 'User',
      entityId: user.id,
      ip: meta.ip,
    });
    return { ...tokens, user: await this.toSessionUser(user.id) };
  }

  /* --------------------- parol bilan kirish (USER) --------------------- */

  /**
   * Telefon + parol bilan kirish.
   *
   * `adminLogin` dan farqi: bu yerda oddiy foydalanuvchi ham kira oladi.
   * Admin/xodimlar baribir o'z endpointidan kirishi kerak — rollarni bir
   * joyda aralashtirmaymiz.
   *
   * XAVFSIZLIK: raqam topilmasa ham, parol xato bo'lsa ham BIR XIL xabar
   * qaytadi. Aks holda ilova "bu raqam ro'yxatdan o'tganmi yo'qmi" degan
   * savolga javob beruvchi asbobga aylanadi.
   */
  async login(phone: string, password: string, meta: RequestMeta): Promise<AuthResponse> {
    const invalid = new UnauthorizedException('Telefon raqami yoki parol noto‘g‘ri');

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user?.passwordHash) throw invalid;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw invalid;

    if (!user.isActive) throw new ForbiddenException('Akkaunt bloklangan');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await this.issueTokens(user.id, user.phone, user.role, meta);
    await this.audit.record({
      actorId: user.id,
      actorName: user.fullName ?? maskPhone(user.phone),
      action: 'auth.login.password',
      entity: 'User',
      entityId: user.id,
      ip: meta.ip,
    });
    return { ...tokens, user: await this.toSessionUser(user.id) };
  }

  /**
   * Parol o'rnatish yoki almashtirish.
   *
   * Parol allaqachon bo'lsa — joriy parol so'raladi. Busiz telefonni qo'lga
   * kiritgan odam parolni jimgina almashtirib, haqiqiy egasini hisobidan
   * chiqarib yuborishi mumkin edi.
   *
   * Parol o'rnatilgach BOSHQA sessiyalar bekor qilinmaydi: foydalanuvchi
   * o'zining boshqa qurilmalaridan chiqib qolmasligi kerak.
   */
  async setPassword(userId: string, currentPassword: string | undefined, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException('Joriy parolni kiriting');
      }
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) throw new UnauthorizedException('Joriy parol noto‘g‘ri');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });

    await this.audit.record({
      actorId: userId,
      actorName: user.fullName ?? maskPhone(user.phone),
      action: user.passwordHash ? 'auth.password.changed' : 'auth.password.set',
      entity: 'User',
      entityId: userId,
    });
  }

  /** Foydalanuvchida parol bormi — mobil ilova kirish ekranini shunga qarab chizadi */
  async hasPassword(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    return Boolean(user?.passwordHash);
  }

  /* ------------------------------ refresh ------------------------------ */

  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthTokens> {
    let payload: { sub: string; sid: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Sessiya yaroqsiz. Qaytadan kiring.');
    }

    const hash = sha256(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { id: payload.sid, refreshTokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!session) {
      // Ehtimoliy token o'g'irlanishi: shu foydalanuvchining barcha sessiyalarini bekor qilamiz
      await this.prisma.session.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Sessiya bekor qilingan. Qaytadan kiring.');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(session.userId, session.user.phone, session.user.role, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = sha256(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /* ------------------------------ yordamchi ---------------------------- */

  private async issueTokens(
    userId: string,
    phone: string,
    role: string,
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const expiresAt = new Date(Date.now() + this.env.JWT_REFRESH_TTL_DAYS * 86_400_000);
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: 'pending',
        expiresAt,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    const accessToken = await this.jwt.signAsync(
      { sub: userId, phone, role },
      { secret: this.env.JWT_ACCESS_SECRET, expiresIn: this.env.JWT_ACCESS_TTL },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, sid: session.id },
      { secret: this.env.JWT_REFRESH_SECRET, expiresIn: this.env.JWT_REFRESH_TTL_DAYS * 86_400 },
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: sha256(refreshToken) },
    });

    return { accessToken, refreshToken, expiresIn: this.env.JWT_ACCESS_TTL };
  }

  async toSessionUser(userId: string): Promise<SessionUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: { select: { id: true, completionPercent: true } } },
    });
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      locale: user.locale,
      fullName: user.fullName,
      hasProfile: !!user.profile,
    };
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length !== 12) return '***';
  return `+${d.slice(0, 3)} ${d.slice(3, 5)} *** ** ${d.slice(10)}`;
}
