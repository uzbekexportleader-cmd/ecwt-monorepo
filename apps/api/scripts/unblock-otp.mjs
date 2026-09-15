/**
 * Sinov paytida OTP cheklovi bloklab qo'ysa — shu skript uni ochadi.
 *   node scripts/unblock-otp.mjs [telefon]
 */
import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const phone = (process.argv[2] ?? '').replace(/\D/g, '');
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const res = phone
  ? await client.query('DELETE FROM "OtpRequest" WHERE phone = $1', [phone])
  : await client.query('DELETE FROM "OtpRequest"');
console.log(`[unblock] ${res.rowCount} ta OTP yozuvi o'chirildi${phone ? ` (${phone})` : ''}.`);
await client.end();
