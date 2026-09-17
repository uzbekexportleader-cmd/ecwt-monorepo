#!/usr/bin/env node
/**
 * Hunarmandlar arizalarini kompyuterga yuklab oladi.
 *
 * Har bir odam uchun alohida papka ochiladi va uning F.I.Sh. bilan
 * nomlanadi. Ichida: o'qish uchun qulay matn, to'liq JSON va yuklangan
 * hujjatlar.
 *
 *   D:\ECWT-arizalar\
 *     Tolipov Asror Ubaydulla o'g'li\
 *       malumotlar.txt        ← ko'z bilan o'qish uchun
 *       malumotlar.json       ← dastur uchun (to'liq)
 *       hujjatlar\
 *         pasport.jpg
 *         imzolangan-shartnoma.pdf
 *
 * ISHLATISH
 *   node scripts/arizalarni-yuklash.mjs
 *
 * Kirish ma'lumotlari birinchi marta so'raladi va shu kompyuterda
 * saqlanadi (`.ecwt-yuklash.json`), keyingi safar so'ralmaydi.
 *
 * DIQQAT: bu fayllar ichida JShShIR, pasport va bank raqamlari bo'ladi.
 * Papkani boshqa odam ochib ko'ra olmasligiga ishonch hosil qiling.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOZLAMA_FAYL = join(HERE, '..', '.ecwt-yuklash.json');

/** Arizalar shu papkaga tushadi */
const STANDART_PAPKA = 'D:\\ECWT-arizalar';
const STANDART_API = 'https://mobil.ecwt.uz/api';

/* --------------------------- sozlamalar --------------------------- */

async function sozlamalarniOl() {
  /*
   * Muhit o'zgaruvchilari berilgan bo'lsa savol berilmaydi — rejaga
   * qo'yib avtomatik ishga tushirish uchun kerak.
   */
  if (process.env.ECWT_PAROL) {
    return {
      phone: (process.env.ECWT_TELEFON ?? '').replace(/\D/g, ''),
      password: process.env.ECWT_PAROL,
      papka: process.env.ECWT_PAPKA ?? STANDART_PAPKA,
      apiUrl: process.env.ECWT_API ?? STANDART_API,
    };
  }

  if (existsSync(SOZLAMA_FAYL)) {
    return JSON.parse(await readFile(SOZLAMA_FAYL, 'utf8'));
  }

  const rl = createInterface({ input: stdin, output: stdout });
  console.log('\nBirinchi ishga tushirish — kirish ma\u2019lumotlari so\u2019raladi.\n');

  const phone = await rl.question('Admin telefon raqami (998...): ');
  const password = await rl.question('Parol: ');
  const papka = (await rl.question(`Papka [${STANDART_PAPKA}]: `)) || STANDART_PAPKA;
  const apiUrl = (await rl.question(`Server [${STANDART_API}]: `)) || STANDART_API;
  rl.close();

  const sozlama = { phone: phone.replace(/\D/g, ''), password, papka, apiUrl };
  await writeFile(SOZLAMA_FAYL, JSON.stringify(sozlama, null, 2), 'utf8');
  console.log(`\nSaqlandi: ${SOZLAMA_FAYL}\n`);
  return sozlama;
}

/* ----------------------------- server ------------------------------ */

async function kirish({ apiUrl, phone, password }) {
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  if (!res.ok) {
    throw new Error(`Kirish muvaffaqiyatsiz (${res.status}). Telefon yoki parolni tekshiring.`);
  }
  const data = await res.json();
  return data.accessToken ?? data.token;
}

async function soraOl(apiUrl, token, yol) {
  const res = await fetch(`${apiUrl}${yol}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${yol} → ${res.status}`);
  return res.json();
}

/* ------------------------- papka va fayl --------------------------- */

/** Windows papka nomida ishlatib bo'lmaydigan belgilarni almashtiradi */
function papkaNomi(fullName, phone) {
  const toza = (fullName || '').replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim();
  // Ismi yo'q bo'lsa telefon raqami bilan nomlanadi — papka nomsiz qolmaydi
  return toza || `Nomsiz ${phone}`;
}

function matnKorinishi(k) {
  const p = k.profile ?? {};
  const q = [];
  const qator = (nom, qiymat) => {
    if (qiymat !== null && qiymat !== undefined && qiymat !== '') q.push(`${nom}: ${qiymat}`);
  };

  q.push('=== SHAXSIY MA\u2019LUMOTLAR ===');
  qator('F.I.Sh.', k.fullName);
  qator('Telefon', k.phone);
  qator('Aloqa telefoni', p.contactPhone);
  qator('Tug\u2018ilgan sana', p.birthDate?.slice?.(0, 10) ?? p.birthDate);
  qator('Jinsi', p.gender === 'MALE' ? 'Erkak' : p.gender === 'FEMALE' ? 'Ayol' : null);
  qator('JShShIR', p.pinfl);
  qator('Pasport', [p.passportSeries, p.passportNumber].filter(Boolean).join(' '));

  q.push('', '=== MANZIL ===');
  qator('Viloyat', p.region);
  qator('Tuman', p.district);
  qator('Mahalla', p.mahalla);
  qator('Ko\u2018cha', p.street);
  qator('Uy', p.houseNumber);
  if (p.latitude != null && p.longitude != null) {
    qator('GPS', `${p.latitude}, ${p.longitude}`);
    qator('Xaritada', `https://maps.google.com/?q=${p.latitude},${p.longitude}`);
  }

  q.push('', '=== FAOLIYAT ===');
  qator('Faoliyat turi', p.activityType);
  qator('Hunar', p.craftCategory?.nameUz ?? p.craft);
  qator('Tajriba (yil)', p.yearsOfExperience);
  qator('Ustaxona', p.workshopAddress);
  qator('To\u2018lov usuli', p.paymentMethod === 'SELF' ? 'O\u2018zi to\u2018laydi' : p.paymentMethod);

  q.push('', '=== TADBIRKORLIK VA BANK ===');
  qator('STIR', p.stir);
  qator('Tashkilot', p.organizationName);
  qator('Hisob raqami', p.bankAccount);
  qator('MFO', p.bankMfo);
  qator('Bank', p.bankName);
  qator('SWIFT', p.bankSwift);

  q.push('', '=== HOLAT ===');
  qator('Ro\u2018yxatdan o\u2018tgan', k.createdAt?.slice(0, 19).replace('T', ' '));
  qator('Oxirgi kirish', k.lastLoginAt?.slice(0, 19).replace('T', ' '));
  qator('Anketa to\u2018ldirilgan', p.completionPercent != null ? `${p.completionPercent}%` : null);
  qator('Bosqich', p.onboardingStage);
  qator('Hujjatlar soni', (k.documents ?? []).length);

  return q.join('\r\n');
}

async function hujjatlarniYukla(apiUrl, token, hujjatlar, papka) {
  if (!hujjatlar?.length) return 0;
  const yol = join(papka, 'hujjatlar');
  await mkdir(yol, { recursive: true });

  let soni = 0;
  for (const h of hujjatlar) {
    const nom = (h.fileName || `${h.type}-${h.id}`).replace(/[<>:"/\\|?*]/g, '_');
    const fayl = join(yol, nom);
    // Allaqachon yuklangan bo'lsa qayta yuklamaymiz — takroriy ishga
    // tushirish tez bo'lsin
    if (existsSync(fayl)) continue;

    try {
      const res = await fetch(`${apiUrl}/documents/${h.id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;
      await writeFile(fayl, Buffer.from(await res.arrayBuffer()));
      soni++;
    } catch {
      // Bitta hujjat tushmasa ham qolganlari yuklanaveradi
    }
  }
  return soni;
}

/* ------------------------------ asosiy ----------------------------- */

const sozlama = await sozlamalarniOl();
const { apiUrl, papka } = sozlama;

console.log('Serverga ulanmoqda...');
const token = await kirish(sozlama);

await mkdir(papka, { recursive: true });

let sahifa = 1;
let jami = 0;
let yangi = 0;

for (;;) {
  const royxat = await soraOl(apiUrl, token, `/admin/users?page=${sahifa}&pageSize=50`);
  const odamlar = royxat.items ?? [];
  if (!odamlar.length) break;

  for (const odam of odamlar) {
    jami++;
    // Niqoblanmagan kartochka: JShShIR va pasport to'liq keladi.
    // Bu yo'l faqat bosh adminga ochiq va har murojaat audit jurnaliga tushadi.
    const kartochka = await soraOl(apiUrl, token, `/admin/users/${odam.id}/export`);
    const nom = papkaNomi(kartochka.fullName, kartochka.phone);
    const yol = join(papka, nom);
    await mkdir(yol, { recursive: true });

    await writeFile(join(yol, 'malumotlar.txt'), matnKorinishi(kartochka), 'utf8');
    await writeFile(
      join(yol, 'malumotlar.json'),
      JSON.stringify(kartochka, null, 2),
      'utf8',
    );

    const hujjat = await hujjatlarniYukla(apiUrl, token, kartochka.documents, yol);
    yangi += hujjat;
    console.log(`  ✓ ${nom}${hujjat ? ` (+${hujjat} hujjat)` : ''}`);
  }

  if (odamlar.length < 50) break;
  sahifa++;
}

console.log(`\nTayyor. ${jami} ta ariza, ${yangi} ta yangi hujjat.`);
console.log(`Papka: ${papka}\n`);
