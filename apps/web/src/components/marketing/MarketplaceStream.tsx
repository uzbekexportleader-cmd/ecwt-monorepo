import { MarketplaceMark, type MarketMarkId } from './MarketplaceMark';

/**
 * Marketplace oqimi.
 *
 * Ilgari bu yerda globus aylanardi va yorliqlar uning atrofida uchardi.
 * Endi fonda orbitadan olingan video turibdi, va uning ustiga yana bitta
 * aylanuvchi shar qo'yish ortiqcha bo'lardi. Shuning uchun harakat
 * boshqa yo'nalishga o'tkazildi: yorliqlar aylanmaydi, OQADI.
 *
 * Ikkita ustun bir-biriga QARAMA-QARSHI yo'nalishda suriladi. Bu ataylab:
 * ikkalasi bir tomonga ketsa, ko'z buni oddiy sirpanish deb o'qiydi va
 * harakat sezilmay qoladi; qarama-qarshi bo'lsa esa ular bir-birini
 * ta'kidlaydi.
 *
 * Uzluksizlik qanday ishlaydi: har ustunda ro'yxat IKKI MARTA chiziladi
 * va lenta o'z bo'yining aynan yarmiga suriladi. Ikkinchi nusxa
 * birinchisining o'rniga aniq tushadi, shuning uchun sikl tutashgan
 * joyda uzilish ko'rinmaydi.
 */

/**
 * Ustunlar bir-birini TAKRORLAMAYDI.
 *
 * Bir paytlar ikkalasida ham bir xil to'plam bor edi, faqat tartibi
 * surilgan. Lekin lenta sikl bo'lgani uchun surilgan tartib — bu o'sha
 * tartibning o'zi, boshqa fazada: ustunlar vaqti-vaqti bilan
 * tekislanib qolar va yonma-yon bir xil yorliq chiqar edi. Endi
 * to'plamlar kesishmaydi.
 *
 * Ro'yxatda ikki xil yozuv bor: hozir ishlayotganlari (`Marketplace`
 * enum'ida, ya'ni bazada ham bor) va rejadagilari (`PlannedMarket`).
 * Ikkinchisi ataylab bazadagi enum'ga qo'shilmagan — sababi
 * `MarketplaceMark` faylida yozilgan.
 */
const LEFT: readonly MarketMarkId[] = [
  'AMAZON_US',
  'EBAY',
  'SHOPIFY',
  'WAYFAIR',
  'TEMU',
  'HOUZZ',
];

/** O'ng ustun — qolganlari */
const RIGHT: readonly MarketMarkId[] = [
  'WALMART',
  'ETSY',
  'TIKTOK_SHOP',
  'FAIRE',
  'TARGET_PLUS',
  'MICHAELS',
];

function Card({ id }: { id: MarketMarkId }) {
  return (
    // Balandlik ataylab shunday: oltita karta + oraliqlar ko'rinadigan
    // oynadan UZUN bo'lishi kerak, aks holda bitta ustunda bir yorliq
    // ikki marta ko'rinib qoladi.
    //   telefonda  6x(132+16)+16 = 904 > 416
    //   sm dan     6x(150+16)+16 = 1012 > 480
    //
    // Fon — video. Shaffof karta unda yo'qoladi, shuning uchun o'zining
    // quyuq asosi bor.
    <div className="flex h-[132px] items-center justify-center rounded-2xl border border-white/[0.12] bg-[#050b1a]/80 px-5 shadow-[0_8px_28px_rgba(2,5,14,0.5)] backdrop-blur-md sm:h-[150px]">
      <MarketplaceMark id={id} />
    </div>
  );
}

function Column({ items, up }: { items: readonly MarketMarkId[]; up: boolean }) {
  return (
    <div className={up ? 'animate-stream-up' : 'animate-stream-down'}>
      {/* Ikki nusxa — uzluksiz sikl uchun. Ikkinchisi ekranda takror
          bo'lgani uchun o'quvchi dasturdan yashiriladi. */}
      {[0, 1].map((copy) => (
        <div key={copy} className="grid gap-4 pb-4" aria-hidden={copy === 1 || undefined}>
          {items.map((id) => (
            <Card key={id} id={id} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MarketplaceStream({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full max-w-[30rem]" role="img" aria-label={label}>
      {/* Chekkalarni yumshatuvchi niqob: kartalar to'satdan kesilmaydi,
          balki yuqorida va pastda erib ketadi. Shundagina bu "ro'yxat"
          emas, "oqim" bo'lib o'qiladi. */}
      <div
        className="h-[26rem] overflow-hidden sm:h-[30rem]"
        style={{
          maskImage:
            'linear-gradient(180deg, transparent 0%, #000 13%, #000 87%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(180deg, transparent 0%, #000 13%, #000 87%, transparent 100%)',
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Column items={LEFT} up />
          {/* O'ng ustun yarim karta pastdan boshlanadi: aks holda ikkala
              ustun bir chiziqda turadi va to'r qat'iy ko'rinadi. */}
          <div className="-mt-12">
            <Column items={RIGHT} up={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
