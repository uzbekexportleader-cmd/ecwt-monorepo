import { Inject, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TELEGRAM_PROVIDER, type TelegramProvider } from '../telegram/telegram.provider';
import { DocumentsService } from '../documents/documents.service';

/** Faoliyat turlarining o'qiladigan nomlari */
const ACTIVITY_LABEL: Record<string, string> = {
  HUNARMAND: 'Hunarmand',
  AGRO_HOLDING: 'Agro holding',
  TADBIRKOR: 'Tadbirkor',
  TEXTILE: 'Textile',
  ISHLAB_CHIQARUVCHI: 'Ishlab chiqaruvchi',
};

const PAYMENT_LABEL: Record<string, string> = {
  SUBSIDY: 'Subsidiya orqali',
  SELF: 'O‘zi to‘laydi',
};

const GENDER_LABEL: Record<string, string> = { MALE: 'Erkak', FEMALE: 'Ayol' };

/**
 * Ro'yxatdan o'tish tugaganda ECWT tomonini xabardor qiladi.
 *
 * Uch kanal:
 *   1. Admin panel ichidagi bildirishnoma (barcha ADMIN/SUPER_ADMIN uchun);
 *   2. Telegram xabari — mutaxassis darhol ko'radi, foydalanuvchining
 *      TO'LIQ profili bilan (rasm, GPS, bank, STIR va h.k.);
 *   3. Foydalanuvchining o'zi ilova ichida "Anketa" bo'limida xuddi shu
 *      ma'lumotlarni ko'ra oladi (frontend: app/profile/anketa.tsx).
 *
 * MUHIM: xabar yuborilmasa ham ariza YO'QOLMAYDI — u bazada saqlangan.
 * Shu sababli bu yerdagi har qanday xatolik faqat logga yoziladi va
 * foydalanuvchining oqimini to'xtatmaydi.
 */
@Injectable()
export class OnboardingAlertService {
  private readonly logger = new Logger(OnboardingAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly documents: DocumentsService,
    @Inject(TELEGRAM_PROVIDER) private readonly telegram: TelegramProvider,
  ) {}

  async onOnboardingCompleted(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: { include: { craftCategory: true } } },
      });
      if (!user?.profile) return;

      const p = user.profile;
      const fullName = [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ') || '—';
      const activity = p.activityType ? (ACTIVITY_LABEL[p.activityType] ?? p.activityType) : '—';

      await this.notifyAdmins(fullName, user.phone, activity);
      await this.notifyTelegram(userId, user.phone);
    } catch (e) {
      // Ariza allaqachon saqlangan — bu yerdagi xato foydalanuvchiga chiqmaydi
      this.logger.error(
        `Ro‘yxatdan o‘tish xabarnomasi yuborilmadi: ${e instanceof Error ? e.message : 'noma’lum'}`,
      );
    }
  }

  private async notifyAdmins(fullName: string, phone: string, activity: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true },
    });

    await this.notifications.createMany(
      admins.map((a) => a.id),
      {
        type: 'SYSTEM',
        title: 'Yangi ariza: ro‘yxatdan o‘tish tugadi',
        body: `${fullName} (${phone}) — ${activity}. Ma’lumotlarni ko‘rib chiqing.`,
        route: '/users',
      },
    );
  }

  /**
   * Telegram'ga foydalanuvchining TO'LIQ ma'lumotlarini yuboradi: shaxsiy
   * ma'lumotlar, manzil + GPS, hunar, bank rekvizitlari, STIR — va agar
   * Face ID bosqichida selfi yuklangan bo'lsa, xuddi o'sha rasm bilan
   * birga (quruq ariza raqami emas, to'liq anketa).
   */
  private async notifyTelegram(userId: string, phone: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: { craftCategory: true } } },
    });
    const p = user?.profile;
    if (!p) return;

    const fullName = [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ') || '—';
    const activity = p.activityType ? (ACTIVITY_LABEL[p.activityType] ?? p.activityType) : '—';
    const payment = p.paymentMethod ? (PAYMENT_LABEL[p.paymentMethod] ?? p.paymentMethod) : '—';
    const gender = p.gender ? (GENDER_LABEL[p.gender] ?? p.gender) : null;
    const birthDate = p.birthDate ? p.birthDate.toISOString().slice(0, 10) : null;

    const address = [p.region, p.district, p.mahalla, p.street, p.houseNumber]
      .filter(Boolean)
      .join(', ');

    const marketplace = p.selectedMarketplaces[0] ?? null;
    const services = [
      p.wantsBrandSite ? 'Shopify + Shaxsiy mahsulot' : null,
      p.wantsDropshipping ? 'Shopify + Dropshipping' : null,
      p.wantsChinaImport ? 'Shaxsiy sayt + Xitoy mahsulotlari' : null,
    ].filter(Boolean);

    const lines = ['<b>🆕 ECWT — yangi ariza (to‘liq anketa)</b>', ''];

    lines.push('<b>— Shaxsiy ma’lumotlar —</b>');
    lines.push(`<b>F.I.Sh.:</b> ${escapeHtml(fullName)}`);
    lines.push(`<b>Telefon:</b> ${escapeHtml(p.contactPhone ?? phone)}`);
    if (birthDate) lines.push(`<b>Tug‘ilgan sana:</b> ${escapeHtml(birthDate)}`);
    if (gender) lines.push(`<b>Jinsi:</b> ${escapeHtml(gender)}`);
    if (p.pinfl) lines.push(`<b>JShShIR:</b> ${escapeHtml(p.pinfl)}`);

    lines.push('', '<b>— Manzil —</b>');
    if (address) lines.push(`<b>Manzil:</b> ${escapeHtml(address)}`);
    if (p.latitude != null && p.longitude != null) {
      lines.push(
        `<b>GPS:</b> <a href="https://maps.google.com/?q=${p.latitude},${p.longitude}">${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}</a>`,
      );
    }

    lines.push('', '<b>— Faoliyat —</b>');
    lines.push(`<b>Faoliyat turi:</b> ${escapeHtml(activity)}`);
    if (p.craftCategory) lines.push(`<b>Hunar:</b> ${escapeHtml(p.craftCategory.nameUz)}`);
    if (p.yearsOfExperience != null) lines.push(`<b>Tajriba:</b> ${p.yearsOfExperience} yil`);
    if (p.workshopAddress) lines.push(`<b>Ustaxona:</b> ${escapeHtml(p.workshopAddress)}`);
    if (marketplace) lines.push(`<b>Marketplace:</b> ${escapeHtml(marketplace)}`);
    if (services.length) lines.push(`<b>Xizmat:</b> ${escapeHtml(services.join(', '))}`);
    lines.push(`<b>To‘lov:</b> ${escapeHtml(payment)}`);

    lines.push('', '<b>— Tadbirkorlik va bank —</b>');
    if (p.stir) lines.push(`<b>STIR:</b> ${escapeHtml(p.stir)}`);
    if (p.membershipStatus && p.membershipStatus !== 'NONE') {
      lines.push(`<b>Uyushma a’zoligi:</b> ${escapeHtml(p.membershipStatus)}`);
    }
    if (p.bankAccount) lines.push(`<b>Hisob raqami:</b> <code>${escapeHtml(p.bankAccount)}</code>`);
    if (p.bankMfo) lines.push(`<b>MFO:</b> ${escapeHtml(p.bankMfo)}`);
    if (p.bankName) lines.push(`<b>Bank nomi:</b> ${escapeHtml(p.bankName)}`);
    if (p.bankCardMasked) lines.push(`<b>Karta:</b> ${escapeHtml(p.bankCardMasked)}`);

    const caption = lines.join('\n');

    /* Face ID bosqichida yuklangan eng so'nggi selfi — bor bo'lsa rasm bilan yuboriladi */
    const selfie = await this.prisma.document.findFirst({
      where: { userId, type: 'SELFIE' },
      orderBy: { createdAt: 'desc' },
    });

    let result;
    if (selfie) {
      try {
        const file = await this.documents.readFile(selfie.id);
        result = await this.telegram.sendPhoto(file.buffer, file.fileName, caption);
      } catch (e) {
        this.logger.warn(
          `Selfi o'qib bo'lmadi, matnli xabarga o'tildi: ${e instanceof Error ? e.message : 'noma’lum'}`,
        );
        result = await this.telegram.send(caption);
      }
    } else {
      result = await this.telegram.send(caption);
    }

    if (!result.sent) {
      this.logger.warn(`Telegram xabari yuborilmadi: ${result.reason ?? 'sabab noma’lum'}`);
    }
  }
}

/** Telegram HTML rejimi uchun xavfli belgilarni almashtiradi */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
