/**
 * Eskiz ulanishini bir martalik tekshirish.
 *
 * Nega alohida skript: Eskiz test rejimida faqat o'zi tasdiqlagan uchta
 * matnni yuboradi va ularda `{code}` yo'q. Ilovaning `SMS_OTP_TEMPLATE`
 * sozlamasi esa `{code}` ni SHART qiladi — to'g'ri qilingan, chunki kodsiz
 * OTP ma'nosiz. Shuning uchun test rejimini ilova sozlamasini buzmasdan,
 * shu yerdan tekshiramiz.
 *
 * Adapter (eskiz.provider.ts) bilan bir xil chaqiruvlarni qiladi:
 * /auth/login -> token, keyin /message/sms/send.
 *
 * Ishlatish:
 *   node apps/api/scripts/sms-test.mjs
 *   node apps/api/scripts/sms-test.mjs 977115177 "Bu Eskiz dan test"
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, '..', '.env');

/** .env ni o'qish — qo'shimcha kutubxonasiz, oddiy KEY=VALUE */
function readEnv(path) {
  const out = {};

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Qo'shtirnoq ichida bo'lsa — olib tashlaymiz
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

const env = readEnv(envPath);
const base = (env.SMS_API_URL || 'https://notify.eskiz.uz/api').replace(/\/+$/, '');

// Raqam: argument bo'lmasa .env dan, u ham bo'lmasa — xato
const rawPhone = process.argv[2] || env.SMS_TEST_PHONE || '';
const phone = rawPhone.replace(/\D/g, '');
const text = process.argv[3] || 'Bu Eskiz dan test';

if (!phone) {
  console.error('Raqam berilmadi. Namuna: node apps/api/scripts/sms-test.mjs 977115177');
  process.exit(1);
}

/** Javob JSON bo'lmasligi mumkin — yiqilmaymiz */
async function readBody(response) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}

async function getToken() {
  if (env.SMS_API_TOKEN) {
    console.log('Token: .env dan olindi (login o‘tkazilmadi)');
    return env.SMS_API_TOKEN;
  }

  if (!env.SMS_API_EMAIL || !env.SMS_API_PASSWORD) {
    console.error('.env da SMS_API_EMAIL va SMS_API_PASSWORD (yoki SMS_API_TOKEN) yo‘q');
    process.exit(1);
  }

  const form = new FormData();
  form.append('email', env.SMS_API_EMAIL);
  form.append('password', env.SMS_API_PASSWORD);

  const response = await fetch(`${base}/auth/login`, { method: 'POST', body: form });
  const body = await readBody(response);

  if (!response.ok) {
    console.error(`Login muvaffaqiyatsiz (${response.status}):`, JSON.stringify(body, null, 2));
    process.exit(1);
  }

  const token = body?.data?.token ?? body?.token;

  if (!token) {
    console.error('Login javobida token yo‘q:', JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log('Login: muvaffaqiyatli, token olindi');
  return token;
}

const token = await getToken();

const form = new FormData();
form.append('mobile_phone', phone);
form.append('message', text);
form.append('from', env.SMS_SENDER || '4546');

console.log(`Yuborilmoqda: +${phone} <- "${text}"`);

const response = await fetch(`${base}/message/sms/send`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});

const body = await readBody(response);

if (!response.ok) {
  console.error(`\n❌ Yuborilmadi (${response.status}):`);
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log('\n✅ Eskiz qabul qildi:');
console.log(JSON.stringify(body, null, 2));
console.log('\nEndi telefonni tekshiring. SMS kelmasa — kabinetdagi "Hisobot"da holatga qarang.');
