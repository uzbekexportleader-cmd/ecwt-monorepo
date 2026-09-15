/**
 * Sinov tunnellarini ishga tushiradi va uzilsa QAYTA TIKLAYDI.
 *
 * Ikkita tunnel bir vaqtda ishlaydi, ikkalasi ham `dev-proxy` portiga:
 *
 *   ngrok      — DOIMIY manzil. Telefondagi APK shu manzilni ishlatadi,
 *                shuning uchun u hech qachon o'zgarmasligi shart.
 *   cloudflare — brauzer havolasi. Manzil har safar yangi bo'ladi, lekin
 *                ngrok'dagi kabi ogohlantirish sahifasi chiqmaydi —
 *                investorlarga ko'rsatish uchun toza.
 *
 * Nega kerak: bepul tunnellar internet uzilganda yoki kompyuter uxlaganda
 * o'ladi va o'zi tiklanmaydi. Bu skript ularni kuzatib turadi.
 *
 * Ishga tushirish: node scripts/tunnels.mjs
 */
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PROXY_PORT ?? 8090);

/** Uzilgandan keyin qayta urinishgacha kutish (ms) */
const RESTART_DELAY = 5000;

/** Manzilni chiqarib olish uchun naqshlar */
const URL_PATTERN = /https:\/\/[a-zA-Z0-9.-]+\.(?:ngrok-free\.(?:dev|app)|trycloudflare\.com)/;

/**
 * Bitta tunnelni ishga tushiradi va o'lsa qayta ko'taradi.
 * `onUrl` — manzil topilganda chaqiriladi (har tiklanishda yangisi bo'lishi mumkin).
 */
function keepAlive(name, command, args, onUrl) {
  let lastUrl = null;

  const start = () => {
    const child = spawn(command, args, { shell: true });

    const scan = (chunk) => {
      const match = URL_PATTERN.exec(String(chunk));
      if (match && match[0] !== lastUrl) {
        lastUrl = match[0];
        onUrl(lastUrl);
      }
    };

    child.stdout.on('data', scan);
    child.stderr.on('data', scan);

    child.on('exit', (code) => {
      console.log(`[${name}] to‘xtadi (kod ${code}) — ${RESTART_DELAY / 1000}s dan keyin qayta ishga tushadi`);
      setTimeout(start, RESTART_DELAY);
    });
  };

  start();
}

console.log(`[tunnels] proksi porti: ${PORT}\n`);

keepAlive('ngrok', 'npx', ['--yes', 'ngrok@latest', 'http', String(PORT), '--log', 'stdout'], (url) => {
  console.log(`[ngrok]      ${url}   ← APK shu manzilni ishlatadi (doimiy)`);
});

keepAlive('cloudflare', 'npx', ['--yes', 'cloudflared', 'tunnel', '--url', `http://localhost:${PORT}`], (url) => {
  console.log(`[cloudflare] ${url}   ← brauzer havolasi (ogohlantirishsiz)`);
});
