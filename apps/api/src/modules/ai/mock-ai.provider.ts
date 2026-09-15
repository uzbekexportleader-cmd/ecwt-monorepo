import { Injectable } from '@nestjs/common';
import type { AiContext, AiProvider } from './ai.provider';

/**
 * Mock AI: LLM chaqirilmaydi, javoblar foydalanuvchining haqiqiy profil
 * holatidan quriladi. Shu sababli javoblar to'qib chiqarilmaydi —
 * ular bazadagi ma'lumotga tayanadi.
 */
@Injectable()
export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  readonly isReal = false;

  async ask(message: string, ctx: AiContext): Promise<string> {
    const q = message.toLowerCase();
    const disclaimer =
      '\n\nEslatma: men faqat ma’lumot beraman. Yakuniy qarorni vakolatli organ qabul qiladi.';

    if (match(q, ['profil', 'foiz', 'to‘ldir', 'toldir'])) {
      const missing = ctx.missingProfileItems ?? [];
      if (!missing.length) {
        return `Profilingiz ${ctx.profileCompletion ?? 0}% to‘ldirilgan va asosiy bo‘limlar tayyor.${disclaimer}`;
      }
      return (
        `Profilingiz ${ctx.profileCompletion ?? 0}% to‘ldirilgan.\n` +
        `Yetishmayotgan bo‘limlar:\n${missing.map((m) => `• ${m}`).join('\n')}\n\n` +
        `"Profil" bo‘limiga kirib shularni to‘ldirsangiz, sizga mos dasturlar soni ortadi.${disclaimer}`
      );
    }

    if (match(q, ['subsidiya', 'yordam', 'dastur', 'mos'])) {
      const list = ctx.eligibleSubsidies ?? [];
      if (!list.length) {
        return (
          'Hozircha profilingiz bo‘yicha to‘liq mos dastur topilmadi.\n' +
          'Odatda buning sababi: tadbirkorlik holati, uyushma a’zoligi yoki bank rekviziti kiritilmagan bo‘ladi.\n' +
          '"Imkoniyatlar" bo‘limida har bir dastur uchun qaysi talab yetishmayotgani ko‘rsatilgan.' +
          disclaimer
        );
      }
      return (
        `Sizga mos dasturlar:\n${list.map((s) => `• ${s}`).join('\n')}\n\n` +
        `"Imkoniyatlar" bo‘limidan tanlab, "Ariza berish" tugmasini bosing.${disclaimer}`
      );
    }

    if (match(q, ['hujjat', 'yukla', 'fayl', 'pdf'])) {
      return (
        'Hujjatlarni "Profil → Hujjatlarim" bo‘limidan yuklaysiz.\n' +
        '• Format: PDF, JPG yoki PNG\n' +
        '• Hajmi: 10 MB gacha\n' +
        '• Har bir hujjat turini alohida tanlang (pasport, a’zolik guvohnomasi, shartnoma va h.k.)\n\n' +
        'Ariza berayotganda yuklangan hujjatlar avtomatik taklif qilinadi — qayta yuklash shart emas.' +
        disclaimer
      );
    }

    if (match(q, ['status', 'ariza', 'qachon', 'holat'])) {
      const apps = ctx.openApplications ?? [];
      if (!apps.length) {
        return 'Hozircha faol arizangiz yo‘q. "Imkoniyatlar" bo‘limidan mos dasturni tanlab ariza berishingiz mumkin.' + disclaimer;
      }
      return (
        `Faol arizalaringiz:\n${apps.map((a) => `• ${a.number} — ${a.subsidy}: ${a.status}`).join('\n')}\n\n` +
        `Har bir arizani ochsangiz, bosqichma-bosqich timeline ko‘rinadi.${disclaimer}`
      );
    }

    if (match(q, ['marketplace', 'amazon', 'ebay', 'eksport', 'sotuv', 'mahsulot'])) {
      return (
        'Mahsulotni xalqaro platformalarga chiqarish uchun:\n' +
        '1. "Mahsulotlar" bo‘limida mahsulot qo‘shing (foto, nomi, narxi, o‘lchami majburiy)\n' +
        '2. Marketplace tanlang (Amazon, eBay, Walmart va h.k.)\n' +
        '3. "Chiqarish" tugmasini bosing\n\n' +
        'Diqqat: hozircha marketplace integratsiyalari demo rejimida — haqiqiy e’lon joylanmaydi. ' +
        'Real ulanish uchun platforma hisoblari va API kalitlari kerak.'
      );
    }

    if (match(q, ['rad', 'nega', 'tuzat', 'qayta'])) {
      return (
        'Ariza rad etilsa yoki tuzatishga qaytarilsa, ariza sahifasida aniq sabab yoziladi.\n' +
        '• "Tuzatish" tugmasi kerakli bo‘limga olib boradi\n' +
        '• Tuzatgandan keyin "Qayta yuborish" tugmasi faollashadi\n' +
        '• Qayta yuborishda avvalgi ma’lumotlar saqlanib qoladi' +
        disclaimer
      );
    }

    return (
      'Savolingizni aniqroq yozsangiz yordam beraman. Masalan:\n' +
      '• "Profilimni qanday to‘ldiraman?"\n' +
      '• "Menga qaysi subsidiya mos?"\n' +
      '• "Hujjatni qayerga yuklayman?"\n' +
      '• "Arizam qaysi bosqichda?"\n' +
      '• "Mahsulotimni Amazon‘ga qanday chiqaraman?"' +
      disclaimer
    );
  }
}

function match(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(k));
}
