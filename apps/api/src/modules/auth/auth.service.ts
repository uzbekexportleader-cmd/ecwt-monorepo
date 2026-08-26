import { Injectable, Logger } from '@nestjs/common';
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from '@ecwt/contracts';
import type { Prisma, User } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../common/errors';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

/** Ketma-ket shuncha xato kirishdan keyin akkaunt vaqtincha bloklanadi */
const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

interface SessionContext {
  ip?: string;
  userAgent?: string;
  deviceId?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput, ctx: SessionContext): Promise<AuthResponse> {
    // Email va telefon bandligini oldindan tekshiramiz — foydalanuvchiga
    // aniq xabar berish uchun. Yakuniy kafolat baribir DB'dagi unique indeks.
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { phone: input.phone }] },
      select: { email: true, phone: true },
    });

    if (existing) {
      throw AppError.conflict(
        existing.email === input.email
          ? 'Bu email allaqachon ro‘yxatdan o‘tgan'
          : 'Bu telefon raqami allaqachon ro‘yxatdan o‘tgan',
      );
    }

    const passwordHash = await this.passwords.hash(input.password);

    // Foydalanuvchi va hamkor profili birga yaratiladi — biri yaratilib
    // ikkinchisi yaratilmay qolishi mumkin emas.
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        fullName: input.fullName,
        role: 'SUPPLIER',
        status: 'ACTIVE',
        locale: input.locale ?? 'uz',
        supplier: {
          create: {
            companyName: input.companyName,
            contactPhone: input.phone,
            contactEmail: input.email,
            status: 'DRAFT',
          },
        },
      },
      include: { supplier: { select: { id: true } } },
    });

    this.logger.log(`Yangi hamkor ro‘yxatdan o‘tdi: ${user.id}`);

    return this.createSessionResponse(user, user.supplier?.id ?? null, ctx);
  }

  async login(input: LoginInput, ctx: SessionContext): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { supplier: { select: { id: true } } },
    });

    // Foydalanuvchi topilmasa ham parolni "tekshirgandek" vaqt sarflaymiz,
    // aks holda javob tezligidan email bor-yo'qligini bilib olish mumkin.
    if (!user) {
      await this.passwords.verifyDummy(input.password);
      throw AppError.unauthorized('Email yoki parol noto‘g‘ri');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw AppError.forbidden(
        `Ko‘p marta noto‘g‘ri urinish. ${minutes} daqiqadan keyin qayta urinib ko‘ring.`,
      );
    }

    const valid = await this.passwords.verify(user.passwordHash, input.password);

    if (!valid) {
      await this.registerFailedLogin(user);
      throw AppError.unauthorized('Email yoki parol noto‘g‘ri');
    }

    if (user.status === 'SUSPENDED') {
      throw AppError.forbidden('Akkauntingiz to‘xtatilgan. Qo‘llab-quvvatlash xizmatiga murojaat qiling.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return this.createSessionResponse(user, user.supplier?.id ?? null, {
      ...ctx,
      deviceId: input.deviceId ?? ctx.deviceId,
    });
  }

  /**
   * Refresh token almashtirish (rotation): eski token darhol bekor qilinadi.
   * Agar allaqachon bekor qilingan token ishlatilsa — bu o'g'irlangan token
   * belgisi, shuning uchun foydalanuvchining BARCHA sessiyalari yopiladi.
   */
  async refresh(refreshToken: string, ctx: SessionContext): Promise<AuthResponse> {
    const hash = TokenService.hashRefreshToken(refreshToken);

    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: { include: { supplier: { select: { id: true } } } } },
    });

    if (!session) throw AppError.unauthorized('Sessiya topilmadi, qaytadan kiring');

    if (session.revokedAt) {
      this.logger.warn(
        `Bekor qilingan refresh token ishlatildi (user=${session.userId}). Barcha sessiyalar yopildi.`,
      );
      await this.revokeAllSessions(session.userId);
      throw AppError.unauthorized('Xavfsizlik sababli barcha sessiyalar yopildi, qaytadan kiring');
    }

    if (session.expiresAt < new Date()) {
      throw AppError.unauthorized('Sessiya muddati tugagan, qaytadan kiring');
    }

    if (session.user.status === 'SUSPENDED') {
      await this.revokeAllSessions(session.userId);
      throw AppError.forbidden('Akkauntingiz to‘xtatilgan');
    }

    // Sessiya ID'sini oldindan o'zimiz beramiz — shunda token va yozuv
    // bitta amalda yaratiladi (avval yozib, keyin yangilash kerak emas).
    const supplierId = session.user.supplier?.id ?? null;
    const newSessionId = randomUUID();

    const issued = await this.tokens.issue({
      userId: session.userId,
      role: session.user.role,
      supplierId,
      sessionId: newSessionId,
    });

    // Eskisini yopish va yangisini ochish — ajralmas bitta amal.
    // `revokedAt: null` sharti ikki parallel refresh'dan faqat bittasi
    // o'tishini kafolatlaydi.
    await this.prisma.$transaction(async (tx) => {
      const revoked = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (revoked.count === 0) {
        // Boshqa so'rov bizdan oldin ulgurdi
        throw AppError.unauthorized('Sessiya yangilandi, qaytadan urinib ko‘ring');
      }

      await tx.session.create({
        data: {
          id: newSessionId,
          userId: session.userId,
          refreshTokenHash: issued.refreshTokenHash,
          expiresAt: issued.refreshExpiresAt,
          ip: ctx.ip ?? session.ip,
          userAgent: ctx.userAgent ?? session.userAgent,
          deviceId: session.deviceId,
        },
      });
    });

    return { user: toAuthUser(session.user, supplierId), tokens: issued.tokens };
  }

  async logout(sessionId: string): Promise<void> {
    // updateMany — sessiya topilmasa ham xato bermaydi (chiqish har doim ishlashi kerak)
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.revokeAllSessions(userId);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { supplier: { select: { id: true } } },
    });

    if (!user) throw AppError.notFound('Foydalanuvchi topilmadi');

    return toAuthUser(user, user.supplier?.id ?? null);
  }

  async changePassword(userId: string, input: ChangePasswordInput, keepSessionId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('Foydalanuvchi topilmadi');

    const valid = await this.passwords.verify(user.passwordHash, input.currentPassword);
    if (!valid) throw AppError.validation('Joriy parol noto‘g‘ri', { currentPassword: ['Parol noto‘g‘ri'] });

    const passwordHash = await this.passwords.hash(input.newPassword);

    // Parol o'zgargach boshqa barcha qurilmalardagi sessiyalar yopiladi
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null, id: { not: keepSessionId } },
        data: { revokedAt: new Date() },
      }),
    ]);

    this.logger.log(`Parol o‘zgartirildi: user=${userId}`);
  }

  /**
   * Bitta sessiyani yopish. `userId` sharti muhim — foydalanuvchi faqat
   * O'ZINING sessiyasini yopa oladi, boshqasinikini emas.
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) throw AppError.notFound('Sessiya topilmadi');
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        deviceId: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return sessions.map((s) => ({ ...s, isCurrent: s.id === currentSessionId }));
  }

  // -------------------------------------------------------------------------

  private async createSessionResponse(
    user: User,
    supplierId: string | null,
    ctx: SessionContext,
  ): Promise<AuthResponse> {
    const sessionId = randomUUID();

    const issued = await this.tokens.issue({
      userId: user.id,
      role: user.role,
      supplierId,
      sessionId,
    });

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: issued.refreshTokenHash,
        expiresAt: issued.refreshExpiresAt,
        ip: ctx.ip,
        userAgent: ctx.userAgent?.slice(0, 400),
        deviceId: ctx.deviceId,
      },
    });

    return { user: toAuthUser(user, supplierId), tokens: issued.tokens };
  }

  private async registerFailedLogin(user: User): Promise<void> {
    const nextCount = user.failedLoginCount + 1;
    const data: Prisma.UserUpdateInput = { failedLoginCount: nextCount };

    if (nextCount >= MAX_FAILED_LOGINS) {
      data.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      data.failedLoginCount = 0;
      this.logger.warn(`Akkaunt vaqtincha bloklandi: user=${user.id}`);
    }

    await this.prisma.user.update({ where: { id: user.id }, data });
  }

  private async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

function toAuthUser(user: User, supplierId: string | null): AuthUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    locale: user.locale,
    supplierId,
  };
}
