/*
 * Eng sodda service worker.
 *
 * Nima uchun kerak: brauzer ilovani "o'rnatish" taklifini FAQAT
 * manifest va ishlaydigan service worker bo'lganda ko'rsatadi.
 *
 * Ataylab keshlamaydi: ilova serverdagi ma'lumot bilan ishlaydi va eski
 * nusxa ko'rsatilsa chalkashlik chiqadi. Vazifasi shunchaki "o'rnatsa
 * bo'ladi" degan shartni bajarish.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
