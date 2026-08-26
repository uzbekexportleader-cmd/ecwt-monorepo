import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n';
import { SoundLab } from '@/components/marketing/SoundLab';

/**
 * Ovoz tanlash sahifasi — VAQTINCHALIK.
 *
 * Ovozni so'z bilan tasvirlab bo'lmaydi: "elektron", "futuristik" degan
 * so'zlar har kimda boshqacha tasvir uyg'otadi. Shuning uchun bu yerda
 * variantlarni eshitib solishtirish mumkin.
 *
 * Ro'yxat ikki qismdan iborat. Yuqorida — qirqta BOY ovoz: har birida
 * sub-bass, ko'p ovozli qatlam, havo shovqini va reverb bor. Pastda —
 * avvalgi sodda variantlar; ular faqat solishtirish uchun turibdi.
 *
 * Tanlangandan keyin sahifa ham, `SoundLab` ham o'chiriladi va faqat
 * bitta ovoz bosh sahifaga qo'yiladi.
 */
export default async function SoundPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main
      data-surface="dark"
      className="relative min-h-screen bg-[#03060f] text-white"
    >
      <div className="container-page py-16 sm:py-20">
        <h1 className="text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.75rem]">
          Ovozni tanlang
        </h1>

        <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.65] text-brand-200">
          <strong className="font-semibold text-white">
            Eng yuqoridagi to‘rt guruh — Akustik bas, Katta echo, Ko‘tarilish, Tushish — KATTA
            ISHORALAR.
          </strong>{' '}
          Har biri bir-to‘rt soniya davom etadi: sekin ko‘tariladi, balandligi suriladi va uzoq
          dumi bilan so‘nadi. Ular ustma-ust tushib, katta va o‘zgarib turadigan fazo hosil
          qiladi. Yana bir muhim farq: bu yerda har bir ovozning O‘Z XONASI bor — undan
          oldingi hamma variant bitta xil reverbdan o‘tgan edi.
        </p>

        <p className="mt-3 max-w-[56ch] text-[13.5px] leading-[1.6] text-brand-200/70">
          <strong className="font-semibold text-white">
            Undan keyingi uch guruh — FM, To‘lqin jadvali, Spektr — boshqa MANBADAN chiqadi.
          </strong>{' '}
          Qolganlarining hammasi brauzerning tayyor to‘rtta to‘lqinidan yasalgan; bular esa
          to‘lqinning o‘zini noldan quradi. Filtr bilan bunday tembrga yetib bo‘lmaydi — FM
          sintezining metall va shisha tovushi, to‘lqin jadvalining suzib turadigan spektri
          shundan.
        </p>

        <p className="mt-3 max-w-[56ch] text-[13.5px] leading-[1.6] text-brand-200/70">
          <strong className="font-semibold text-white">
            Undan keyingi to‘rt guruh — Interfeys, Havo va bosim, Kino, Yumshoq — uzluksiz emas.
          </strong>{' '}
          Ular fon emas, javob: sichqoncha har necha piksel yurganda bitta qisqa, toza tovush
          chiqadi va u qatordagi notaga tushiriladi. Shuning uchun harakat shovqinga emas,
          ohangga o‘xshaydi. Qolgan hammasi uzluksiz g‘uvillash edi — sizga to‘g‘ri kelmagani
          shundan bo‘lishi mumkin.
        </p>

        <p className="mt-3 max-w-[56ch] text-[13.5px] leading-[1.6] text-brand-200/70">
          Undan keyingi to‘rt guruh:{' '}
          <strong className="font-semibold text-white">
            Metall va zarba, Begona elektron, Bulut va shamol, Mashina tili
          </strong>
          . Ular butunlay boshqa yo‘l bilan yasalgan: chalinadigan sim, qo‘ng‘iroq, halqa
          modulyatsiyasi, donachalar, formant, ketma-ketlik. Ularning bir qismi umuman
          “g‘uvillash” emas — <strong className="font-semibold text-white">zarba va notalar</strong>,
          ya‘ni tezlik ohangning temposini boshqaradi. Yuqoridagi sakkiz guruh — oldingi ikki
          to‘plam, eng oxirida esa dastlabki sodda variantlar.
        </p>

        <p className="mt-3 max-w-[56ch] text-[13.5px] leading-[1.6] text-brand-200/70">
          Hammasi tezlikka javob beradi.{' '}
          <strong className="font-semibold text-white">Eshitish</strong> qisqa namuna beradi:
          tovush ko‘tarilib, keyin so‘nadi.{' '}
          <strong className="font-semibold text-white">Sinash</strong> esa uni sichqonchaga ulaydi —
          shundan keyin kursorni ekranda yurgizing.
        </p>

        <p className="mt-3 max-w-[52ch] text-[13.5px] leading-[1.6] text-brand-200/70">
          Brauzer ovozni faqat bosgandan keyin chiqaradi, shuning uchun avval biror tugmani bosing.
          Qaysi biri yoqqanini ayting — o‘shani bosh sahifaga qo‘yaman va bu sahifani o‘chiraman.
        </p>

        <div className="mt-10">
          <SoundLab />
        </div>
      </div>
    </main>
  );
}
