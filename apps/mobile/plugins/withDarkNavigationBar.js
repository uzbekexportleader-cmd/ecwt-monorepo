/**
 * Pastdagi Android navigatsiya panelini qorong'i qilib qo'yadi.
 *
 * MUAMMO
 * Ilova qorong'i (#050B1A), lekin telefon pastidagi tizim paneli —
 * orqaga / bosh sahifa / ilovalar tugmalari turgan qator — oq fonda
 * chiqardi va dizayn bilan urishardi.
 *
 * Sabab: `navigationBarColor` shaffof qilingan, ya'ni panel ilova
 * ustiga chizadi. Ammo Android tugmalarni QORA rangda chizadigan
 * rejimda turgani uchun (`windowLightNavigationBar` standart holatda
 * yoqilgan), ular qora fonda ko'rinmay qolmasin deb tizim o'zi ortiga
 * oq parda tortadi. Oq qator shundan paydo bo'ladi.
 *
 * YECHIM — ikki sozlama birga kerak:
 *
 *   windowLightNavigationBar = false
 *     Tugmalarni OQ rangda chizadi (qorong'i fon uchun). Busiz mavzu
 *     `DayNight` bo'lgani uchun telefon yorug' rejimda tursa tugmalar
 *     qora chiziladi.
 *
 *   enforceNavigationBarContrast = false
 *     Android 10 (API 29) dan beri tizim shaffof panel ortiga o'zi
 *     kontrast pardasi tortadi — aynan shu oq qatorni hosil qiladi.
 *     Faqat birinchi sozlama yetmaydi, pardani ham o'chirish shart.
 *
 * NEGA PLAGIN ORQALI
 * SDK 57 da `app.json` dagi `androidNavigationBar` sozlamasi olib
 * tashlangan (edge-to-edge bilan birga). `styles.xml` ni qo'lda
 * tahrirlash mumkin, lekin `expo prebuild` uni qayta yaratganda
 * o'zgarish yo'qoladi. Plagin esa har safar qayta qo'llanadi.
 */
const { withAndroidStyles } = require('expo/config-plugins');

module.exports = function withDarkNavigationBar(config) {
  return withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults;
    const appTheme = styles.resources.style?.find(
      (s) => s.$.name === 'AppTheme'
    );

    if (!appTheme) return cfg;

    const ITEMS = {
      'android:windowLightNavigationBar': 'false',
      'android:enforceNavigationBarContrast': 'false',
    };

    appTheme.item = appTheme.item.filter((i) => !(i.$.name in ITEMS));

    for (const [name, value] of Object.entries(ITEMS)) {
      appTheme.item.push({ $: { name }, _: value });
    }

    return cfg;
  });
};
