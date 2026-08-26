import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES, isLocale, resolveLocale } from '@/i18n/config';

const LOCALE_COOKIE = 'ecwt_locale';

/** Root layout `<html lang>` ni shu sarlavhadan o'qiydi */
export const LOCALE_HEADER = 'x-ecwt-locale';

/**
 * Til bo'yicha marshrutlash.
 *
 * `/xizmatlar` -> `/uz/xizmatlar` ga yo'naltiriladi.
 * Til tanlash tartibi: 1) cookie (foydalanuvchi o'zi tanlagani),
 * 2) brauzer tili, 3) o'zbekcha.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const localeInPath = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (localeInPath) {
    // Serverdagi komponentlar tilni sarlavhadan o'qiy olishi uchun
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, localeInPath);

    const response = NextResponse.next({ request: { headers } });

    // Keyingi tashrifda shu til ochilsin
    if (request.cookies.get(LOCALE_COOKIE)?.value !== localeInPath) {
      response.cookies.set(LOCALE_COOKIE, localeInPath, {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        path: '/',
      });
    }

    return response;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && isLocale(cookieLocale)
      ? cookieLocale
      : resolveLocale(request.headers.get('accept-language'));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  // Statik fayllar, API va Next ichki marshrutlariga tegmaymiz
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
