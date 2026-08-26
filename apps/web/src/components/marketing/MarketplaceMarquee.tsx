import { MarketplaceMark, type MarketMarkId } from './MarketplaceMark';
import { PLATFORMS } from './platforms';

/**
 * Marketplace'lar — o'ngdan chapga oqadigan lenta.
 *
 * ── Faqat haqiqiy savdo maydonchalari ───────────────────────────────
 * Ilgari bu yerda yetmishta yorliq bor edi va ularning ko'pchiligi
 * marketplace emasdi: Wix, Shopware, Zen Cart, Squarespace — bular
 * do'kon qurish dvigatellari. Ro'yxat ta'sirli ko'rinardi, lekin
 * sohani biladigan odam buni darrov payqaydi va sahifaga ishonchi
 * pasayadi. Endi lentada faqat mahsulotni rostdan sotish mumkin
 * bo'lgan joylar turadi. Kamroq, lekin haqiqiy.
 *
 * ── Ikki xil yorliq ─────────────────────────────────────────────────
 * Boshida eng tanilganlari turadi — ular `MarketplaceMark` da qo'lda
 * chizilgan: Amazon tabassumi, eBay ning to'rt rangi, Walmart
 * uchqunlari va h.k. Ulardan keyin qolganlari brend rangidagi so'z
 * belgisi sifatida chiziladi — ularning SHAKLI bir xil darajada
 * tanilgan emas, nomi esa yetarli.
 *
 * ── Uzluksizlik ─────────────────────────────────────────────────────
 * Ro'yxat IKKI MARTA chiziladi va lenta o'z enining aynan yarmiga
 * suriladi. Ikkinchi nusxa birinchisining o'rniga aniq tushadi,
 * shuning uchun sikl tutashgan joyda uzilish ko'rinmaydi.
 *
 * ── Logotiplar o'z rangida ──────────────────────────────────────────
 * Bir vaqtlar ular rangsiz (`grayscale`) chizilardi. Lekin brendning
 * kuchi aynan uning rangida: rangsiz Amazon shunchaki so'z, rangli
 * Amazon esa bir qarashda tanib olinadi.
 */

/**
 * Qo'lda chizilgan belgilar — eng tanilganlari, lentaning boshida.
 *
 * Shopify ataylab YO'Q. U marketplace emas, do'kon qurish dvigateli:
 * unda o'z saytingizni qurasiz, lekin tayyor xaridor oqimi yo'q.
 * Lentaning ma'nosi esa "mahsulotingiz qayerda sotiladi" degani.
 */
const MARKS: readonly MarketMarkId[] = [
  'AMAZON_US',
  'EBAY',
  'ETSY',
  'WALMART',
  'TIKTOK_SHOP',
  'POSHMARK',
  'MERCARI',
  'MACYS',
  'BONANZA',
  'ALIBABA',
];

/**
 * Lentadagi jami marketplace soni — sahifadagi raqam shu bilan bir xil.
 *
 * Raqam qo'lda yozilmaydi: aks holda ro'yxat o'zgarganda ular bir-biriga
 * mos kelmay qoladi va sahifa yolg'on gapiradi.
 */
export const MARKETPLACE_COUNT = MARKS.length + PLATFORMS.length;

/**
 * Chekkalarda yorliqlar to'satdan kesilmasin, erib ketsin.
 *
 * Avval so'nish 6% da tugardi — 1440 px ekranda bu atigi 86 px, ya'ni
 * bitta yorliqning yarmi. Natijada chetdagi logotip "erigan" emas,
 * "kesilgan" bo'lib ko'rinardi. Endi so'nish 14% ga cho'zildi: bu
 * eng keng yorliqdan (Facebook Marketplace, 215 px) ham uzunroq,
 * shuning uchun har qanday logotip to'liq eriб ulguradi.
 */
const EDGE_FADE =
  'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 5%, #000 14%, #000 86%, rgba(0,0,0,0.35) 95%, transparent 100%)';

/**
 * Optik balandlikni tenglashtirish.
 *
 * Lentadagi yorliqlar turli shriftda yozilgan: o'lchov bo'yicha eBay
 * 17 px, TikTok Shop 13 px edi — 31% farq. Ko'z aynan HARF balandligini
 * taqqoslaydi, quti balandligini emas (masalan "amazon" ikki qatorli,
 * shuning uchun uning qutisi baland, harfi esa o'rtacha).
 *
 * Shuning uchun har biri o'z o'lchangan shriftiga qarab kattalashtiriladi
 * yoki kichraytiriladi. Nishon — 15 px, ya'ni ro'yxatdagi eng ko'p
 * uchraydigan o'lcham.
 */
const MEASURED_FONT: Partial<Record<MarketMarkId, number>> = {
  AMAZON_US: 15,
  EBAY: 17,
  ETSY: 16,
  WALMART: 14,
  TIKTOK_SHOP: 13,
  POSHMARK: 15,
  MERCARI: 14,
  MACYS: 15,
  BONANZA: 15,
  ALIBABA: 15,
};

const TARGET_FONT = 15;

/**
 * Yorliqning sukut holati.
 *
 * ── Rang QAYTARILDI ─────────────────────────────────────────────────
 * Bir muddat lenta rangsiz turdi va rang faqat kursor tekkanda
 * ochilardi. Amalda bu ishlamadi: lenta to'xtovsiz harakatlanadi,
 * shuning uchun kursor tekkan logotip darrov sirg'alib ketadi va rang
 * ko'rinmay qoladi. Endi rang doim ochiq.
 *
 * Buning o'rniga birinchi muammo — "biri yorqin, biri xira" — boshqa
 * yo'l bilan hal qilindi: ranglar YORUG'LIGI bo'yicha tenglashtiriladi
 * (`platforms.ts` dagi `balance`). Ya'ni rang ham bor, qator ham tekis.
 *
 * Kursor tekkanda esa yorliq to'liq quyulanadi va lenta to'xtaydi —
 * shunda uni o'qish mumkin.
 */
const ITEM = 'shrink-0 opacity-[0.82] transition duration-300 hover:opacity-100';

/**
 * Yorliqlarning kattaligi.
 *
 * `MarketplaceMark` ichidagi o'lchamlar piksellarda yozilgan, shuning
 * uchun ularni matn kattaligi orqali boshqarib bo'lmaydi. `zoom` esa
 * elementning HAQIQIY o'lchamini o'zgartiradi — ya'ni yonidagi
 * bo'shliqlar ham to'g'ri hisoblanadi. `transform: scale` bunday
 * qilmasdi: u faqat ko'rinishni kattalashtirib, joyini eski holda
 * qoldirardi va yorliqlar bir-biriga kirib ketardi.
 */
const ZOOM = 1.35;

/**
 * Bitta nusxada ro'yxat necha marta takrorlanadi.
 *
 * Sikl `-50%` ga suriladi, ya'ni BITTA nusxa ekran kengligidan katta
 * bo'lishi shart. Ro'yxat yigirmata bo'lganda bu o'z-o'zidan bajarilgan
 * edi; o'n bittaga tushgach, keng monitorda lentaning oxiri ko'rinib
 * qolishi mumkin. Ikki marta takrorlash buni yopadi.
 */
const REPEAT = 2;

export function MarketplaceMarquee({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="group w-full overflow-hidden"
      style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
    >
      {/* Kursor lenta ustiga kelganda harakat to'xtaydi.
          Sabab: yurib turgan yorliqni o'qib ham, ustiga bosib ham
          bo'lmaydi — u kursor ostidan sirg'alib ketadi. To'xtash
          lentani "ko'rgazma"dan "ro'yxat"ga aylantiradi. */}
      <div className="animate-marquee flex w-max items-center group-hover:[animation-play-state:paused]">
        {/* Ikki nusxa — uzluksiz sikl uchun. Ikkinchisi ekranda takror
            bo'lgani uchun o'quvchi dasturdan yashiriladi. */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-center gap-12 pr-12 sm:gap-20 sm:pr-20"
            aria-hidden={copy === 1 || undefined}
          >
            {Array.from({ length: REPEAT }, (_, pass) => (
              <div
                key={pass}
                className="flex shrink-0 items-center gap-12 pr-12 sm:gap-20 sm:pr-20"
              >
                {MARKS.map((id) => (
                  <span
                    key={id}
                    className={ITEM}
                    style={{ zoom: ZOOM * (TARGET_FONT / (MEASURED_FONT[id] ?? TARGET_FONT)) }}
                  >
                    <MarketplaceMark id={id} />
                  </span>
                ))}

                {PLATFORMS.map((p) => (
                  <span
                    key={p.name}
                    className={`${ITEM} whitespace-nowrap text-[15px] font-bold tracking-tight`}
                    style={{ color: p.color, zoom: ZOOM }}
                  >
                    {/* Ko'p rangli brend bo'lsa, har harf o'z rangida.
                        Bo'lmasa — oddiy matn. */}
                    {p.letterColors
                      ? [...p.name].map((ch, i) => (
                          <span key={i} style={p.letterColors?.[i] ? { color: p.letterColors[i] } : undefined}>
                            {ch}
                          </span>
                        ))
                      : p.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
