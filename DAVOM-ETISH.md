# ECWT — ish holati va keyingi qadam

Bu fayl suhbat uzilib qolsa davom ettirish uchun yozilgan.
Sana: 2026-09-16.

## APK — TAYYOR (2026-09-16)

APK qurildi va imzolandi:
`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
(87 MB, imzo: CN=ECWT, SHA-256 752edea7...1409)

### Haqiqiy sabab nimada edi

Avval "papka nomidagi bo'sh joy aybdor" deb o'ylangan edi — bu
NOTO'G'RI tashxis. Papka `D:\ecwt` ga o'tkazilgandan keyin ham
ninja o'sha xato bilan to'xtadi.

Asl sabab — **yo'l uzunligi**. pnpm ning
`.pnpm/<paket>@<versiya>_<hash>/node_modules/<paket>/` tuzilishi
yo'lga ~90 belgi qo'shardi, natijada C++ obyekt fayllarining yo'li
196 belgiga yetib, CMake ning 250 belgilik chegarasiga urilardi va
`build.ninja still dirty after 100 tries` xatosi chiqardi.

### Yechim

`.npmrc` da `node-linker=hoisted` yozilgan edi, lekin **pnpm 11 uni
o'qimaydi** — sozlamalar `pnpm-workspace.yaml` ga ko'chgan. Shuning
uchun `pnpm-workspace.yaml` ga qo'shildi:

```yaml
nodeLinker: hoisted
```

So'ng `node_modules` butunlay o'chirilib, noldan o'rnatildi. Endi
paketlar `D:\ecwt\node_modules\<paket>` da to'g'ridan-to'g'ri turadi
(~110 belgi) va C++ muammosiz yig'iladi.

**Muhim:** qisman o'rnatish ishlamaydi — pnpm "Already up to date"
deb o'tkazib yuboradi (`--force` ham yordam bermaydi). node_modules
ni TO'LIQ o'chirish kerak, aks holda `@ecwt/*` workspace
bog'lanmalari yaratilmay qoladi va Metro
"Unable to resolve module @ecwt/config" deb yiqiladi.

### APK ni qayta qurish

```bash
cd /d/ecwt/apps/mobile/android
export JAVA_HOME=$(ls -d /c/Users/user/AppData/Local/ecwt-tools/jdk/jdk-* | head -1)
export ANDROID_HOME="/c/Users/user/AppData/Local/ecwt-tools/android-sdk"
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew assembleRelease --no-daemon
```

To'liq qurish ~30 daqiqa oladi.

## Tayyor bo'lgan narsalar (qayta qilish shart emas)

| Narsa | Qayerda |
|---|---|
| Java 17 | `C:\Users\user\AppData\Local\ecwt-tools\jdk\` |
| Android SDK 36 + build-tools | `C:\Users\user\AppData\Local\ecwt-tools\android-sdk\` |
| Release imzo kaliti | `C:\Users\user\ecwt-keys\` (parol shu yerda `PAROL.txt`) |
| Imzo sozlamasi | `~/.gradle/gradle.properties` (ECWT_* qiymatlari) |
| Imzo plagini | `apps/mobile/plugins/withReleaseSigning.js` |

**Kalitni zaxiralash shart** — u yo'qolsa Play Market'da yangilanish
chiqarib bo'lmaydi.

## Server (mustaqil ishlaydi, tegilmaydi)

- Manzil: **https://mobil.ecwt.uz** (eski havola ham ishlaydi:
  `https://189-74-98-208.sslip.io`)
- VPS: 189.74.98.208, Ubuntu 24.04, kirish SSH kaliti bilan:
  `ssh -i ~/.ssh/ecwt_vps root@189.74.98.208`
- API: `systemd` xizmati `ecwt-api`, PostgreSQL 16, Nginx + Let's Encrypt
- SSL 2026-12-15 gacha, o'zi yangilanadi (certbot.timer)
- Ilovaning brauzer versiyasi: `/var/www/ecwt`
- Kod serverda: `/opt/ecwt`

Brauzer versiyasini yangilash:

```bash
cd /d/ecwt/apps/mobile
npx expo export --platform web --output-dir dist-web
tar -czf /tmp/ecwt-web.tgz -C dist-web .
scp -i ~/.ssh/ecwt_vps /tmp/ecwt-web.tgz root@189.74.98.208:/root/
ssh -i ~/.ssh/ecwt_vps root@189.74.98.208 \
  "rm -rf /var/www/ecwt/* && tar -xzf /root/ecwt-web.tgz -C /var/www/ecwt && rm /root/ecwt-web.tgz"
```

## Ochiq turgan ishlar

1. **Didox** — 8-qadam shartnomasini elektron imzolash. Hisob va API
   partner token kerak (account manager beradi). Rasmiy hujjat yopiq
   (api-docs.didox.uz login so'raydi), shuning uchun taxminiy kod
   YOZILMAYDI. Aniqlanishi kerak: hunarmand ERI kalitisiz imzolay
   oladimi?
2. **OpenAI kaliti** — `AI_PROVIDER=mock` turibdi, ChatGPT tugmasi
   ichida "kalit ulanmagan" deb yozilgan. Kalit `/opt/ecwt/apps/api/.env`
   ga qo'yiladi.
3. **Play Market** — dasturchi hisobi $25 (bir martalik).
4. **Gapiradigan AI avatar** — keyingi bosqich sifatida kelishilgan.

## Yaqinda qilingan o'zgarishlar

- Selfi **majburiy** qilindi ("Keyinroq qilaman" olib tashlandi,
  oldinga o'q selfi olinmaguncha ishlamaydi)
- Splash → 2-bet orasidagi qora ekran yo'qotildi (cross-fade)
- Splash videosi to'liq 8.04 soniya o'ynaydi (zaxira chegara 12 s)
- `sharp` kutubxonasi faqat kerak bo'lganda yuklanadi (eski CPU da
  butun API ni yiqitardi)
- Kabinetdagi subsidiya kartasi ariza topshirilgan bo'lsa ko'rinmaydi

## OTA yangilanish (EAS Update) — 2026-09-16 da sozlandi

Endi JS o'zgarishlarini APK tarqatmasdan yuborish mumkin.

```bash
cd /d/ecwt/apps/mobile
npx eas-cli update --channel production --environment production --message "nima o'zgardi"
```

Foydalanuvchi ilovani keyingi safar ochganda yangilanish o'zi tushadi.

### Sozlamalar

- `updates.url`: https://u.expo.dev/9e8fb02b-c9a9-406f-9dc9-28d0221a73c5
- Kanal: `production` — `app.json` dagi `updates.requestHeaders` da VA
  `android/app/src/main/AndroidManifest.xml` da yozilgan. Lokal
  (gradlew bilan) qurishda kanal avtomatik yozilmaydi, shuning uchun
  ikkala joy ham kerak.
- `runtimeVersion`: **`"0.3.0"`** — qotib turgan satr.

### MUHIM: runtimeVersion qoidasi

Bu loyiha bare workflow (`android/` papkasi qo'lda saqlanadi), shuning
uchun `{"policy": "appVersion"}` kabi siyosatlar ISHLAMAYDI — EAS
xato beradi. Qiymat qo'lda yoziladi va IKKI joyda bir xil bo'lishi shart:

1. `app.json` → `expo.android.runtimeVersion` va `expo.ios.runtimeVersion`
2. `android/app/src/main/res/values/strings.xml` → `expo_runtime_version`

Mos kelmasa yangilanish ilovaga umuman tushmaydi (jimgina).

**Native kod o'zgarganda** (yangi kutubxona, yangi ruxsatnoma) ikkala
joydagi runtimeVersion ko'tariladi va YANGI APK quriladi. Aks holda
eski ilovaga mos kelmaydigan JS tushib, ilova yiqiladi.

### Qurish osilib qolsa

Gradle ba'zan savol berib javob kutadi va abadiy osilib qoladi. Shuning
uchun qurishni doim shunday ishga tushiring:

```bash
export CI=1
./gradlew assembleRelease --no-daemon --console=plain < /dev/null > /d/ecwt/build-log.txt 2>&1
```

`< /dev/null` — savol chiqsa osilmay, darhol xato beradi.
Log alohida faylga yozilsa, borishini kuzatib turish mumkin.

### Bepul tarif chegarasi

1000 oylik faol foydalanuvchi, 100 GiB trafik. Oshsa pul yechilmaydi —
xizmat to'xtaydi.

## 2026-09-17 kechasi qilingan ishlar

Hammasi brauzerda jonli tekshirilgan (lokal API + baza bilan).

### Tuzatilgan nuqsonlar

- **Pastdagi oq qator** — Android shaffof panel ortiga kontrast pardasi
  tortardi. Ikki sozlama kerak bo'ldi (`plugins/withDarkNavigationBar.js`):
  `windowLightNavigationBar=false` va `enforceNavigationBarContrast=false`.
  Faqat birinchisi yetmaydi.
- **Login sahifasida tepadagi tugmalar status bar bilan urishishi** —
  `StepNav` `SafeAreaView` dan tashqarida qolgan edi. Boshqa sahifalarda
  to'g'ri turibdi, faqat login'da xato bor edi.
- **Tishli g'ildirak (sozlamalar) ishlamasligi** — `/settings` marshrut
  himoyachisidan o'tolmasdi: kirishdan oldin ham, anketa davomida ham
  (`!inSetup` sharti). `app/_layout.tsx` ga istisno qo'shildi. Kirishdan
  oldin tugma umuman ko'rsatilmaydi (o'lik tugma qolmasin).
- **ChatGPT tugmasi bosilganda hech narsa bo'lmasligi** — `/assistant`
  ham xuddi shu himoyachidan o'tolmasdi.

### O'zgargan xatti-harakat

- **JShShIR va pasport MAJBURIY** (avval ixtiyoriy edi) — Didox orqali
  imzolash uchun baribir kerak.
- **ChatGPT birinchi ekrandan boshlab ko'rinadi** (avval faqat 11-qadamdan).
  Pastda asosiy tugma turgan ekranlarda yuqoriroq ko'tariladi.
- **Kirish endi Face ID orqali** — "Hisobim bor" bosilganda darhol yuz
  tasdiqlash so'raladi, raqam va parol so'ralmaydi. Shakl "Boshqa yo'l
  bilan kirish" havolasi ortida qoladi — busiz yangi telefonda yoki
  ilova qayta o'rnatilganda hisobga kirishning yo'li qolmasdi.
- **Kamerasiz davom etish** — faqat BRAUZERDA. Telefonda selfi majburiy
  bo'lib qoladi. Busiz kamerasi yo'q kompyuterdan saytga kirgan odam
  (investor, hakam) ro'yxatdan umuman o'ta olmasdi.
- Welcome ekranidan "Kichik imkoniyatlar — katta natijalarga olib keladi"
  olib tashlandi, tugmalar joyi va splash videosi to'g'rilandi.

### Bilib qo'yish kerak

- **Anketa 10 qadam.** Tunnel esa to'lov usuliga qarab: o'zi to'lasa
  **18**, subsidiya orqali **22** qadam (4 ta qo'shimcha: ariza, mahalla,
  komissiya, tasdiq). Ikkalasi ham to'g'ri.
- `src/constants/wizard.ts` dagi `WIZARD_STEPS` — o'lik kod, hech
  qayerdan chaqirilmaydi. Tozalash mumkin.
- **Metro fayl o'zgarishlarini o'zi ko'rmaydi** (Windows + hoisted
  node_modules). Har o'zgarishdan keyin serverni `--clear` bilan qayta
  ishga tushirish kerak.
- Lokal sinov uchun: `pnpm dev:db` + `PORT=4000 pnpm dev:api`. Ilova
  localhost'da 4000-portni kutadi, `.claude/launch.json` dagi "dev"
  sozlamasi esa 3000 ni majburlaydi — shuning uchun qo'lda ishga
  tushirilgan ma'qul.
- Sinov uchun `.env` da SMS'ni `mock` ga o'tkazish mumkin, lekin
  **APK yig'ishdan oldin `eskiz` ga qaytarish SHART**.
