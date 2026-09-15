# E2E testlar (Maestro)

Ilovaning eng muhim oqimlari avtomatik tekshiriladi. Qo'lda 40 daqiqa
bosib chiqiladigan yo'l bu yerda ~2 daqiqada o'tadi.

## O'rnatish

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Windows'da: WSL yoki `scoop install maestro`.

## Ishga tushirish

Avval ilova qurilmada/emulyatorda ochilgan bo'lishi kerak:

```bash
pnpm dev:mobile          # Metro
# boshqa terminalda: ilovani emulyatorda oching
```

Keyin:

```bash
maestro test .maestro/                 # hammasi
maestro test .maestro/01-auth.yaml     # bittasi
maestro studio                         # qadamlarni yozib olish
```

## Muhim shart

Testlar **sinov rejimi**da ishlaydi: `apps/api/.env` da
`EXPOSE_DEV_OTP=true` bo'lishi kerak — shunda OTP kodi ekranda ko'rinadi
va test uni o'qiy oladi. Productionda bu o'zgaruvchi bo'lmaydi.

## Fayllar

| Fayl | Nimani tekshiradi |
|---|---|
| `01-auth.yaml` | Xush kelibsiz → telefon → OTP → kirish |
| `02-onboarding.yaml` | 10 qadamli anketa to'liq yakunlanishi |
| `03-navigation.yaml` | Asosiy bo'limlar ochilishi va qulashmasligi |
