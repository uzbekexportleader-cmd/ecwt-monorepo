import { BadRequestException, Injectable } from '@nestjs/common';
import type { JourneyDto, JourneyStep, SalesMode } from '@ecwt/types';
import type { MahallaVisitInput } from '@ecwt/validation';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Hunarmand yo'li (tunnel).
 *
 * Foydalanuvchi ro'yxatdan o'tgach kabinetga tushmaydi — mahsuloti
 * xalqaro savdoga chiqquncha qadamlardan birma-bir o'tadi.
 *
 * MUHIM: qadam ALOHIDA saqlanmaydi, mavjud ma'lumotdan hisoblanadi
 * (anketa tugadimi, ariza topshirildimi, to'lov tasdiqlandimi...).
 * Sabab: ikki joyda saqlangan holat vaqt o'tib bir-biridan farq qiladi
 * va odam "qadamda turibman, lekin ish allaqachon bajarilgan" holatiga
 * tushib qoladi. Bitta manba — ma'lumotning o'zi.
 */

/** Qadamlarning ko'rsatiladigan tartibi */
const ORDER: JourneyStep[] = [
  'ONBOARDING',
  'SUBSIDY_APPLICATION',
  'MAHALLA_VISIT',
  'COMMISSION_DECISION',
  'SUBSIDY_CONFIRMED',
  'SERVICE_PAYMENT',
  'PAYMENT_REVIEW',
  'SALES_MODE',
  'PRODUCT_PREP',
  'EARNINGS_PREVIEW',
  'CONTENT_PREP',
  'LISTING',
  'DONE',
];

/** Ro'yxatdan o'tish 10 qadam — tunnel raqamlari shundan keyin boshlanadi */
const ONBOARDING_STEPS = 10;

type StepInfo = {
  now: string;
  actor: JourneyDto['actor'];
  next: string;
  actionable: boolean;
};

const STEP_TEXT: Record<JourneyStep, StepInfo> = {
  ONBOARDING: {
    now: 'Ro‘yxatdan o‘tish anketasi to‘ldirilmoqda.',
    actor: 'ARTISAN',
    next: 'Anketani oxirigacha to‘ldiring.',
    actionable: true,
  },
  SUBSIDY_APPLICATION: {
    now: 'Subsidiya arizasi topshirilmagan.',
    actor: 'ARTISAN',
    next: 'Ma’lumotlaringiz tayyor — online-mahalla.uz ga o‘tib arizani topshiring va ariza raqamini kiriting.',
    actionable: true,
  },
  MAHALLA_VISIT: {
    now: 'Arizangiz Mahalla 7-ligiga yuborildi.',
    actor: 'ARTISAN',
    next: 'Mahallangizga borib Hokim yordamchisi bilan uchrashing, arizangiz kelib tushganini tekshiring va uning telefon raqamini kiriting.',
    actionable: true,
  },
  COMMISSION_DECISION: {
    now: 'Mahalla 7-ligi arizangizni ko‘rib chiqmoqda.',
    actor: 'MAHALLA',
    next: 'Qaror chiqqach sizga xabar beramiz. Mutaxassisimiz Hokim yordamchisi bilan ham bog‘lanadi.',
    actionable: false,
  },
  SUBSIDY_CONFIRMED: {
    now: 'Subsidiyangiz tasdiqlandi.',
    actor: 'ECWT',
    next: 'Mablag‘ hisobingizga tushishi tasdiqlangach keyingi qadam ochiladi.',
    actionable: false,
  },
  SERVICE_PAYMENT: {
    now: 'ECWT xizmat haqi to‘lanmagan.',
    actor: 'ARTISAN',
    next: 'Rekvizitlar bo‘yicha o‘tkazmani bajaring va chekni yuklang.',
    actionable: true,
  },
  PAYMENT_REVIEW: {
    now: 'To‘lov hujjatingiz tekshirilmoqda.',
    actor: 'ECWT',
    next: 'Tasdiqlangach mahsulotni tayyorlashni boshlaymiz.',
    actionable: false,
  },
  SALES_MODE: {
    now: 'To‘lovingiz tasdiqlandi.',
    actor: 'ARTISAN',
    next: 'Mahsulotingizni O‘zbekistondan turib sotasizmi yoki AQSH omboriga jo‘natasizmi — tanlang.',
    actionable: true,
  },
  PRODUCT_PREP: {
    now: 'Mahsulot ma’lumotlari to‘ldirilmoqda.',
    actor: 'ARTISAN',
    next: 'Mahsulot, narx, o‘lcham va qadoqlash bo‘yicha ma’lumotlarni to‘ldiring.',
    actionable: true,
  },
  EARNINGS_PREVIEW: {
    now: 'Mahsulotingiz bo‘yicha hisob-kitob tayyor.',
    actor: 'ARTISAN',
    next: 'Xarajatlar va taxminiy tushumingizni ko‘rib chiqing.',
    actionable: true,
  },
  CONTENT_PREP: {
    now: 'Foto, video va xalqaro e’lon tayyorlanmoqda.',
    actor: 'ECWT',
    next: 'Tayyor foto/videongizni yuklang yoki ECWT tayyorlashini tanlang.',
    actionable: true,
  },
  LISTING: {
    now: 'Mahsulotingiz savdo maydonchasiga chiqarilmoqda.',
    actor: 'ECWT',
    next: 'Joylangach e’lon havolasi shu yerda paydo bo‘ladi.',
    actionable: false,
  },
  DONE: {
    now: 'Mahsulotingiz xalqaro savdoda.',
    actor: 'ARTISAN',
    next: 'Shaxsiy kabinetingizdan mahsulotlar, buyurtmalar va daromadni boshqaring.',
    actionable: true,
  },
};

@Injectable()
export class JourneyService {
  constructor(private readonly prisma: PrismaService) {}

  async current(userId: string): Promise<JourneyDto> {
    const [profile, subsidy, payment, products] = await Promise.all([
      this.prisma.artisanProfile.findUnique({
        where: { userId },
        select: {
          onboardingStage: true,
          paymentMethod: true,
          salesMode: true,
          earningsSeenAt: true,
        },
      }),
      this.prisma.externalSubsidyApplication.findFirst({
        where: { userId, status: { not: 'CANCELLED' } },
        orderBy: { preparedAt: 'desc' },
      }),
      this.prisma.servicePayment.findUnique({ where: { userId } }),
      this.prisma.product.findMany({
        where: { userId },
        select: {
          status: true,
          titleEn: true,
          descriptionEn: true,
          contentByEcwt: true,
          listings: { select: { status: true } },
        },
      }),
    ]);

    /*
     * "O'zi to'layman" — subsidiyaga umuman aralashmaydi: 11–14
     * qadamlar tushib qoladi va odam to'g'ridan-to'g'ri to'lovga keladi.
     */
    const selfPaid = profile?.paymentMethod === 'SELF';
    const rejectionReason =
      subsidy?.status === 'REJECTED' ? (subsidy.note ?? 'Sabab ko‘rsatilmagan') : null;

    const step = this.resolve({
      onboardingDone: profile?.onboardingStage === 'DONE',
      selfPaid,
      subsidySubmitted: Boolean(subsidy?.externalNumber),
      mahallaVisited: Boolean(subsidy?.hokimAssistantPhone),
      subsidyRejected: subsidy?.status === 'REJECTED',
      paymentStatus: payment?.status ?? 'AWAITING_SUBSIDY',
      salesModeChosen: Boolean(profile?.salesMode),
      hasProduct: products.length > 0,
      earningsSeen: Boolean(profile?.earningsSeenAt),
      hasReadyProduct: products.some((p) => p.status === 'READY' || p.status === 'PUBLISHED'),
      /*
       * Kamida bitta tayyor mahsulotning inglizcha matni to'liq bo'lsa,
       * 20-qadam bajarilgan hisoblanadi.
       */
      contentReady: products.some(
        (p) =>
          (p.status === 'READY' || p.status === 'PUBLISHED') &&
          Boolean(p.titleEn) &&
          Boolean(p.descriptionEn),
      ),
      contentByEcwt: products.some((p) => p.contentByEcwt),
      hasListedProduct: products.some((p) => p.listings.some((l) => l.status === 'LISTED')),
    });

    const text = STEP_TEXT[step];
    const visible = this.visibleOrder(selfPaid);

    /*
     * 20-qadamda matnni ECWT tayyorlashi tanlangan bo'lsa, navbat
     * hunarmandda emas — ekranda tugma ko'rsatilmaydi, "kutilmoqda"
     * belgisi turadi.
     */
    const waitingForEcwtContent =
      step === 'CONTENT_PREP' &&
      products.some((p) => p.contentByEcwt && !(p.titleEn && p.descriptionEn));

    return {
      step,
      // Ro'yxatdan o'tish 10 qadam — tunnel raqamlari 11 dan boshlanadi
      index: step === 'ONBOARDING' ? 1 : ONBOARDING_STEPS + visible.indexOf(step) + 1,
      total: ONBOARDING_STEPS + visible.length,
      now: text.now,
      actor: waitingForEcwtContent ? 'ECWT' : text.actor,
      next: rejectionReason
        ? 'Xohlasangiz, xizmat haqini o‘zingiz to‘lab ECWT bilan ishlashni davom ettirishingiz mumkin.'
        : waitingForEcwtContent
          ? 'Mutaxassisimiz mahsulotingiz uchun inglizcha e’lon matnini tayyorlamoqda. Tayyor bo‘lgach xabar beramiz.'
          : text.next,
      actionable: rejectionReason ? true : waitingForEcwtContent ? false : text.actionable,
      rejectionReason,
      selfPaid,
      cabinetUnlocked: step === 'DONE',
    };
  }

  /**
   * 12-qadam: Hokim yordamchisi ma'lumotlarini saqlaydi.
   *
   * Yozuv subsidiya arizasiga biriktiriladi — ariza bo'lmasa bu qadam
   * ham bo'lmaydi.
   */
  async saveMahallaVisit(userId: string, input: MahallaVisitInput): Promise<JourneyDto> {
    const subsidy = await this.prisma.externalSubsidyApplication.findFirst({
      where: { userId, status: { not: 'CANCELLED' } },
      orderBy: { preparedAt: 'desc' },
    });
    if (!subsidy) throw new BadRequestException('Avval subsidiya arizasini topshiring');

    await this.prisma.externalSubsidyApplication.update({
      where: { id: subsidy.id },
      data: {
        hokimAssistantName: input.assistantName,
        hokimAssistantPhone: input.assistantPhone,
        mahallaVisitedAt: input.visitedAt ? new Date(input.visitedAt) : new Date(),
        mahallaNote: input.note,
      },
    });

    return this.current(userId);
  }

  /**
   * 17-qadam: savdo usuli.
   *
   * BIR MARTA tanlanadi: keyingi logistika, qadoqlash va narx hisobi
   * shu tanlovga bog'liq, o'rtada almashtirilsa hisob-kitob buziladi.
   * O'zgartirish kerak bo'lsa — operator orqali.
   */
  async chooseSalesMode(userId: string, mode: SalesMode): Promise<JourneyDto> {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      select: { salesMode: true },
    });
    if (profile?.salesMode) {
      throw new BadRequestException('Savdo usuli allaqachon tanlangan');
    }

    await this.prisma.artisanProfile.update({ where: { userId }, data: { salesMode: mode } });
    return this.current(userId);
  }

  /**
   * 19-qadam: hunarmand hisob-kitobni ko'rib, davom etishni tasdiqladi.
   *
   * Qayta bosilsa vaqt yangilanmaydi — birinchi ko'rgan payt qoladi.
   */
  async markEarningsSeen(userId: string): Promise<JourneyDto> {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      select: { earningsSeenAt: true },
    });
    if (!profile?.earningsSeenAt) {
      await this.prisma.artisanProfile.update({
        where: { userId },
        data: { earningsSeenAt: new Date() },
      });
    }
    return this.current(userId);
  }

  /**
   * 20-qadam: xalqaro e'lon matni.
   *
   * Ikki yo'l: hunarmand o'zi yozadi yoki ECWT tayyorlashini so'raydi.
   * Ikkinchisida matn bo'sh qoladi va qadam kutish holatiga o'tadi —
   * biz uni o'zimiz "tayyor" deb belgilamaymiz.
   */
  async saveContent(
    userId: string,
    input: { productId: string; titleEn?: string; descriptionEn?: string; byEcwt?: boolean },
  ): Promise<JourneyDto> {
    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, userId },
      select: { id: true },
    });
    if (!product) throw new BadRequestException('Mahsulot topilmadi');

    await this.prisma.product.update({
      where: { id: product.id },
      data: input.byEcwt
        ? { contentByEcwt: true }
        : {
            titleEn: input.titleEn?.trim() || null,
            descriptionEn: input.descriptionEn?.trim() || null,
            contentByEcwt: false,
          },
    });

    return this.current(userId);
  }

  /** "O'zi to'layman" yo'lida subsidiya qadamlari ko'rsatilmaydi */
  private visibleOrder(selfPaid: boolean): JourneyStep[] {
    const subsidyOnly: JourneyStep[] = [
      'SUBSIDY_APPLICATION',
      'MAHALLA_VISIT',
      'COMMISSION_DECISION',
      'SUBSIDY_CONFIRMED',
    ];
    return ORDER.filter(
      (s) => s !== 'ONBOARDING' && !(selfPaid && subsidyOnly.includes(s)),
    );
  }

  private resolve(f: {
    onboardingDone: boolean;
    selfPaid: boolean;
    subsidySubmitted: boolean;
    mahallaVisited: boolean;
    subsidyRejected: boolean;
    paymentStatus: string;
    salesModeChosen: boolean;
    hasProduct: boolean;
    earningsSeen: boolean;
    hasReadyProduct: boolean;
    contentReady: boolean;
    contentByEcwt: boolean;
    hasListedProduct: boolean;
  }): JourneyStep {
    if (!f.onboardingDone) return 'ONBOARDING';

    // To'lov tasdiqlangach subsidiya qadamlariga qaytmaymiz
    if (f.paymentStatus !== 'CONFIRMED') {
      if (!f.selfPaid && !f.subsidyRejected) {
        if (!f.subsidySubmitted) return 'SUBSIDY_APPLICATION';
        if (!f.mahallaVisited) return 'MAHALLA_VISIT';
        // Subsidiya kelgani ECWT tomonidan belgilanmaguncha kutiladi
        if (f.paymentStatus === 'AWAITING_SUBSIDY') return 'COMMISSION_DECISION';
      }
      return f.paymentStatus === 'PROOF_SUBMITTED' ? 'PAYMENT_REVIEW' : 'SERVICE_PAYMENT';
    }

    if (!f.salesModeChosen) return 'SALES_MODE';
    if (!f.hasProduct) return 'PRODUCT_PREP';
    /*
     * Hisob-kitob mahsulot yaratilishi bilan ko'rsatiladi, TAYYOR
     * bo'lishini kutmaydi: hunarmand narxni aynan shu hisobga qarab
     * qo'yadi. Tayyor bo'lgandan keyin ko'rsatilsa, kech bo'lardi.
     */
    if (!f.earningsSeen) return 'EARNINGS_PREVIEW';
    if (!f.hasReadyProduct) return 'PRODUCT_PREP';
    /*
     * Xalqaro e'lon inglizcha bo'lishi shart. Matn tayyor bo'lmaguncha
     * mahsulotni maydonchaga chiqarmaymiz — o'zbekcha e'lon xaridorga
     * tushunarsiz va maydoncha uni rad etishi mumkin.
     */
    if (!f.contentReady) return 'CONTENT_PREP';
    if (!f.hasListedProduct) return 'LISTING';
    return 'DONE';
  }
}
