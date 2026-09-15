/**
 * Build tugashini kutadi, tayyor APK ni yuklab olib joyiga qo'yadi.
 *
 * Nega kerak: bulutdagi build 20-35 daqiqa oladi. Bu skript uni kuzatib
 * turadi va tugashi bilan faylni `.apk/ecwt.apk` ga yozadi — ya'ni
 * `http://<IP>:8090/apk` manzili avtomatik yangilanadi.
 *
 * Ishga tushirish: node scripts/apk-auto.mjs <BUILD_ID>
 */
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const BUILD_ID = process.argv[2];
const APK_DIR = 'D:/ECWT MOBIL ILOVA/.apk';
const TARGET = `${APK_DIR}/ecwt.apk`;

/** Har shuncha vaqtda holat so'raladi */
const POLL_MS = 60_000;

const session = JSON.parse(fs.readFileSync(process.env.HOME + '/.expo/state.json', 'utf8')).auth
  .sessionSecret;

async function buildState() {
  const res = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'expo-session': session },
    body: JSON.stringify({
      query: `query($id: ID!){builds{byId(buildId:$id){status artifacts{applicationArchiveUrl}}}}`,
      variables: { id: BUILD_ID },
    }),
  });
  const data = await res.json();
  return data?.data?.builds?.byId ?? null;
}

console.log(`[apk-auto] build kuzatilmoqda: ${BUILD_ID}`);

for (;;) {
  let state = null;
  try {
    state = await buildState();
  } catch (e) {
    // Tarmoq uzilishi kuzatuvni to'xtatmasin
    console.log(`[apk-auto] holat so'ralmadi (${e.message}) — qayta urinamiz`);
  }

  if (state?.status === 'FINISHED') {
    const url = state.artifacts?.applicationArchiveUrl;
    if (!url) {
      console.log('[apk-auto] build tugadi, lekin fayl manzili yo‘q');
      break;
    }

    console.log('[apk-auto] build tugadi — yuklab olinmoqda...');
    const tmp = `${APK_DIR}/ecwt-yuklanmoqda.apk`;
    const res = await fetch(url);
    await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));

    // Eskisini saqlab qo'yamiz — kerak bo'lsa qaytish uchun
    // Proksi serveri eski faylni ushlab turishi mumkin — nom almashtirish
    // xato bersa ham yangi APK yo‘qolmasin
    try {
      if (fs.existsSync(TARGET)) fs.renameSync(TARGET, `${APK_DIR}/ecwt-oldingi.apk`);
    } catch {
      fs.rmSync(TARGET, { force: true });
    }
    fs.renameSync(tmp, TARGET);

    const mb = (fs.statSync(TARGET).size / 1024 / 1024).toFixed(0);
    console.log(`[apk-auto] TAYYOR — ${mb} MB, ${TARGET}`);
    break;
  }

  if (state?.status === 'ERRORED' || state?.status === 'CANCELED') {
    console.log(`[apk-auto] build muvaffaqiyatsiz: ${state.status}`);
    break;
  }

  await new Promise((r) => setTimeout(r, POLL_MS));
}
