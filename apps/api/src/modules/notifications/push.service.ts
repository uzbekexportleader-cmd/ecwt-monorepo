import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

/** Expo push xizmatining manzili */
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Expo bitta so'rovda 100 tagacha xabar qabul qiladi */
const CHUNK_SIZE = 100;

/** Sekin tarmoqda osilib qolmasin */
const TIMEOUT_MS = 10_000;

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Push bildirishnoma yuborish (Expo Push Service orqali).
 *
 * Nega Expo: ilova EAS bilan quriladi, shuning uchun FCM/APNs kalitlarini
 * serverda saqlash shart emas — Expo o'zi ikkala platformaga yetkazadi.
 *
 * Muhim: push yuborish **hech qachon** asosiy amalni to'xtatmasligi kerak.
 * Ariza tasdiqlangani bazaga yozilgan bo'lsa, push yetib bormagani uchun
 * tranzaksiya orqaga qaytmaydi — xato faqat logga yoziladi.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Foydalanuvchining barcha faol qurilmalariga yuboradi.
   *
   * @param route ilova ichidagi manzil — bosilganda shu yerga o'tadi
   */
  async sendToUsers(
    userIds: string[],
    payload: { title: string; body: string; route?: string | null },
  ): Promise<void> {
    if (!userIds.length) return;

    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds }, isActive: true },
      select: { token: true },
    });
    if (!devices.length) return;

    const messages = devices.map((d) => ({
      to: d.token,
      title: payload.title,
      body: payload.body,
      sound: 'default' as const,
      // Ilova bosilganda qayerga o'tishni mobil tomon shu ma'lumotdan oladi
      data: payload.route ? { route: payload.route } : {},
    }));

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      await this.sendChunk(messages.slice(i, i + CHUNK_SIZE));
    }
  }

  private async sendChunk(messages: object[]): Promise<void> {
    let tickets: ExpoPushTicket[];
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!res.ok) {
        this.logger.warn(`Expo push ${res.status}: ${await res.text().catch(() => '')}`);
        return;
      }
      const json = (await res.json()) as { data?: ExpoPushTicket[] };
      tickets = json.data ?? [];
    } catch (err) {
      // Tarmoq uzilishi — bildirishnoma baribir ilova ichida ko'rinadi
      this.logger.warn(`Push yuborilmadi: ${(err as Error).message}`);
      return;
    }

    await this.handleTickets(messages, tickets);
  }

  /**
   * Yaroqsiz tokenlarni o'chiradi.
   *
   * Foydalanuvchi ilovani o'chirsa Expo `DeviceNotRegistered` qaytaradi —
   * bunday tokenga qayta-qayta urinish keraksiz va Expo limitini yeydi.
   */
  private async handleTickets(messages: object[], tickets: ExpoPushTicket[]): Promise<void> {
    const dead: string[] = [];

    tickets.forEach((ticket, index) => {
      if (ticket.status !== 'error') return;
      const to = (messages[index] as { to?: string }).to;
      if (ticket.details?.error === 'DeviceNotRegistered' && to) {
        dead.push(to);
      } else {
        this.logger.warn(`Push xatosi: ${ticket.message ?? ticket.details?.error ?? 'noma’lum'}`);
      }
    });

    if (!dead.length) return;
    await this.prisma.deviceToken
      .updateMany({ where: { token: { in: dead } }, data: { isActive: false } })
      .catch(() => undefined);
    this.logger.log(`${dead.length} ta yaroqsiz token o'chirildi`);
  }

  /**
   * Qurilmani ro'yxatga oladi.
   *
   * Token global unikal: bitta telefonda boshqa hisobga kirilsa, yozuv yangi
   * egasiga o'tadi — aks holda eski egaga begona push ketardi.
   */
  async registerDevice(userId: string, token: string, platform?: string): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform: platform ?? null },
      update: { userId, platform: platform ?? null, isActive: true },
    });
  }

  /** Chiqishda chaqiriladi — bu telefonga endi push kelmaydi */
  async unregisterDevice(userId: string, token: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({ where: { userId, token } });
  }
}
