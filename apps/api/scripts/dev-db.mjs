/**
 * Lokal development uchun PostgreSQL.
 *
 * Mashinada Postgres yoki Docker bo'lmasa ham ishlaydi: PGlite (WASM Postgres)
 * ni real Postgres wire protokoli bilan TCP portda ochamiz. Prisma oddiy
 * Postgres serverga ulangandek ishlaydi.
 *
 * Productionda bu skript ishlatilmaydi — DATABASE_URL real serverga qaratiladi.
 */
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '../.pgdata2');
const port = Number(process.env.DEV_DB_PORT ?? 5432);

/**
 * Ma'lumotlar papkasi buzilgan bo'lsa (masalan jarayon majburan to'xtatilgan
 * bo'lsa), PGlite ochilmaydi. Bunday holatda papkani chetga surib, toza
 * bazadan boshlaymiz — dev muhitida bu ma'lumot yo'qotish emas, chunki
 * `pnpm db:push && pnpm db:seed` uni qayta to'ldiradi.
 */
async function openDatabase() {
  mkdirSync(dataDir, { recursive: true });
  try {
    return { db: await PGlite.create(dataDir), recovered: false };
  } catch (error) {
    console.warn('[ecwt-db] Baza papkasi ochilmadi:', error?.message ?? error);
    if (existsSync(dataDir)) {
      const backup = `${dataDir}.buzilgan-${Date.now()}`;
      try {
        renameSync(dataDir, backup);
        console.warn(`[ecwt-db] Eski papka chetga surildi: ${backup}`);
      } catch (renameError) {
        console.error('[ecwt-db] Papkani surib bo‘lmadi:', renameError?.message ?? renameError);
        throw error;
      }
    }
    mkdirSync(dataDir, { recursive: true });
    return { db: await PGlite.create(dataDir), recovered: true };
  }
}

const { db, recovered } = await openDatabase();
// Faqat lokal ulanish: bazaga tashqaridan kirish kerak emas (API shu mashinada).
// maxConnections default 1 — u holda backend ishlab turganda seed/migration
// ulana olmaydi. So'rovlar baza darajasida navbatga qo'yiladi, shuning uchun
// bir nechta ulanish xavfsiz.
const server = new PGLiteSocketServer({
  db,
  port,
  host: '127.0.0.1',
  maxConnections: Number(process.env.DEV_DB_MAX_CONNECTIONS ?? 20),
});

await server.start();

console.log(`[ecwt-db] PGlite Postgres 127.0.0.1:${port} da ishlamoqda`);
console.log(`[ecwt-db] Ma'lumotlar: ${dataDir}`);
if (recovered) {
  console.warn('[ecwt-db] Baza tozadan yaratildi — sxema va demo ma’lumotlar qayta yoziladi.');
}
console.log('[ecwt-db] To‘xtatish: Ctrl+C');

let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  console.log('\n[ecwt-db] to‘xtatilmoqda...');
  try {
    await server.stop();
    await db.close();
  } catch {
    /* yopilish paytidagi xatolar muhim emas */
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
if (process.platform === 'win32') process.on('SIGBREAK', shutdown);
