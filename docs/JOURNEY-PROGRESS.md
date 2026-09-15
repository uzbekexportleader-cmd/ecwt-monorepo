# Hunarmand yo'li: bajarilgan ishlar va qolgan bosqichlar

Bu hujjat topshiriq bo'yicha bajarilgan ishni qayd etadi. Har bosqichda:
nima ishlaydi, qanday tekshirildi, nima yetishmaydi.

Maqsad: hunarmand bitta ilovada ro'yxatdan o'tishdan pulini olishgacha
boradi va har qadamda **hozir nima bo'lyapti**, **kimning harakati
kutilmoqda**, **o'zi keyin nima qilishi kerak** — shu uchtasini ko'radi.

---

## Bosqich A — yakuniy ekrandan kabinetga (BAJARILDI)

### Muammo
Anketa tugagach foydalanuvchi "Arizangiz qabul qilindi" ekranida to'xtab
qolardi. Ekrandagi ariza raqami foydalanuvchi identifikatoridan yasalardi —
bazada bunday ariza YO'Q edi, ya'ni operator uni topa olmasdi.

### Bajarilgan ish

**Baza (`apps/api/prisma/schema.prisma`)**
- `SellerApplication` modeli: `number` (unikal), `userId` (unikal),
  `status`, `reviewerNote`, `submittedAt`, `decidedAt`.
- `SellerApplicationEvent` — holatlar tarixi.
- `SellerApplicationStatus`: `UNDER_REVIEW`, `MORE_INFO_NEEDED`,
  `APPROVED`, `REJECTED`.

**Backend (`apps/api/src/modules/seller-application/`)**
- Anketa `DONE` bo'lganda ariza avtomatik yaratiladi
  (`artisan-profile.service.ts` ichidan chaqiriladi).
- Yaratish **idempotent**: takror chaqirilsa yangi raqam berilmaydi.
- Raqam formati `ECWT-2026-000001`; raqam to'qnashuvida keyingisi olinadi.
- Mavjud Telegram xabarnomasi **o'zgarmadi** — ariza avval bazaga yoziladi,
  keyin xabar ketadi; xabar yiqilsa ham ariza yo'qolmaydi.
- Endpointlar: `GET /seller-application` (o'zimniki),
  `GET /seller-application/all` (operator), `POST /:id/decision` (operator).
- `canSell` **serverda** hisoblanadi: faqat `APPROVED`. Ilova holatdan o'zi
  xulosa chiqarmaydi.

**Mobil**
- `app/application.tsx` — ariza holati ekrani: holat, raqam, sana, operator
  izohi, "hozir nima bo'lyapti / kim harakat qiladi / siz nima qilasiz",
  holatlar tarixi.
- `app/(setup)/done.tsx` — soxta raqam olib tashlandi, raqam serverdan
  keladi. Uchta amal: **birinchi mahsulotni qo'shish**, **ariza holatini
  ko'rish**, **kabinetga o'tish**. Har biri avval kabinetga o'tadi, keyin
  kerakli ekranni ustiga qo'yadi — orqaga qaytish yo'li saqlanadi.
- `src/services/product-draft.ts` — birinchi mahsulot qoralamasi shu
  qurilmada avtomatik saqlanadi (600 ms tinchlikdan keyin), ilova qayta
  ochilganda tiklanadi, mahsulot serverga saqlangach o'chiriladi.
  Rasm manzillari ataylab saqlanmaydi (galereya URI'si vaqtinchalik).
- Matnlar to'rt tilda: uz, ru, en, kaa (har birida 426 kalit).

### Tekshirildi (13.09.2026)
- Uchidan-uchiga: yangi foydalanuvchi → 9 bosqich anketa → `DONE` →
  `GET /seller-application` → `ECWT-2026-000001`, `UNDER_REVIEW`,
  `canSell: false`, tarixda 1 hodisa.
- Idempotentlik: `DONE` qayta yuborildi — raqam o'zgarmadi.
- Ruxsatlar: `/seller-application` — 200; `/seller-application/all` oddiy
  foydalanuvchi uchun — **403**; token yo'q — **401**.
  (Tekshiruv paytida `@Roles` ishlamayotgani aniqlandi: `RolesGuard`
  ulanmagan edi. Tuzatildi.)
- `tsc --noEmit`: API va mobil — toza. ESLint `--max-warnings=0` — toza.
- Jest: 87 test (82 mavjud + 5 yangi) — o'tdi.

---

## Qo'shimcha — online-mahalla.uz subsidiya arizasi (BAJARILDI)

### Nima qilingani
Hunarmand davlat subsidiyasiga ariza topshirishi uchun ilova butun
ma'lumotni tayyorlab beradi, hunarmand esa saytda faqat tasdiqlaydi.

- `GET /mahalla-subsidy/packet` — profil ma'lumotidan platformaning HAR
  BIR maydoniga tayyor qiymat (Аризачи / Манзил / Реквизитлар qadamlari
  bo'yicha). Yetishmayotgan maydon `null` bo'lib qaytadi va ilovada
  qayerda to'ldirish ko'rsatiladi.
- `POST /mahalla-subsidy/handoff` — saytga o'tish qayd etiladi
  (holat `PREPARED`, ya'ni hali topshirilmagan).
- `POST /mahalla-subsidy/submission` — foydalanuvchi platformadan olgan
  ariza raqami saqlanadi, holat `SUBMITTED` bo'ladi.
- `PATCH /mahalla-subsidy/status` — natijani qayd etish.
- Mobil: `app/subsidy/online-mahalla.tsx` — har bir qiymat bir bosishda
  nusxalanadi, sayt ochiladi, keyin ariza raqami saqlanadi. Kirish nuqtasi
  "Imkoniyatlar" bo'limi tepasida.
- Ro'yxatdan o'tishga `Tashkilot nomi` qo'shildi (faqat YATT/yuridik shaxs
  uchun) — subsidiya arizasida aynan shu nom so'raladi.

### Ataylab QILINMAGAN ish
Ilova foydalanuvchi o'rniga OneID ga kirmaydi va arizani topshirmaydi.
Sabab: parolni saqlash va ommaviy oferta bilan "rozilik" ni bot bosishi —
hujjatni ko'rmagan odamni javobgar qilib qo'yadi. To'liq avtomatlashtirish
faqat platforma operatori bilan rasmiy integratsiya (API + shartnoma)
orqali mumkin.

Summani ham ilova yozmaydi: bu davlat mablag'i miqdori, uni hunarmand
haqiqiy xarajatiga qarab o'zi kiritadi.

### Tekshirildi (14.09.2026)
- Uchidan-uchiga: yangi foydalanuvchi → anketa (shaxs + manzil) →
  `packet` 11 ta maydonni to'g'ri to'ldirdi, `ready: true`.
- YATT qilinganda `missing: ['СТИР']` — ya'ni yetishmayotgan maydon
  to'qib chiqarilmaydi.
- `handoff` takroriy chaqirilganda bir xil yozuv (dublikat yo'q).
- Qisqa ariza raqami — 400; to'g'risi saqlandi va `SUBMITTED` bo'ldi.
- `SUBMITTED` ni qo'lda qo'yishga urinish — 400 (dalilsiz holat yo'q).
- Tokensiz — 401. Jest: 92 test o'tdi. ESLint va `tsc` — toza.

### Hali ekranda ko'rilmagan
Brauzerdagi ilova API manzili sifatida eski cloudflare tunnelini ishlatadi,
u o'chgan — shu sababli ekranning o'zi jonli ma'lumot bilan sinalmadi.
Ertaga yangi tunnel ko'tarilgach birinchi ish shu ekranni telefonda ochib
ko'rish.

---

## Bosqich B — mahsulot tekshiruvi va savdo kanali (BAJARILDI)

### Yo'l tartibi
... mahsulot qo'shish → **tekshiruv** → **savdo kanallariga chiqarish**
(oxiridan bitta oldin) → **pul qabul qilish** (oxirgi bo'lim).

### Bajarilgan ish
- Mahsulot holatlari: `DRAFT` → `IN_REVIEW` → `CHANGES_REQUESTED`/`READY`
  → `PUBLISHED`. Har o'zgarish tarixga yoziladi.
- `POST /products/:id/submit` — tekshiruvga yuborish. Shartlar serverda:
  sotuvchi arizasi tasdiqlangan bo'lishi va mahsulot to'liq bo'lishi kerak
  (nom, tavsif, narx, foto, og'irlik, o'lchamlar, tayyorlash muddati).
  Yetishmayotgani `missingForReview` bo'lib qaytadi — ilova o'zi taxmin
  qilmaydi.
- `POST /products/:id/review` (operator) — tasdiqlash yoki tuzatish so'rash;
  tuzatishda izoh MAJBURIY.
- `GET /products/review/queue` — operator navbati.
- `PATCH /products/:id/stock` — qoldiq.
- **Savdo kanaliga chiqarish**: avtomatik joylashtirish yoqilmagan bo'lsa
  so'rov **qo'lda joylashtirish navbatiga** tushadi (holat `PENDING`,
  xato emas). ECWT jamoasi platformaga joylab, e'lon havolasini yozadi:
  `GET /products/placement/queue`, `POST /products/placement/:id/placed`.
  Havola majburiy — "joyladim" degan so'zning o'zi dalil emas.
- Tuzatilgan xato: ilgari mahsulot barcha urinishlar muvaffaqiyatsiz
  bo'lganda ham `PUBLISHED` bo'lib ko'rinardi. Endi bu holat faqat
  platforma haqiqatan qabul qilgandan keyin qo'yiladi.
- Mobil: mahsulot sahifasida tekshiruv bo'limi (holat, operator izohi,
  yetishmayotganlar, "Tekshiruvga yuborish"), kanal bo'limida esa ochiq
  yozuv: **avtomatik joylashtirish yoqilgunicha mahsulotni kompaniya
  asoschisi shaxsan qo'lda joylashtiradi**. "demo/sinov" yozuvlari
  olib tashlandi.
- Yangi "Pul" bo'limi (oxirgi yorliq): uydirma balans yo'q — sotuv
  bo'lmaguncha ochiq aytiladi, pul olish rekviziti shu yerda ko'rinadi.

### Tekshirildi (14.09.2026)
Uchidan-uchiga 14 ta tekshiruv o'tdi: to'liq bo'lmagan mahsulot yuborilmadi;
ariza tasdiqlanmasdan yuborilmadi; takroriy yuborish 400; tekshiruvdagi
mahsulot sotuvga chiqmadi; izohsiz "tuzatish" 400; tasdiqlangach `READY`;
chiqarilganda `PENDING` (xato xabari yo'q) va navbatga tushdi; havolasiz
"joyladim" 400; havola bilan `LISTED` + mahsulot `PUBLISHED`.
`tsc`, ESLint toza; 92 test o'tdi.

---

## Qo'shimcha — "Biz haqimizda" va 24/7 yordam (BAJARILDI)

- `CompanyInfo` modeli: kompaniya nomi, ustavdagi to'liq nom, STIR,
  asoschi (ism, lavozim, qisqacha ma'lumot), 24/7 yordam raqami,
  joylashuv (kenglik/uzunlik), manzil satri.
- Ma'lumot KODGA emas, bazaga yoziladi — raqam yoki manzil o'zgarganda
  ilovani qayta chiqarish shart emas.
- `GET /company` — hamma ko'radi; `PATCH /company` va
  `POST /company/location` — faqat administrator.
- Joylashuvni faqat **GPS** belgilaydi (`expo-location`), qo'lda
  koordinata yozilmaydi: yozilgan manzil xaritada boshqa nuqtaga tushadi.
  Koordinata chegaradan chiqsa (masalan 999) — 400.
- Mobil: `app/about.tsx` — Profil > "Biz haqimizda". Raqamga bosilsa
  qo'ng'iroq, joylashuvga bosilsa xarita ochiladi.
- Boshlang'ich ma'lumot (hujjat bilan tasdiqlangan):
  "E-COMMERCE WORLD TRADE" MChJ, STIR 306843537, asoschi
  Asror Shakirov Abidovich, 24/7 yordam +998 97 711-51-77.
  **Manzil yozilmadi** — uni asoschi ilovadan GPS orqali belgilaydi.
- `+998 97 711-51-77` raqami SUPER_ADMIN qilib belgilandi — GPS tugmasi
  va operator amallari shu hisobda ochiq.

### Tekshirildi (14.09.2026)
`canEdit` oddiy foydalanuvchida false, administratorda true; oddiy
foydalanuvchi joylashuv qo'ysa 403; noto'g'ri koordinata 400; administrator
qo'ygan koordinatani foydalanuvchi ko'radi; tokensiz 401. Sinov uchun
qo'yilgan koordinata bazadan tozalandi.

---

## Ilovani to'liq ko'zdan kechirish (14.09.2026) — 8 kamchilik tuzatildi

1. "JShShIR" yorlig'i noto'g'ri yozilgan edi → "JSHSHIR (PINFL)".
2. STIR jismoniy shaxsdan ham majburiy so'ralardi — YATT'i yo'q hunarmand
   shu qadamda qamalib qolardi → endi faqat YATT uchun majburiy.
3. "Marketplace integratsiyalari demo rejimida" yozuvi qolib ketgan edi →
   asoschi qo'lda joylashtirishi haqidagi matn (4 tilda).
4. Bank qadamiga qaytilganda server maskalab qaytargan hisob raqami
   tahrir maydoniga tushib, "Davom etish" xato berardi → endi
   "Saqlangan: ••••4567" deb ko'rsatiladi, bo'sh qoldirilsa o'zgarmaydi.
5. Beshinchi yorliq qo'shilgach pastdagi nomlar kesilardi → balandlik va
   shrift tuzatildi.
6. Subsidiya paketida "miqdori" qizil "To'ldirilmagan" deb turardi,
   holbuki uni foydalanuvchi saytda kiritadi → "Saytda o'zingiz kiritasiz".
7. Sotuvchi arizasi "Arizalarim" bo'limida ko'rinmasdi ("arizangiz yo'q"
   deb turardi) → endi raqami va holati bilan tepada.
8. "Pul" bo'limidagi "Mahsulotlar: 0" noaniq edi → "Sotuvda turgan
   mahsulotlar".

Sinov sozlamasi `EXPO_PUBLIC_RESET_ONBOARDING` **vaqtincha o'chirildi**
(har ochilganda anketani boshidan boshlatardi va kabinetni tekshirishga
imkon bermasdi). Kerak bo'lsa `.env` da qayta yoqiladi.

---

## Subsidiya → xizmat to'lovi → bo'limlarni ochish (BAJARILDI)

### Yo'l
1. Hunarmand subsidiyaga ariza topshiradi (online-mahalla paketi).
2. Ariza raqami saqlangach ekranda: **"Mutaxassislarimiz siz bilan
   aloqaga chiqishadi va jarayonni oxirigacha birga olib boradi."**
3. Subsidiya bank hisobiga tushganda hunarmand "Subsidiya keldi" tugmasini
   bosadi → ECWT o'tkazma rekvizitlari ko'rsatiladi.
4. Kelishilgan summani o'tkazadi, **bank chekini ilovaga yuklaydi**.
5. Operator hujjatni ko'rib **tasdiqlaydi** → savdo bo'limlari ochiladi.

### Qoidalar (serverda)
- `CONFIRMED` holatini **faqat administrator** qo'yadi va **faqat
  yuklangan hujjat ustidan**. Foydalanuvchi ham, ilova ham bu holatga
  o'tkaza olmaydi — aks holda "to'landi" yozuvi hech narsani anglatmaydi.
- Hujjatsiz "to'ladim" qabul qilinmaydi; begona hujjat ham (404).
- Rad etishda sabab majburiy.
- Rekvizitlar faqat kerak bo'lganda ko'rsatiladi (o'tkazma kutilayotganda
  yoki rad etilganda) — tasdiqlangandan keyin yashiriladi.
- Qulf mobil ilovada emas, **serverda**: `submitForReview` va `publish`
  to'lov tasdiqlanmasa 400 qaytaradi. Ilovadagi qulf faqat ko'rinish.

### Endpointlar
`GET /service-payment`, `POST /service-payment/subsidy-arrived`,
`POST /service-payment/proof`, `GET /service-payment/queue` (operator),
`POST /service-payment/:userId/decision` (administrator).

### Tekshirildi (14.09.2026)
To'liq zanjir jonli serverda: to'lovsiz tekshiruv va sotuv — 400;
subsidiya keldi → rekvizitlar chiqdi; hujjatsiz to'lov — 400; begona
hujjat — 404; foydalanuvchi o'zini tasdiqlashi — 403; hujjat yuborilgach
ham yopiq; sababsiz rad etish — 400; operator tasdiqladi → `unlocked:
true` va mahsulot tekshiruvga ketdi (`IN_REVIEW`). Jest: 97 test (5 tasi
yangi), ESLint va `tsc` toza.

### Sizdan kerak
ECWT **o'tkazma rekvizitlari** hali kiritilmagan (qabul qiluvchi nomi,
hisob raqami, MFO, bank). Ularsiz ekranda "—" ko'rinadi. Menga aytsangiz
kiritaman yoki administrator hisobidan `PATCH /company` orqali o'zingiz
qo'shasiz. Xizmat summasi ham kelishilgan qiymat — uni hunarmand o'zi
kiritadi, ilova to'qib yozmaydi.

---

## Onlayn shartnoma (BAJARILDI — shablon kutilmoqda)

### Qanday ishlaydi
- Shartnoma matni **kodda emas, bazada** va **versiyalanadi**:
  `POST /contract/templates` yangi versiya qo'shadi va uni faol qiladi.
  Shartnomani o'zgartirganingizda kodga tegilmaydi.
- Matn ichida `{{fullName}}`, `{{address}}`, `{{bankAccount}}` kabi o'rin
  egallar bo'ladi — ular hunarmand ma'lumotidan **avtomatik** to'ldiriladi.
  To'liq ro'yxat: `apps/api/src/modules/contract/contract-fields.ts`.
- Shablonda **notanish** o'rin egal bo'lsa (masalan `{{yangiMaydon}}`),
  saqlashda darhol aytiladi — jimgina bo'sh qolmaydi.
- Ma'lumot yetishmasa shartnoma tuzilmaydi; nima yetishmayotgani va uni
  qayerda to'ldirish ko'rsatiladi.
- Tuzilgan shartnoma **matn nusxasini saqlaydi**: shablon keyin
  o'zgarsa ham, imzolangan shartnoma o'zgarmaydi.
- Raqam: `ECWT-SH-2026-000001`.

### E-imzo (didox.uz)
`ESIGN_API_URL` / `ESIGN_API_KEY` berilmagan bo'lsa tizim **"yuborildi"
deb ko'rsatmaydi** — ochiq aytadi: "Elektron imzo tizimi hali ulanmagan".
"Imzolandi" holatini foydalanuvchi qo'ya olmaydi (403) — uni faqat
administrator yoki tizim tasdig'i qo'yadi.

### Tekshirildi (14.09.2026)
10 ta holat jonli serverda: shablonsiz holat; oddiy foydalanuvchi shablon
saqlolmaydi (403); shablon saqlandi (v1); bo'sh profilda `ready: false` va
ma'lumotsiz shartnoma 400; to'ldirilgach matn to'g'ri to'ldi (F.I.Sh.,
sana, pasport, manzil, bank); shartnoma tuzildi (`ECWT-SH-2026-000001`);
e-imzoga yuborish 400 (ulanmagan); foydalanuvchi o'zini imzolangan deb
qo'ya olmadi (403); **yangi versiya (v2) qo'shilganda eski shartnoma matni
o'zgarmadi**; notanish o'rin egal aytildi. Sinov shablonlari o'chirildi.

### Sizdan kerak
1. **Shartnoma matni** (Word/PDF yoki oddiy matn). Men uni o'rin egallar
   bilan shablonga aylantirib yuklayman.
2. **didox.uz hisobi va API kalitlari** — ulangach imzo oqimi shu
   ekranda ochiladi, ilovada boshqa hech narsa o'zgarmaydi.

---

## Tunnel: kelishilgan qadamlar (15.09.2026)

Ro'yxatdan o'tish (1–10) tugagach foydalanuvchi **kabinetga tushmaydi** —
mahsuloti xalqaro savdoga chiqquncha qadamlardan birma-bir o'tadi.

**Subsidiya yo'li — 22 qadam:**
11 subsidiyaga ariza · 12 mahallaga borib **Hokim yordamchisi** raqamini
kiritish · 13 Mahalla 7-ligi qarori (kutish; rad etilsa sabab + «o'zim
to'layman» tugmasi) · 14 «Sizga pul tushdi» (ECWT belgilaydi) ·
15 xizmat haqi · 16 to'lov tekshiruvi (kutish) · 17 FBM/FBA (**bir marta**) ·
18 mahsulot tayyorlash (4 bosqich) · 19 daromad kalkulyatori ·
20 foto/video va xalqaro listing · 21 savdo maydonchasiga chiqarish →
yakuniy tabrik → **kabinet ochiladi**.

**«O'zim to'layman» yo'li — 18 qadam:** subsidiya qadamlari umuman yo'q,
anketadan keyin to'g'ridan-to'g'ri 11-qadam — xizmat haqi.

Har qadamda uchta narsa: **hozir nima bo'lyapti** / **kim harakat
qilmoqda** (Siz · Mahalla · ECWT · Marketplace) / **keyin nima bo'ladi**.
Kutish qadamlarida tugma bo'lmaydi. Doim ochiq: 24/7 yordam, til, profil.

### Narxlash (asoschi tasdiqlagan)
| | Subsidiya bilan | O'zi to'laydi | Yirik tadbirkor |
|---|---|---|---|
| Xizmat haqi | subsidiya hisobidan | **13 200 000 so'm** | sotuvdan **15%** |
| AQSHga jo'natish | ECWT (5 kg gacha) | o'z hisobidan | o'z hisobidan |
| Ombor (2 yil) | tekin | tekin | tekin |
| Shtrix-kod | o'z hisobidan | o'z hisobidan | o'z hisobidan |

Shtrix-kod (GS1 US, rasmiy narx): bitta GTIN **$30**, yillik to'lovsiz.
Kompaniya prefiksi: 100 tagacha **$750** (bittasi ~$7,5), 1000 tagacha
$2 500. Hunarmandlar soni oshsa prefiks olish to'rt baravar arzon.

### Bajarilgan: yo'l dvigateli
`GET /journey` — foydalanuvchi qaysi qadamda ekanini qaytaradi.
Qadam **alohida saqlanmaydi**, mavjud ma'lumotdan hisoblanadi (anketa,
ariza, mahalla tashrifi, to'lov holati, mahsulot, e'lon). Sabab: ikki
joyda saqlangan holat vaqt o'tib bir-biridan farq qiladi.
`POST /journey/mahalla-visit` — Hokim yordamchisi F.I.Sh. va raqami
(raqam majburiy, faqat operatorlarga ko'rinadi).
`POST /journey/sales-mode` — FBM/FBA, bir marta.

Tekshirildi: ikkala yo'l ham to'liq o'tildi (22 va 18 qadam), noto'g'ri
telefon 400, savdo usulini qayta almashtirish 400.

### Ertaga
Dvigatelni ilovaga ulash: anketadan keyin kabinet o'rniga tunnel ekrani,
har qadam o'z beti, oxirida tabrik → kabinet.

---

## Keyingi bosqichlar (hali bajarilmagan)
- **C** — buyurtma, tayyorlash/qadoqlash, topshirish, xalqaro kuzatuv,
  qaytarish va bekor qilish.
- **D** — sotuv bo'yicha hisob-kitob, pul so'rovi, provayder tasdig'i.
- **E** — qo'shimcha kanallar, doimiy hosting (vaqtinchalik tunnel emas).
- Kabinetni 5 bo'limga qayta qurish: Bosh sahifa, Mahsulotlar, Buyurtmalar,
  Moliya, Profil.

## Mendan mustaqil hal qilib bo'lmaydigan savollar

1. **Marketplace hisobi kimniki?** Amazon/eBay'da sotuvchi hisobi ECWT
   nomidanmi yoki har bir hunarmand o'z hisobinimi ochadi? Bu savdo
   kanallari arxitekturasini ham, pul oqimini ham belgilaydi.
2. **Pul Toshkentda qanday beriladi?** Bank o'tkazmasi, karta yoki naqd —
   qaysi biri, qaysi provayder orqali va qanday hujjat bilan tasdiqlanadi?
   "To'landi" holati faqat provayder tasdig'i yoki tekshirilgan operator
   hujjati bilan o'zgaradi — tasdiq manbai aniqlanmaguncha bu holat
   qo'lda ham qo'yilmaydi.
3. **Integratsiya kalitlari** — ular faqat
   backendda `.env` da turadi, mobil ilovaga hech qachon kirmaydi.
4. **Eskiz SMS kalitlari** — siz o'zingiz ulaysiz.
5. **Doimiy hosting va webhook manzili** — kompyuter o'chishiga bog'liq
   bo'lmagan domen kerak; hozirgi tunnel ishlab chiqarish uchun emas.
