# ECWT — Hunarmandlar platformasi

O‘zbekiston Elektron Tijorat Kompaniyasi (ECWT) uchun monorepo: hunarmand, usta,
ishlab chiqaruvchi va kichik tadbirkorlar davlat subsidiyalariga ariza berishi va
mahsulotini xalqaro marketplace’larga chiqarishi uchun mobil ilova, backend va
admin panel.

```
apps/
  mobile/   React Native (Expo SDK 57) — hunarmand uchun mobil ilova
  api/      NestJS 11 + Prisma 7 + PostgreSQL — backend
  admin/    Next.js 15 — boshqaruv paneli
packages/
  types/        umumiy tiplar, enum'lar, ariza status mashinasi
  validation/   Zod sxemalari (API + mobil + admin uchun bitta manba)
  api-client/   tiplashtirilgan API klient (token refresh bilan)
  ui/           dizayn tokenlari (mobil + admin bir xil brend palitrasi)
  config/       umumiy konstantalar (BHM, OTP, marketplace ro'yxati)
```

---

## 1. Talablar

| Dastur | Versiya | Izoh |
|---|---|---|
| Node.js | ≥ 20 (sinovdan o‘tgan: 24) | |
| pnpm | ≥ 10 (sinovdan o‘tgan: 11.24) | `corepack enable pnpm` |
| PostgreSQL | 14+ | **Ixtiyoriy** — pastga qarang |
| Android Studio / Xcode | — | Emulyatorda ishga tushirish uchun |
| Expo Go | — | Real telefonda sinash uchun |

### Ma’lumotlar bazasi haqida

Loyiha PostgreSQL bilan ishlaydi (`provider = "postgresql"`). Lokal
developmentda Postgres yoki Docker o‘rnatilmagan bo‘lsa ham ishga tushirish uchun
**PGlite** (WASM Postgres) real Postgres wire protokoli bilan 5432 portda
ko‘tariladi — Prisma uni oddiy Postgres serverdek ko‘radi.

```bash
pnpm dev:db      # PGlite serverni ishga tushiradi (o'rnatish shart emas)
```

Real Postgres ishlatmoqchi bo‘lsangiz — `apps/api/.env` dagi `DATABASE_URL` ni
o‘zgartiring va `DATABASE_POOL_MAX` ni 10–20 qiling (PGlite bir vaqtda bitta
ulanish qabul qiladi, shuning uchun dev uchun default 1).

---

## 2. Birinchi ishga tushirish

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env.local

pnpm build:packages     # umumiy paketlarni kompilyatsiya qilish
pnpm dev:db             # 1-terminal: lokal Postgres (PGlite)
pnpm db:push            # 2-terminal: schema'ni bazaga yozish
pnpm db:seed            # demo ma'lumotlar
pnpm dev:api            # backend → http://localhost:4000/api
pnpm dev:admin          # admin  → http://localhost:3000
pnpm dev:mobile         # Expo   → QR kod / emulyator
```

`pnpm setup` — `install → build:packages → db:push → db:seed` ni bitta buyruqda
bajaradi (baza allaqachon ishlab turgan bo‘lishi kerak).

### Demo hisoblar (seed)

| Rol | Kirish |
|---|---|
| Hunarmand | telefon `998901234567`, OTP kod API javobida qaytadi (dev rejim) |
| SUPER_ADMIN | `998900000001` / `Admin12345!` |
| REVIEWER | `998900000002` / `Admin12345!` |

> Development rejimida SMS haqiqatda yuborilmaydi. OTP kodi API javobida
> (`devCode`) va serverning konsolida ko‘rinadi. `EXPOSE_DEV_OTP=false` qilinsa
> kod hech qayerda ochilmaydi — productionda albatta `false`.

---

## 3. Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `pnpm dev` | DB + API + admin ni birgalikda ishga tushiradi |
| `pnpm dev:db` | Lokal PGlite Postgres (5432) |
| `pnpm dev:api` | NestJS watch rejimida |
| `pnpm dev:admin` | Next.js dev server |
| `pnpm phone` | **Telefonda sinash**: baza + backend + Expo (QR kod) |
| `pnpm dev:mobile` | Faqat Expo dev server |
| `pnpm db:push` | Prisma schema → baza |
| `pnpm db:seed` | Demo ma’lumotlar |
| `pnpm typecheck` | Barcha paketlarda TypeScript tekshiruvi |
| `pnpm lint` | ESLint |
| `pnpm test` | Testlar |
| `pnpm build` | Paketlar + API + admin build |
| `maestro test .maestro/` | E2E testlar (kirish + 10 qadamli anketa) |

Swagger: `http://localhost:4000/api/docs`

---

## 4. Mobil ilovani REAL TELEFONDA ochish

Bitta buyruq — baza, backend va Expo birga ko‘tariladi, terminalda QR kod chiqadi:

```bash
pnpm phone
```

Keyin telefonda:

1. **Expo Go** ilovasini o‘rnating (Play Market / App Store).
2. Telefon va kompyuter **bitta Wi-Fi** tarmog‘ida bo‘lsin.
3. Terminaldagi **QR kodni skanerlang**:
   - Android — Expo Go ichidagi `Scan QR code`;
   - iPhone — oddiy **Kamera** ilovasi bilan;
   - QR ko‘rinmasa: Expo Go → `Enter URL manually` → `exp://<IP>:8081`
     (IP terminalning boshida yoziladi).
4. Ilova ochiladi → telefon raqami → tasdiqlash kodi (ekranning pastida
   ko‘rsatiladi) → ichkariga kirasiz.

### API manzilini qo‘lda sozlash kerakmi?

**Yo‘q.** Ilova Expo Go qaysi kompyuterga ulangan bo‘lsa, o‘sha IP ni avtomatik
oladi va API ni `http://<IP>:4000/api` dan qidiradi. `apps/mobile/.env` dagi
`EXPO_PUBLIC_API_URL` **bo‘sh** turishi kerak — u faqat API boshqa serverda
bo‘lganda to‘ldiriladi.

Ulanish holatini ilovaning `Profil → Sozlamalar` bo‘limida ko‘rish mumkin
("Server bilan aloqa" qatori: *Aloqa bor* / *Aloqa yo‘q*).

### Windows firewall

4000 (API) va 8081 (Metro) portlari ochiq bo‘lishi kerak. Ular sozlangan; qayta
qo‘shish uchun (PowerShell, administrator):

```powershell
New-NetFirewallRule -DisplayName "ECWT API (4000)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4000 -Profile Any -RemoteAddress LocalSubnet
```

`RemoteAddress LocalSubnet` — port faqat shu Wi-Fi tarmog‘iga ochiladi,
internetdan emas.

### Muammo bo‘lsa

| Belgi | Sabab | Yechim |
|---|---|---|
| QR ochilmayapti | Turli tarmoq | Telefon va kompyuter bitta Wi-Fi da bo‘lsin |
| "Serverga ulanib bo‘lmadi" | Firewall yoki API o‘chiq | `pnpm phone` ishlab turibdimi? Yuqoridagi firewall buyrug‘i |
| Telefon brauzerida `http://<IP>:4000/api/craft-categories` ochilmaydi | Router "AP isolation" | Routerda qurilmalararo aloqani yoqing yoki telefon hotspot'idan foydalaning |

### EAS Build (do‘konga chiqarish uchun)

`apps/mobile/eas.json` tayyor (development / preview / production profillari).

```bash
cd apps/mobile
npx eas login
npx eas build:configure     # projectId ni yozadi
npx eas build --profile preview --platform android
```

Diqqat: standalone build'da HTTP (cleartext) manzil ishlamaydi — production
uchun API **HTTPS** bo‘lishi kerak (`eas.json` da shunday sozlangan).

---

## 5. Nima ishlaydi (MVP oqimi)

**Hunarmand:** telefon → OTP → profil (shaxsiy / hunar / tadbirkorlik / bank) →
hujjat yuklash → mos subsidiyalar ro‘yxati (moslik foizi bilan) → talablar
tafsiloti → 6 bosqichli ariza sehrgari → yuborish → status timeline →
tuzatishga qaytarilsa sabab bilan ko‘rish → qayta yuborish → to‘lov holati.

**Admin:** login → arizalar ro‘yxati va filtrlar → ariza tafsiloti → status
o‘zgartirish (faqat qonuniy o‘tishlar) → rad etish/tuzatish sababi majburiy →
audit jurnali → foydalanuvchilar → bildirishnoma yuborish.

**Marketplace:** mahsulot qo‘shish → platformalarni tanlash → chiqarish
(hozircha **mock** — pastga qarang).

---

## 6. Mock va real integratsiyalar

Loyihada real credential yo‘q integratsiyalar **ataylab “ishlayapti” deb
ko‘rsatilmaydi**. Ular adapter arxitekturasi orqali ulanadi va mock holatda
foydalanuvchiga ochiq aytiladi.

| Integratsiya | Holat | Ulash uchun |
|---|---|---|
| SMS (OTP) | 🟡 mock — konsolga chiqadi | `SMS_PROVIDER=eskiz` + `ESKIZ_EMAIL/PASSWORD` |
| OneID (shaxs) | 🔴 mock — avtomatik tasdiqlamaydi, `MANUAL_REVIEW` qaytaradi | `IDENTITY_PROVIDER=oneid` + `ONEID_CLIENT_ID/SECRET/REDIRECT_URI` |
| E-IMZO | 🔴 mock — imzo `isCryptographic: false` deb belgilanadi | `SIGNATURE_PROVIDER=eimzo` + `EIMZO_BASE_URL/API_KEY` |
| Soliq reyestri | 🔴 mock — `MANUAL_REVIEW` | `REGISTRY_PROVIDER=real` + `TAX_REGISTRY_*` |
| Uyushma reyestri | 🔴 mock — `MANUAL_REVIEW` | `HUNARMAND_REGISTRY_*` |
| Bank verifikatsiya | 🔴 yo‘q — moderator tasdiqlaydi | bank API kelishuvi kerak |
| Marketplace (Amazon/eBay/Walmart…) | 🟡 mock — listing `isMock: true` | `MARKETPLACE_PROVIDER=real` + platforma API kalitlari |
| AI assistant | 🟡 mock — javoblar profil ma’lumotidan quriladi, LLM chaqirilmaydi | `AI_PROVIDER=openai` + `OPENAI_API_KEY` |
| Fayl saqlash | 🟢 lokal disk | `STORAGE_DRIVER=s3` + `S3_*` (adapter to‘ldirilishi kerak) |
| Push (FCM/APNs) | 🔴 yo‘q — hozircha faqat in-app | `expo-notifications` + device token jadvali |

Mendan olinishi shart bo‘lgan narsalar: **davlat organi credentiallari (OneID,
E-IMZO, reyestrlar), SMS provayder hisobi, marketplace API kalitlari, AI API
kaliti va bank kelishuvi.** Ular bo‘lmaguncha yuqoridagi adapterlar ochiq xato
qaytaradi.

---

## 7. Huquqiy ogohlantirish

Bazadagi 4 ta subsidiya dasturi **demo** (`isDemo: true`) va mobil ilovada
“DEMO” belgisi bilan ko‘rsatiladi. Ular real normativ hujjat o‘rnini bosmaydi.
Ishga tushirishdan oldin:

1. Har bir dastur uchun amaldagi qaror/nizom matni yuristlar tomonidan
   tasdiqlanishi;
2. Talablar (`SubsidyRequirement`) va hujjatlar ro‘yxati admin panel orqali
   yangilanishi;
3. `BHM` qiymati joriy yilga moslanishi kerak.

---

## 8. Xavfsizlik

- JWT access (15 daq) + refresh (30 kun) **rotation** bilan: ishlatilgan refresh
  token qayta ishlatilsa, foydalanuvchining barcha sessiyalari bekor qilinadi.
- Parollar va OTP kodlari bcrypt bilan hashlanadi; OTP 5 urinish va 2 daqiqa
  bilan cheklangan, telefon raqamiga soatiga 5 ta so‘rov limiti bor.
- Rate limiting (`@nestjs/throttler`), Helmet, CORS oq ro‘yxati.
- Fayl yuklashda MIME + **magic bytes** tekshiruvi, 10 MB limit.
- JShShIR, hisob raqami va karta **maskalangan holda** qaytariladi; karta to‘liq
  raqami umuman saqlanmaydi.
- Loglarda maxfiy maydonlar avtomatik `***` bilan almashtiriladi.
- Rollar: `USER` / `REVIEWER` / `ADMIN` / `SUPER_ADMIN`.
- Har bir status o‘zgarishi va admin harakati `AuditLog` ga yoziladi.

---

## 9. Ariza status mashinasi

```
DRAFT → SUBMITTED → UNDER_REVIEW → SCORING → LOCAL_REVIEW → APPROVED
      → PAYMENT_PROCESSING → PAID

UNDER_REVIEW / SCORING / LOCAL_REVIEW → NEEDS_CORRECTION → SUBMITTED
UNDER_REVIEW / SCORING / LOCAL_REVIEW / APPROVED → REJECTED
DRAFT / SUBMITTED / NEEDS_CORRECTION → CANCELLED
```

Qoidalar `packages/types/src/state-machine.ts` da; backend har bir o‘tishni
tekshiradi, noqonuniy o‘tish 400 bilan rad etiladi. Bu mantiq unit testlar bilan
qoplangan (`apps/api/src/modules/applications/application-state.spec.ts`).

---

## 10. Til

Birinchi versiya **100% o‘zbek tilida (lotin yozuvi)**. Ilovada birorta ham
texnik inglizcha status yoki enum ko‘rinmaydi — barcha holatlar ("Tuzatish
kerak", "Ko‘rib chiqilmoqda", "To‘landi") o‘zbekcha.

`apps/mobile/src/i18n` arxitekturasi ko‘p tilga tayyor: yangi til qo‘shish uchun
lug‘at faylini qo‘shib, `dictionaries` ga ulash kifoya. To‘liq bo‘lmagan
tarjimalar aralash matn keltirib chiqarmasligi uchun ru/en/kk **ataylab
qo‘shilmagan** — ular keyingi bosqichda to‘liq holda kiritiladi.

---

## 11. Kuzatuv, analitika va E2E

### Xatolarni kuzatish (Sentry)

DSN berilmasa **o‘chiq** holda ishlaydi — lokal ishlab chiqishda hech narsa
sozlash shart emas.

1. [sentry.io](https://sentry.io) da ikkita loyiha oching: **Node.js** (API)
   va **React Native** (mobil).
2. DSN’larni qo‘ying:
   - `apps/api/.env` → `SENTRY_DSN=...`
   - `apps/mobile/.env` → `EXPO_PUBLIC_SENTRY_DSN=...`

Yuborilmaydi: IP manzil, so‘rov tanasi, sarlavhalar, foydalanuvchi ismi va
telefoni. Faqat foydalanuvchi ID’si biriktiriladi. Serverda **faqat 5xx**
xatolar yuboriladi — 4xx foydalanuvchi xatosi va shovqin qiladi.

> Source map yuklash (stack trace o‘qiladigan bo‘lishi) uchun keyinchalik
> `@sentry/react-native/expo` config plagini va `SENTRY_AUTH_TOKEN` kerak
> bo‘ladi — hisob ochilgandan so‘ng qo‘shiladi.

### Voronka analitikasi

Uchinchi tomon SDK’siz, o‘z serverimizda. Yig‘iladi: qaysi qadam ko‘rildi,
qachon. **Yig‘ilmaydi**: ism, telefon, JShShIR, manzil, hujjat.

```bash
# Admin sifatida: anketaning qaysi qadamida odamlar to'xtab qolgan
curl http://localhost:4000/api/analytics/funnel -H "Authorization: Bearer <admin-token>"
```

Hodisalar navbatga yig‘iladi va to‘plam bilan yuboriladi; internet yo‘q
bo‘lsa navbatda saqlanib, aloqa tiklanganda jo‘natiladi.

### Push bildirishnomalar

Ariza holati o‘zgarganda foydalanuvchiga push boradi (in-app bildirishnoma
bilan birga). Token `DeviceToken` jadvalida saqlanadi, chiqishda o‘chiriladi,
Expo `DeviceNotRegistered` qaytarsa avtomatik faolsizlantiriladi.

> **Muhim:** Android’da Expo Go push tokenini bermaydi (SDK 53+).
> Sinash uchun development build kerak:
> `eas build --profile development --platform android`

### E2E testlar (Maestro)

```bash
maestro test .maestro/
```

Batafsil: [.maestro/README.md](.maestro/README.md)

---

## 12. Keyingi bosqichlar

- [ ] Real SMS (Eskiz) — kod tayyor, `ESKIZ_EMAIL` / `ESKIZ_PASSWORD` kerak
- [ ] Real OneID / E-IMZO / reyestr integratsiyalari (credential kelgach)
- [ ] Subsidiya dasturlari — **rasmiy hujjat asosida** to‘ldiriladi
      (`prisma/seed.ts` dagi `SUBSIDIES` ataylab bo‘sh: to‘qilgan shartlar
      foydalanuvchini chalg‘itadi)
- [ ] To‘lov integratsiyasi (Payme / Click / Uzum)
- [ ] Admin panelda subsidiya muharriri (hozir API orqali)
- [ ] Marketplace real adapterlari (Amazon SP-API, eBay Sell API, Walmart)
- [ ] S3 storage adapteri
