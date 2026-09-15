/**
 * Babel sozlamasi.
 *
 * Ikkala worklet kutubxonasi ham kerak — ular turli vazifani bajaradi:
 *
 *   react-native-worklets-core  — kamera kadrlarini alohida oqimda qayta
 *                                 ishlash (yuz aniqlash shu orqali ishlaydi);
 *   react-native-worklets       — `react-native-reanimated` 4 ning asosi.
 *                                 Reanimated ekranlar orasidagi animatsiyani
 *                                 boshqaradi.
 *
 * MUHIM: `react-native-worklets/plugin` ro'yxatda ENG OXIRIDA turishi shart —
 * reanimated shuni talab qiladi. U yo'q bo'lsa ilova animatsiya paytida
 * (masalan "orqaga" bosilganda) yiqiladi.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets-core/plugin', 'react-native-worklets/plugin'],
  };
};
