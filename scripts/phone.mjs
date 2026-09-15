/**
 * ECWT — telefonda sinash uchun bitta buyruq.
 *
 *   pnpm phone
 *
 * Nima qiladi:
 *   1. Kompyuterning lokal tarmoq (LAN) IP manzilini topadi;
 *   2. Ma'lumotlar bazasini ko'taradi (PGlite);
 *   3. Backend'ni 0.0.0.0:4000 da ishga tushiradi (telefon kira oladi);
 *   4. Expo'ni LAN rejimida ochadi — terminalda QR kod chiqadi;
 *   5. Har 10 soniyada backend tirikligini tekshiradi va o'chib qolsa
 *      avtomatik qayta ko'taradi (telefonda sinash uzilib qolmasligi uchun).
 *
 * Backend ataylab "watch" rejimida ishlatilmaydi: Windows'da fayl o'zgarganda
 * qayta ishga tushish jarayonida `nest start --watch` halok bo'lishi mumkin,
 * bu esa telefonda "Serverga ulanib bo'lmadi" xatosini keltirib chiqaradi.
 */
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { networkInterfaces } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const pnpm = isWindows ? 'pnpm.cmd' : 'pnpm';

/* --------------------------- LAN IP ni topish --------------------------- */

function findLanIp() {
  const candidates = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      if (addr.address.startsWith('169.254.')) continue;
      // Virtual/VPN adapterlar telefon uchun yaramaydi
      if (/vEthernet|VirtualBox|VMware|Loopback|Tailscale|WSL|Hyper-V/i.test(name)) continue;
      candidates.push({ name, address: addr.address });
    }
  }
  const preferred =
    candidates.find((c) => c.address.startsWith('192.168.')) ??
    candidates.find((c) => c.address.startsWith('10.')) ??
    candidates[0];
  return preferred ?? null;
}

/* ------------------------------ yordamchilar ---------------------------- */

function checkPort(port, host = '127.0.0.1', timeoutMs = 2500) {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ port, host });
    const done = (ok) => {
      socket.destroy();
      resolvePromise(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function waitForPort(port, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await checkPort(port)) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

const children = new Map();
let stopping = false;

function prefixLines(prefix, text) {
  return (
    text
      .split('\n')
      .filter((l) => l.trim().length)
      .map((l) => `${prefix} ${l}`)
      .join('\n') + '\n'
  );
}

function run(label, args) {
  const child = spawn(pnpm, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  const prefix = `[${label}]`;
  child.stdout.on('data', (d) => process.stdout.write(prefixLines(prefix, d.toString())));
  child.stderr.on('data', (d) => process.stderr.write(prefixLines(prefix, d.toString())));
  children.set(label, child);
  return child;
}

/** Bir martalik buyruq (db:push, db:seed) — tugashini kutamiz. */
function once(args) {
  return new Promise((resolvePromise) => {
    const child = spawn(pnpm, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWindows,
      env: { ...process.env, FORCE_COLOR: '1' },
    });
    const lines = [];
    child.stdout.on('data', (d) => lines.push(d.toString()));
    child.stderr.on('data', (d) => lines.push(d.toString()));
    child.on('exit', (code) => {
      if (code !== 0) {
        process.stdout.write(prefixLines('[setup]', lines.join('')));
        console.warn(`[setup] "${args.join(' ')}" muvaffaqiyatsiz (kod ${code}) — davom etamiz.`);
      }
      resolvePromise(code === 0);
    });
  });
}

function shutdown() {
  stopping = true;
  for (const child of children.values()) {
    try {
      child.kill();
    } catch {
      /* allaqachon yopilgan */
    }
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/* --------------------------------- ish ---------------------------------- */

const lan = findLanIp();
const ip = lan?.address ?? 'localhost';

console.log('');
console.log('==============================================================');
console.log('  ECWT — telefonda sinash');
console.log('==============================================================');
console.log(`  Kompyuter IP manzili : ${ip}${lan ? `  (${lan.name})` : ''}`);
console.log(`  Backend              : http://${ip}:4000/api`);
console.log(`  Expo                 : exp://${ip}:8081`);
console.log('  Ilova API manzilini o‘zi shu IP dan oladi — sozlash shart emas.');
console.log('==============================================================');
console.log('');

if (!lan) {
  console.warn('DIQQAT: lokal tarmoq IP manzili topilmadi. Wi-Fi ga ulanganingizni tekshiring.\n');
}

console.log('[1/3] Ma’lumotlar bazasi ko‘tarilmoqda...');
run('db', ['--filter', '@ecwt/api', 'dev:db']);
if (!(await waitForPort(5432))) {
  console.error('Baza ochilmadi. 5432 portni boshqa dastur band qilmaganini tekshiring.');
  shutdown();
}
console.log('[1/3] Baza tayyor.');

// Sxema va demo ma'lumotlarni kafolatlaymiz (ikkalasi ham idempotent —
// mavjud ma'lumotni buzmaydi, faqat yetishmaganini qo'shadi).
console.log('      Sxema va demo ma’lumotlar tekshirilmoqda...');
await once(['--filter', '@ecwt/api', 'db:push']);
await once(['--filter', '@ecwt/api', 'db:seed']);

console.log('[2/3] Backend ishga tushmoqda (bir daqiqagacha vaqt olishi mumkin)...');
run('api', ['--filter', '@ecwt/api', 'dev:stable']);
if (!(await waitForPort(4000))) {
  console.error('Backend ochilmadi. Yuqoridagi [api] xabarlarini tekshiring.');
  shutdown();
}
console.log('[2/3] Backend tayyor.');

console.log('[3/3] Expo ishga tushmoqda — QR kod pastda chiqadi...');
console.log('');
run('expo', ['--filter', '@ecwt/mobile', 'exec', 'expo', 'start', '--host', 'lan']);

/* --------------------- backend uzilib qolsa tiklash --------------------- */

setInterval(async () => {
  if (stopping) return;
  const alive = await checkPort(4000);
  if (alive) return;
  console.warn('\n[nazorat] Backend javob bermayapti — qayta ishga tushirilmoqda...');
  try {
    children.get('api')?.kill();
  } catch {
    /* yopilgan */
  }
  run('api', ['--filter', '@ecwt/api', 'dev:stable']);
  if (await waitForPort(4000, 90_000)) {
    console.log('[nazorat] Backend tiklandi. Telefonda qayta urinib ko‘ring.\n');
  } else {
    console.error('[nazorat] Backend tiklanmadi.\n');
  }
}, 10_000);

/* ------------------------------ yo'riqnoma ------------------------------ */

setTimeout(() => {
  console.log('');
  console.log('--------------------------------------------------------------');
  console.log('  TELEFONDA NIMA QILISH KERAK');
  console.log('--------------------------------------------------------------');
  console.log('  1. Telefonga "Expo Go" ilovasini o‘rnating');
  console.log('     (Play Market yoki App Store).');
  console.log('  2. Telefon shu kompyuter bilan BITTA Wi-Fi da bo‘lsin');
  console.log('     (mobil internetni vaqtincha o‘chirib qo‘ying).');
  console.log('  3. Yuqoridagi QR kodni skanerlang:');
  console.log('     Android — Expo Go ichidagi "Scan QR code";');
  console.log('     iPhone  — oddiy Kamera ilovasi bilan.');
  console.log('');
  console.log('     QR kod ko‘rinmasa, Expo Go da "Enter URL manually" ni bosib');
  console.log(`     shu manzilni yozing:   exp://${ip}:8081`);
  console.log('');
  console.log('  4. Ilova ochilgach: telefon raqami → kod → ichkariga kirasiz.');
  console.log('     Sinov kodi ekranning pastida ko‘rsatiladi.');
  console.log('');
  console.log('  Tekshiruv: telefon brauzerida shu manzilni oching —');
  console.log(`  http://${ip}:4000/api/craft-categories`);
  console.log('  Ro‘yxat chiqsa, aloqa bor demakdir.');
  console.log('');
  console.log('  To‘xtatish: Ctrl+C');
  console.log('--------------------------------------------------------------');
  console.log('');
}, 14_000);
