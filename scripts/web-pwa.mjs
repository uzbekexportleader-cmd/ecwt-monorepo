/**
 * Brauzer versiyasini "o'rnatiladigan ilova" (PWA) qiladi.
 *
 * Nima uchun kerak: odamlar APK faylidan cho'chiydi — "noma'lum manba"
 * ogohlantirishi, virus shubhasi. PWA da bunday narsa yo'q: foydalanuvchi
 * mobil.ecwt.uz ga kiradi, Chrome "Ilovani o'rnatish" deb taklif qiladi,
 * telefon ekranida ECWT ikonkasi paydo bo'ladi va ilova manzil qatorisiz,
 * xuddi oddiy ilova kabi ochiladi.
 *
 * Chrome shu taklifni FAQAT uchtasi bo'lganda ko'rsatadi:
 *   1. manifest.json (nom, ikonka, rang, display: standalone)
 *   2. ishlaydigan service worker
 *   3. HTTPS
 *
 * Birinchi ikkitasi `apps/mobile/public/` ichida va eksport paytida
 * o'zi ko'chiriladi. Uchinchisi serverda bor.
 *
 * Qolgani — HTML'ning `<head>` qismiga havolalarni qo'shish. Expo buni
 * `app/+html.tsx` orqali qilishga imkon beradi, LEKIN u faqat
 * `web.output: "static"` rejimida ishlaydi. Bu ilova SPA (`single`)
 * rejimida qurilgan va uni o'zgartirish marshrutlashga tegadi — shu
 * sababli tayyor `index.html` shu yerda to'g'irlanadi.
 *
 * Ishga tushirish (eksportdan KEYIN):
 *   node scripts/web-pwa.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const HTML = path.resolve('apps/mobile/dist-web/index.html');

const TEGLAR = `
    <link rel="manifest" href="/manifest.json"/>
    <meta name="theme-color" content="#050B1A"/>
    <!--
      Tizim paneli ranglari.

      O'rnatilgan ilovada Android'ning pastki paneli (uchta tugma) SUKUT
      bo'yicha OQ chiziladi — to'q dizayn ustida yorqin tasma bo'lib
      ko'rinadi. color-scheme: dark brauzerga sahifa to'q ekanini
      aytadi va u ikkala tizim panelini ham to'q rangga bo'yaydi.
    -->
    <meta name="color-scheme" content="dark"/>
    <meta name="mobile-web-app-capable" content="yes"/>
    <!-- iPhone Safari manifestni to'liq o'qimaydi — o'z teglari kerak -->
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
    <meta name="apple-mobile-web-app-title" content="ECWT"/>
    <link rel="apple-touch-icon" href="/pwa-192.png"/>
    <link rel="icon" href="/pwa-192.png" type="image/png"/>
    <meta name="description" content="Hunarmandlar uchun dunyo on-line savdosiga chiqish ilovasi"/>
    <style>:root{color-scheme:dark}html,body{background-color:#050B1A;margin:0}</style>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
      }
    </script>
`;

if (!fs.existsSync(HTML)) {
  console.error(`[web-pwa] topilmadi: ${HTML}\nAvval eksport qiling: pnpm --filter @ecwt/mobile build:web`);
  process.exit(1);
}

let html = fs.readFileSync(HTML, 'utf8');

if (html.includes('rel="manifest"')) {
  console.log('[web-pwa] allaqachon qo‘shilgan — o‘zgartirilmadi');
  process.exit(0);
}

// Ekran chetlarigacha chizilsin — ilova rejimida tepada oq chiziq qolmaydi
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, viewport-fit=cover"',
);

html = html.replace('<html lang="en">', '<html lang="uz">');
html = html.replace('</head>', `${TEGLAR}  </head>`);

fs.writeFileSync(HTML, html);
console.log('[web-pwa] index.html PWA uchun tayyorlandi');
