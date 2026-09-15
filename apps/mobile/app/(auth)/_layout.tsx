import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Fon videosi navigatorning orqasida turadi (`VideoBackdropHost`) —
        // ekranlar uni yopib qo'ymasligi uchun fon shaffof.
        contentStyle: { backgroundColor: 'transparent' },
        /*
         * MUHIM: fon SHAFFOF bo'lgani uchun animatsiya ham `fade` bo'lishi
         * shart.
         *
         * Ildizdagi standart `slide_from_right` bilan ikki shaffof ekran
         * bir-birining ustidan sirpanadi va o'tish paytida IKKALASI ham
         * ko'rinib turadi — eski ekranning yarmi "qotib qolgandek"
         * tuyuladi. `fade` da esa fon joyida qoladi, faqat kontent
         * yumshoq almashadi.
         *
         * `(setup)` guruhida ham aynan shu sabab `fade` qo'yilgan.
         */
        animation: 'fade',
      }}
    />
  );
}
