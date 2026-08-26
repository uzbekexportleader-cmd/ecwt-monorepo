import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import type { AuthTokens, JwtPayload, UserRole } from '@ecwt/contracts';

/**
 * Token strategiyasi:
 *
 * - Access token: qisqa muddatli JWT (15 daqiqa). Har so'rovda yuboriladi,
 *   DB'ga murojaat qilmasdan tekshiriladi.
 * - Refresh token: tasodifiy 48 baytli satr. JWT emas — chunki uni
 *   bekor qilish kerak, ya'ni baribir DB'da saqlanadi. DB'da faqat
 *   SHA-256 xeshi turadi, xom qiymat emas.
 *
 * Refresh token yuqori entropiyali tasodifiy satr bo'lgani uchun SHA-256
 * yetarli — bu yerda argon2 kerak emas (u sekin parollar uchun).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(params: {
    userId: string;
    role: UserRole;
    supplierId: string | null;
    sessionId: string;
  }): Promise<{ tokens: AuthTokens; refreshTokenHash: string; refreshExpiresAt: Date }> {
    const payload: JwtPayload = {
      sub: params.userId,
      role: params.role,
      supplierId: params.supplierId,
      sid: params.sessionId,
    };

    // "15m" ni sekundga o'giramiz: jsonwebtoken satr formatini ham qabul qiladi,
    // lekin son bilan tip xavfsizroq va `expiresIn` bilan javobdagi
    // `expiresIn` doim bir xil qiymatdan hisoblanadi.
    const accessTtlSeconds = parseTtlToSeconds(this.config.getOrThrow<string>('JWT_ACCESS_TTL'));

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtlSeconds,
    });

    const refreshToken = randomBytes(48).toString('base64url');
    const refreshDays = this.config.getOrThrow<number>('JWT_REFRESH_TTL_DAYS');
    const refreshExpiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: accessTtlSeconds,
      },
      refreshTokenHash: TokenService.hashRefreshToken(refreshToken),
      refreshExpiresAt,
    };
  }

  static hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

/** "15m", "1h", "30s", "7d" -> sekund */
export function parseTtlToSeconds(ttl: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
  if (!match) return 900;

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86400;
    default:
      return 900;
  }
}
