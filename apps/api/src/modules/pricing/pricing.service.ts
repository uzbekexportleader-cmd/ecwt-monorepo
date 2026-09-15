import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import {
  BARCODE_PRICE_SOURCE,
  BARCODE_PRICE_USD,
  COVERED_SHIPPING_GRAMS,
  EXTRA_SHIPPING_STEP_GRAMS,
  EXTRA_SHIPPING_STEP_UZS,
  FREE_STORAGE_YEARS,
  MARKETPLACE_COMMISSION_PERCENT,
  SELF_PAY_COMMISSION_PERCENT,
  SELF_PAY_SERVICE_FEE_UZS,
  SUBSIDY_COMMISSION_PERCENT,
} from './pricing.constants';

/**
 * Mahsulot bo'yicha xarajat va taxminiy tushum hisobi (19-qadam).
 *
 * MUHIM: bu yerda TAXMIN qilinmaydi. Ma'lum bo'lmagan narsa (masalan
 * dollar kursi yoki og'irligi kiritilmagan mahsulotning jo'natma haqi)
 * son sifatida ko'rsatilmaydi — u `unknown` qatoriga tushadi va
 * ekranda "hali ma'lum emas" deb yoziladi.
 *
 * Sabab: hunarmand bu raqamlarga qarab narx qo'yadi. To'qib yozilgan
 * bitta qiymat uni zarar bilan sotishga olib kelishi mumkin.
 */

export type PricingLine = {
  key: string;
  label: string;
  /** null — qiymat hali ma'lum emas */
  amountUzs: number | null;
  note?: string;
};

export type PricingQuoteDto = {
  productTitle: string;
  priceUzs: number | null;
  salesMode: string | null;
  paymentMethod: string | null;
  lines: PricingLine[];
  /** Xarajatlar ayirilgandan keyingi taxminiy tushum */
  netUzs: number | null;
  /** Hisobga kirmagan, lekin bilish kerak bo'lgan narsalar */
  unknowns: string[];
};

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(userId: string, productId: string): Promise<PricingQuoteDto> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, userId },
      select: { title: true, price: true, weightGram: true },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      select: { paymentMethod: true, salesMode: true },
    });

    const subsidised = profile?.paymentMethod !== 'SELF';
    const toUsWarehouse = profile?.salesMode === 'FBA';

    const lines: PricingLine[] = [];
    const unknowns: string[] = [];

    /* ---------------------------- ECWT haqi ---------------------------- */
    if (subsidised) {
      lines.push({
        key: 'ecwt',
        label: 'ECWT xizmat haqi',
        amountUzs: 0,
        note: `Subsidiya orqali to‘langan — sotuvdan ${SUBSIDY_COMMISSION_PERCENT}% olinadi`,
      });
    } else {
      lines.push({
        key: 'ecwt',
        label: 'ECWT xizmat haqi',
        amountUzs: SELF_PAY_SERVICE_FEE_UZS,
        note: `Bir martalik. Muqobil variant — sotuvdan ${SELF_PAY_COMMISSION_PERCENT}%`,
      });
    }

    /* --------------------------- Jo'natish ----------------------------- */
    if (!toUsWarehouse) {
      lines.push({
        key: 'shipping',
        label: 'AQSH omboriga jo‘natish',
        amountUzs: 0,
        note: 'O‘zbekistondan turib sotasiz — oldindan jo‘natish yo‘q',
      });
    } else if (product.weightGram === null) {
      lines.push({
        key: 'shipping',
        label: 'AQSH omboriga jo‘natish',
        amountUzs: null,
        note: 'Mahsulot og‘irligi kiritilmagan',
      });
      unknowns.push('Og‘irlikni kiritsangiz jo‘natish haqi hisoblanadi');
    } else if (subsidised) {
      const over = Math.max(0, product.weightGram - COVERED_SHIPPING_GRAMS);
      const steps = Math.ceil(over / EXTRA_SHIPPING_STEP_GRAMS);
      lines.push({
        key: 'shipping',
        label: 'AQSH omboriga jo‘natish',
        amountUzs: steps * EXTRA_SHIPPING_STEP_UZS,
        note:
          over === 0
            ? `${COVERED_SHIPPING_GRAMS / 1000} kg gacha ECWT qoplaydi, omborda ${FREE_STORAGE_YEARS} yil saqlash tekin`
            : `${COVERED_SHIPPING_GRAMS / 1000} kg dan ortig‘i uchun: har ${EXTRA_SHIPPING_STEP_GRAMS} g — ${EXTRA_SHIPPING_STEP_UZS.toLocaleString('ru-RU')} so‘m`,
      });
    } else {
      lines.push({
        key: 'shipping',
        label: 'AQSH omboriga jo‘natish',
        amountUzs: null,
        note: 'O‘zingiz to‘laysiz — narx jo‘natma og‘irligi va kuryerga bog‘liq',
      });
      unknowns.push('Jo‘natish haqi kuryer tarifiga qarab belgilanadi');
    }

    /* --------------------------- Shtrix-kod ---------------------------- */
    lines.push({
      key: 'barcode',
      label: 'Xalqaro shtrix-kod (GTIN)',
      amountUzs: null,
      note: `${BARCODE_PRICE_USD} dollar (${BARCODE_PRICE_SOURCE}) — hunarmand zimmasida`,
    });
    unknowns.push('Shtrix-kod dollarda: so‘mdagi qiymati kunlik kursga bog‘liq');

    /* ------------------------ Maydoncha komissiyasi -------------------- */
    if (product.price === null) {
      lines.push({
        key: 'marketplace',
        label: `Savdo maydonchasi komissiyasi (${MARKETPLACE_COMMISSION_PERCENT}%)`,
        amountUzs: null,
        note: 'Mahsulot narxi kiritilmagan',
      });
      unknowns.push('Narxni kiritsangiz komissiya va sof tushum hisoblanadi');
    } else {
      lines.push({
        key: 'marketplace',
        label: `Savdo maydonchasi komissiyasi (${MARKETPLACE_COMMISSION_PERCENT}%)`,
        amountUzs: Math.round((product.price * MARKETPLACE_COMMISSION_PERCENT) / 100),
        note: 'Toifaga qarab farq qilishi mumkin',
      });
    }

    /*
     * Sof tushum faqat HAMMA qatori ma'lum bo'lsa hisoblanadi.
     * Bittasi noma'lum bo'lsa — yarim hisobni son qilib ko'rsatish
     * aldash bo'lardi.
     */
    const allKnown = lines.every((l) => l.amountUzs !== null);
    const netUzs =
      allKnown && product.price !== null
        ? product.price - lines.reduce((sum, l) => sum + (l.amountUzs ?? 0), 0)
        : null;

    return {
      productTitle: product.title,
      priceUzs: product.price,
      salesMode: profile?.salesMode ?? null,
      paymentMethod: profile?.paymentMethod ?? null,
      lines,
      netUzs,
      unknowns,
    };
  }
}
