import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';

/**
 * Parol xeshlash. Argon2id — hozirgi tavsiya etilgan algoritm.
 * Parametrlar OWASP tavsiyasiga mos (19 MiB xotira, 2 iteratsiya).
 *
 * Butun ilovada parol bilan ishlash faqat shu yerda — algoritmni
 * almashtirish kerak bo'lsa, bitta fayl o'zgaradi.
 */
@Injectable()
export class PasswordService {
  private readonly options = {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  async hash(plain: string): Promise<string> {
    return hash(plain, this.options);
  }

  async verify(hashed: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashed, plain, this.options);
    } catch {
      // Buzilgan yoki eski formatdagi xesh — kirishga ruxsat bermaymiz
      return false;
    }
  }

  /**
   * Foydalanuvchi topilmaganda chaqiriladi: haqiqiy tekshiruv bilan bir xil
   * vaqt sarflaydi, shunda javob tezligiga qarab "bu email bormi?" degan
   * savolga javob olib bo'lmaydi (timing attack).
   *
   * Xesh birinchi chaqiruvda bir marta hisoblanadi va keshda qoladi.
   */
  async verifyDummy(plain: string): Promise<false> {
    await this.verify(await this.getDummyHash(), plain);
    return false;
  }

  private dummyHash: Promise<string> | null = null;

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hash(randomBytes(32).toString('hex'), this.options);
    return this.dummyHash;
  }
}
