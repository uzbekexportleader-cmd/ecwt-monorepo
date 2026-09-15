import { Inject, Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

import { ENV, type Env } from '../../config/env';
import type { TelegramProvider, TelegramSendResult } from './telegram.provider';

/**
 * Telegram'da rasm shu enidan katta bo'lmasin — original selfi kadri
 * (masalan 1728x2304) chatda butun ekranni egallab, matnni pastga
 * suriб yuborardi. CV/anketa uchun kichik ko'rinish, bosilganda esa
 * Telegram'ning o'zi to'liq o'lchamga kattalashtiradi (standart xatti-harakat).
 */
const TELEGRAM_PHOTO_WIDTH = 480;

async function shrinkForTelegram(photo: Buffer): Promise<Buffer> {
  try {
    return await sharp(photo)
      .resize({ width: TELEGRAM_PHOTO_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    // Formatni tanib bo'lmasa — asl faylni yuboramiz, xato bermaymiz
    return photo;
  }
}

/**
 * Telegram Bot API adapteri.
 *
 * Ishga tushirish uchun ikkita qiymat kerak:
 *   TELEGRAM_BOT_TOKEN — @BotFather dan olinadi
 *   TELEGRAM_CHAT_ID   — xabar keladigan chat (shaxsiy yoki guruh)
 *
 * Xabar yuborilmasa ilova ishdan chiqmaydi: ariza baribir bazada saqlangan,
 * shuning uchun xatolik faqat logga yoziladi va natijada `sent: false`
 * qaytariladi.
 */
@Injectable()
export class BotTelegramProvider implements TelegramProvider {
  readonly name = 'telegram-bot';
  readonly isReal = true;
  private readonly logger = new Logger('Telegram');

  constructor(@Inject(ENV) private readonly env: Env) {}

  async send(text: string): Promise<TelegramSendResult> {
    const token = this.env.TELEGRAM_BOT_TOKEN;
    const chatId = this.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return { sent: false, reason: 'Token yoki chat ID yo‘q', provider: this.name };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        // Token logga tushmasin
        this.logger.error(`Telegram javob bermadi (${res.status}): ${body.slice(0, 200)}`);
        return { sent: false, reason: `HTTP ${res.status}`, provider: this.name };
      }

      return { sent: true, provider: this.name };
    } catch (e) {
      this.logger.error(`Telegram xatosi: ${e instanceof Error ? e.message : 'noma’lum'}`);
      return { sent: false, reason: 'Tarmoq xatosi', provider: this.name };
    }
  }

  async sendPhoto(photo: Buffer, filename: string, caption: string): Promise<TelegramSendResult> {
    const token = this.env.TELEGRAM_BOT_TOKEN;
    const chatId = this.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return { sent: false, reason: 'Token yoki chat ID yo‘q', provider: this.name };
    }

    /*
     * Telegram caption'ni 1024 belgigacha qabul qiladi — bundan uzunini
     * jimgina kesib tashlaydi. Ariza ma'lumotlari bundan uzun bo'lishi
     * mumkin, shuning uchun caption qisqartiriladi va to'liq matn alohida
     * xabar sifatida ham yuboriladi (pastda).
     */
    const shortCaption = caption.length > 1024 ? caption.slice(0, 1010) + '…' : caption;

    try {
      const smallPhoto = await shrinkForTelegram(photo);

      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('caption', shortCaption);
      form.append('parse_mode', 'HTML');
      form.append('photo', new Blob([new Uint8Array(smallPhoto)]), filename);

      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Telegram sendPhoto javob bermadi (${res.status}): ${body.slice(0, 200)}`);
        return { sent: false, reason: `HTTP ${res.status}`, provider: this.name };
      }

      if (caption.length > 1024) {
        await this.send(caption);
      }

      return { sent: true, provider: this.name };
    } catch (e) {
      this.logger.error(`Telegram sendPhoto xatosi: ${e instanceof Error ? e.message : 'noma’lum'}`);
      return { sent: false, reason: 'Tarmoq xatosi', provider: this.name };
    }
  }
}
