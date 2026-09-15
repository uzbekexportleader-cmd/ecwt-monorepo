/**
 * Sinov uchun teskari proksi: Metro va API ni BITTA portga birlashtiradi.
 *
 * Nega kerak:
 *   Ilovani tashqi tunnel orqali ko'rsatishda ikkita alohida manzil kerak
 *   bo'lardi (biri ilova, biri API), va API manzili ilova ichiga qurilish
 *   vaqtida yozilgani uchun har safar Metro'ni qayta qurish talab qilinardi.
 *
 *   Bu proksi bilan bitta manzil yetarli:
 *     /api/*  → API serveri (4000)
 *     qolgani → Metro (8081)
 *
 *   Ilova o'zi ochilgan manzilni API manzili deb oladi (client.ts), shu
 *   sababli tunnel manzili o'zgarsa ham qayta qurish kerak emas.
 *
 * Ishga tushirish:  node scripts/dev-proxy.mjs
 * Sozlash:          PROXY_PORT, API_PORT, METRO_PORT
 */
import http from 'node:http';
import net from 'node:net';
import fs, { createReadStream, statSync } from 'node:fs';
import { resolve } from 'node:path';

const PROXY_PORT = Number(process.env.PROXY_PORT ?? 8090);
const API_PORT = Number(process.env.API_PORT ?? 4000);
const METRO_PORT = Number(process.env.METRO_PORT ?? 8081);

/**
 * Telefonga o'rnatiladigan APK.
 *
 * Expo serveridan yuklab olish sekin va uzilib qolishi mumkin (fayl
 * ~190 MB). Shu sababli fayl bir marta kompyuterga tushiriladi va shu
 * yerdan beriladi — telefon bilan bitta tarmoqda bo'lsa, yuklash bir
 * necha soniya oladi.
 */
const APK_PATH = resolve(process.cwd(), '.apk/ecwt.apk');

/** So'rov qaysi serverga tegishli ekanini aniqlaydi */
const targetPort = (url) => (url.startsWith('/api') ? API_PORT : METRO_PORT);

/** Javob shrift faylimi — turi yoki manzil kengaytmasi bo'yicha */
const isFont = (contentType, url) =>
  String(contentType ?? '').startsWith('font/') ||
  /\.(ttf|otf|woff2?|eot)(\?|$)/i.test(url);

const OPEN_PAGE = resolve(process.cwd(), '.apk/open.html');

const server = http.createServer((req, res) => {
  /*
   * Telefonda ilovani TO'G'RI manzil bilan ochadigan sahifa.
   *
   * Dev-client'da manzilni qo'lda terish xatoga olib keladi (bitta harf
   * yetmasa "Unable to load script" chiqadi). Bu sahifadagi tugma
   * ilovani kerakli manzil bilan o'zi ochadi.
   */
  if ((req.url ?? '').startsWith('/open')) {
    try {
      const html = fs.readFileSync(OPEN_PAGE);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Sahifa tayyor emas');
    }
    return;
  }

  // APK ni to'g'ridan-to'g'ri beramiz — Metro yoki API ga bormaydi
  if ((req.url ?? '').startsWith('/apk')) {
    let size;
    try {
      size = statSync(APK_PATH).size;
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('APK hali tayyor emas');
      return;
    }
    /*
     * Qismlab yuklashni qo'llab-quvvatlaymiz (`Range`).
     *
     * Fayl katta (~190 MB). Telefon ulanishi uzilsa, Android yuklashni
     * boshidan emas, to'xtagan joyidan davom ettira olishi kerak —
     * aks holda har uzilishda hammasi qaytadan boshlanadi.
     */
    const range = req.headers.range;
    const common = {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="ecwt.apk"',
      'Accept-Ranges': 'bytes',
    };

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Number(match[2]) : size - 1;

      if (start >= size || end >= size || start > end) {
        res.writeHead(416, { ...common, 'Content-Range': `bytes */${size}` });
        res.end();
        return;
      }

      res.writeHead(206, {
        ...common,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(end - start + 1),
      });
      createReadStream(APK_PATH, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, { ...common, 'Content-Length': String(size) });
    createReadStream(APK_PATH).pipe(res);
    return;
  }

  const port = targetPort(req.url ?? '/');
  const clientOrigin = req.headers.origin;

  /*
   * `Origin` sarlavhasini mahalliy manzilga almashtiramiz.
   *
   * Nega: Metro dev-serveri begona `Origin` bilan kelgan so'rovni himoya
   * maqsadida rad etadi (500). Brauzerning SHRIFT yuklovchisi esa har doim
   * shu sarlavhani yuboradi — natijada tunnel orqali ochilganda barcha
   * shrift va ikonkalar yuklanmay, matn kvadratchaga aylanardi.
   * Oddiy `fetch` bu sarlavhani yubormagani uchun muammo ko'rinmasdi.
   */
  const headers = { ...req.headers, host: `127.0.0.1:${port}` };
  if (clientOrigin) headers.origin = `http://localhost:${port}`;

  const proxied = http.request(
    {
      host: '127.0.0.1',
      port,
      method: req.method,
      path: req.url,
      headers,
    },
    (upstream) => {
      const resHeaders = { ...upstream.headers };

      // Javob CORS tekshiruvidan o'tsin (shrift yuklovchi shuni talab qiladi)
      if (clientOrigin) {
        resHeaders['access-control-allow-origin'] = clientOrigin;
        resHeaders['vary'] = 'Origin';
      }

      /*
       * Shriftlarni oraliq serverlar (masalan Cloudflare tunnel) siqib
       * yuborishini taqiqlaymiz.
       *
       * Nega: siqilgan shriftni `fetch` muammosiz oladi, lekin brauzerning
       * SHRIFT YUKLOVCHISI "network error" beradi — natijada ilovadagi
       * barcha matn va ikonkalar kvadratchaga aylanadi. `no-transform`
       * oraliq serverga javob mazmunini o'zgartirmaslikni bildiradi.
       */
      /*
       * `no-transform` — oraliq server (Cloudflare) shriftni siqib
       * buzmasin. Keshlash yo'q: sinov muhitida eskirgan yoki xato
       * javob brauzerda qolib ketmasligi muhimroq.
       */
      if (isFont(resHeaders['content-type'], req.url ?? '')) {
        resHeaders['cache-control'] = 'no-transform, no-cache';
      }

      res.writeHead(upstream.statusCode ?? 502, resHeaders);
      upstream.pipe(res);
    },
  );

  proxied.on('error', (err) => {
    // Nishon server o'chiq bo'lsa — tushunarli xato, proksi yiqilmaydi
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Proksi: ${port} portidagi serverga ulanib bo'lmadi (${err.code ?? err.message})`);
  });

  req.pipe(proxied);
});

/**
 * WebSocket ulanishlari (Metro HMR, tez yangilanish) ham o'tishi kerak —
 * aks holda ilova ochiladi-yu, kod o'zgarishi ko'rinmaydi.
 */
server.on('upgrade', (req, socket, head) => {
  const port = targetPort(req.url ?? '/');
  const upstream = net.connect(port, '127.0.0.1', () => {
    const headers = Object.entries(req.headers)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\r\n');
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
    if (head?.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });

  const close = () => {
    socket.destroy();
    upstream.destroy();
  };
  upstream.on('error', close);
  socket.on('error', close);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[ecwt-proxy] http://localhost:${PROXY_PORT} da ishlamoqda`);
  console.log(`[ecwt-proxy]   /api/*  → ${API_PORT}`);
  console.log(`[ecwt-proxy]   qolgani → ${METRO_PORT}`);
  console.log('[ecwt-proxy] To‘xtatish: Ctrl+C');
});
