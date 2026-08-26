import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_PROVIDERS_TOKEN } from './sms.tokens';
import type { SendSmsResult, SmsProviderAdapter } from './sms-provider.interface';

/**
 * SMS yuborishning yagona kirish nuqtasi.
 *
 * Qaysi adapter ishlashini `SMS_PROVIDER` hal qiladi. Provayder `NONE`
 * bo'lsa (yoki tanlangan provayderning kalitlari yo'q bo'lsa) xizmat
 * "sozlanmagan" holatda qoladi: server baribir ko'tariladi, chaqiruvchi
 * kod esa `isConfigured()` orqali buni oldindan biladi va demo rejimiga
 * o'tadi. Bu yerda hech qachon jimgina "yuborildi" deb qaytarilmaydi.
 */
@Injectable()
export class SmsService implements OnModuleInit {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(SMS_PROVIDERS_TOKEN) private readonly providers: SmsProviderAdapter[],
  ) {}

  onModuleInit(): void {
    const selected = this.config.get<string>('SMS_PROVIDER') ?? 'NONE';

    if (selected === 'NONE') {
      this.logger.warn('SMS_PROVIDER=NONE — telefon tasdiqlash demo rejimida ishlaydi');
      return;
    }

    const adapter = this.findAdapter();

    if (!adapter) {
      this.logger.error(
        `SMS_PROVIDER=${selected}, lekin bunday adapter yo‘q. SMS yuborilmaydi.`,
      );
      return;
    }

    if (!adapter.isConfigured()) {
      this.logger.error(
        `SMS_PROVIDER=${selected}, lekin kalitlari to‘liq emas (.env). SMS yuborilmaydi.`,
      );
      return;
    }

    this.logger.log(`SMS provayderi: ${selected}`);
  }

  isConfigured(): boolean {
    const adapter = this.findAdapter();
    return Boolean(adapter?.isConfigured());
  }

  /**
   * Xato bo'lsa `AppError` otiladi — chaqiruvchi uni ushlab, foydalanuvchiga
   * ko'rsatadi. Jimgina yutilmaydi.
   */
  async send(phone: string, text: string): Promise<SendSmsResult> {
    const adapter = this.findAdapter();

    if (!adapter?.isConfigured()) {
      // Bu holatga tushmaslik uchun chaqiruvchi avval `isConfigured()` ni
      // tekshiradi; baribir tushsa — bu dasturchi xatosi, yashirmaymiz.
      throw new Error('SMS provayderi sozlanmagan');
    }

    return adapter.send({ phone, text });
  }

  private findAdapter(): SmsProviderAdapter | undefined {
    const selected = this.config.get<string>('SMS_PROVIDER') ?? 'NONE';
    if (selected === 'NONE') return undefined;

    return this.providers.find((p) => p.name === selected);
  }
}
