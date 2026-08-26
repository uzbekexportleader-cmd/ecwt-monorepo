import type { JwtPayload } from '@ecwt/contracts';
import { AppError } from './errors';

/**
 * Hamkorga tegishli endpoint'larda ishlatiladi.
 *
 * Foydalanuvchining supplierId'si token ichida keladi — ya'ni klient
 * "men shu hamkorman" deb ayta olmaydi, faqat serverda imzolangan
 * token'dagi qiymat ishlatiladi.
 */
export function requireSupplierId(user: JwtPayload): string {
  if (!user.supplierId) {
    throw AppError.forbidden('Bu bo‘lim faqat hamkor akkauntlari uchun');
  }
  return user.supplierId;
}

/** Admin bo'lsa istalgan hamkor bilan, hamkor bo'lsa faqat o'zi bilan ishlaydi */
export function resolveSupplierScope(
  user: JwtPayload,
  requestedSupplierId: string | undefined,
): string | undefined {
  if (user.role === 'ADMIN' || user.role === 'STAFF') {
    return requestedSupplierId; // undefined bo'lsa — barcha hamkorlar
  }
  return requireSupplierId(user);
}
