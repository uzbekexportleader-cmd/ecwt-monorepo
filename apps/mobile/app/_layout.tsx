import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import type { Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NativeSplash from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { colors } from '../src/theme';
import { useAuthStore } from '../src/store/auth';
import { StartupSplash } from '../src/components/StartupSplash';
import { VideoBackdropHost } from '../src/components/VideoBackdropHost';
import { AiAssistantButton, ASSISTANT_NAME } from '../src/components/AiAssistantButton';
import { ToastHost } from '../src/components/Toast';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { APP_FONTS } from '../src/fonts';
import { restoreLocale } from '../src/store/locale';
import { RESET_ONBOARDING_ON_START, api } from '../src/api/client';
import { useJourney } from '../src/api/queries';
import { initMonitoring } from '../src/services/monitoring';
import { startAnalytics, track } from '../src/services/analytics';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

/*
 * Xatolarni kuzatish eng birinchi yoqiladi — ilova ishga tushishidagi
 * xatolar ham yozilishi uchun. DSN berilmagan bo'lsa hech narsa qilmaydi.
 */
initMonitoring();

/**
 * Splash videosining uzunligi: 8,04 soniya (`assets/video/splash-bg.mp4`).
 *
 * Splash odatda videoning HAQIQIY tugashini kutadi (`onVideoEnd`), chunki
 * video fayl yuklangach — ya'ni ilova ochilishidan kechroq — boshlanadi.
 *
 * Bu qiymat esa ZAXIRA: video umuman yuklanmasa (fayl buzuq, xotira
 * yetishmadi) ekran abadiy turib qolmasligi uchun.
 *
 * MUHIM: bu ZAXIRA chegara — oddiy holda splash video TUGAGANDA
 * yopiladi (videoDone), bu chegarada emas. Shu sababli u videodan
 * UZUNROQ bo'lishi kerak: splash videosi 8.04 soniya, ilgari bu yerda
 * 6 soniya turardi va video oxirigacha ko'rsatilmay kesilib qolardi.
 *
 * Boshqa tomoni ham bor: ilgari dev rejimda 45 soniya edi va video
 * yuklanmasa ilova yarim daqiqa splash'da qotib turardi. Shuning uchun
 * chegara video uzunligidan sal ko'p — ortiqcha emas.
 */
const VIDEO_FALLBACK_MS = 12_000;

/**
 * Splash ekranida eng ko'p shuncha turadi. Shrift yoki server javob
 * bermay qolsa ham foydalanuvchi qulflanib qolmaydi — ilova baribir
 * ochiladi.
 */
const MAX_SPLASH_MS = 15_000;

// Native splash'ni o'zimiz yopamiz — oq ekran chaqnab ketmasligi uchun
void NativeSplash.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

/**
 * Ishga tushish mantiqi.
 *
 *  A) Birinchi marta        → Xush kelibsiz → telefon → OTP → biometrika → sehrgar
 *  B) Kirgan + biometrika   → qulfni ochish → bosh sahifa
 *  C) Kirgan, biometrikasiz → bosh sahifa
 *  D) Sessiya tugagan       → telefon orqali kirish
 *  E) Sehrgar yarim yo'lda  → (kerak bo'lsa qulf) → qolgan savoldan davom
 */
function StartupGate({ children }: { children: React.ReactNode }) {
  // Shrift yuklanmay qolsa ham ilova ochilishi kerak — tizim shrifti bilan
  // bo'lsa ham. Aks holda bitta yuklanmagan fayl butun ilovani bloklaydi.
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);
  const [localeReady, setLocaleReady] = useState(false);


  // Saqlangan til (yoki qurilma tili) ilova ko'rinishidan oldin qo'llanadi
  useEffect(() => {
    void restoreLocale().finally(() => setLocaleReady(true));
  }, []);
  const {
    ready,
    user,
    seenWelcome,
    onboardingDone,
    onboardingChecked,
    biometricEnabled,
    unlocked,
    bootstrap,
    syncOnboarding,
  } = useAuthStore();

  /*
   * Hunarmand yo'li (tunnel).
   *
   * Anketa tugagach foydalanuvchi kabinetga TUSHMAYDI — mahsuloti
   * xalqaro savdoga chiqquncha qadamlardan o'tadi. Qaysi qadamdaligini
   * server aytadi.
   *
   * Faqat kirgan foydalanuvchida so'raladi: aks holda har ochilishda
   * keraksiz 401 ketardi.
   */
  const journey = useJourney(Boolean(user));

  const segments = useSegments();
  const router = useRouter();
  const [minTimePassed, setMinTimePassed] = useState(false);
  /**
   * Splash videosi oxirigacha o'ynab bo'ldimi.
   *
   * NEGA KERAK: zaxira taymer ilova OCHILGANDA boshlanadi, video esa
   * fayl yuklangach — ya'ni bir necha soniya KECHROQ. Sekin tarmoqda
   * (yoki dev tunnel orqali) taymer tugaganda video hali o'rtasida bo'ladi
   * va ekran yarmida uzilib qoladi.
   *
   * Shuning uchun haqiqiy tugash signalini kutamiz.
   */
  const [videoDone, setVideoDone] = useState(false);
  const [showApp, setShowApp] = useState(false);
  /** Splash ilova chizilgandan keyin ham qisqa muddat ustida turadi */
  const [splashMounted, setSplashMounted] = useState(true);
  const appOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /*
     * Sinov rejimida ilova HAR OCHILGANDA butunlay boshidan boshlanadi:
     * Xush kelibsiz → telefon → SMS → Face ID → qadamlar.
     *
     * Buning uchun sessiyani ham tozalash shart. Aks holda ilova
     * foydalanuvchini tanib qoladi va Xush kelibsiz hamda Face ID
     * ekranlarini o'tkazib, to'g'ridan-to'g'ri qadamlarga o'tadi —
     * ya'ni aynan sinalishi kerak bo'lgan qism ko'rinmay qoladi.
     */
    if (RESET_ONBOARDING_ON_START) {
      void useAuthStore.getState().resetForTesting().then(() => bootstrap());
    } else {
      void bootstrap();
    }

    const timer = setTimeout(() => setMinTimePassed(true), VIDEO_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [bootstrap]);

  /*
   * Xavfsizlik chegarasi: qanday sabab bo'lishidan qat'i nazar (sekin
   * tarmoq, yuklanmagan shrift, javob bermagan server) ilova splash
   * ekranida ABADIY qolib ketmasligi kerak. Shu vaqtdan keyin bor
   * narsa bilan ochiladi.
   */
  const [gaveUpWaiting, setGaveUpWaiting] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUpWaiting(true), MAX_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Shrift xatosi ham "tugadi" hisoblanadi — tizim shrifti bilan ochiladi
  const fontsSettled = fontsLoaded || fontError !== null;
  /*
   * Splash yopilishi uchun uch shart: sessiya tekshirildi, shrift/til
   * tayyor VA video oxirigacha o'ynadi.
   *
   * `minTimePassed` endi faqat ZAXIRA: video umuman yuklanmasa
   * (fayl buzuq, xotira yetmadi) ekran abadiy turib qolmasin.
   * `gaveUpWaiting` esa eng oxirgi chegara.
   */
  const splashShown = videoDone || minTimePassed;
  const startupDone = (ready && splashShown && fontsSettled && localeReady) || gaveUpWaiting;

  // Native splash'ni JS splash chizilgach yopamiz
  useEffect(() => {
    const timer = setTimeout(() => void NativeSplash.hideAsync().catch(() => undefined), 80);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Splash yumshoq so'nadi, so'ng ilova yumshoq paydo bo'ladi.
   * Ilova splash tugamaguncha umuman yuklanmaydi — shu sababli ortiqcha
   * so'rovlar ketmaydi va ekran "sakrab" o'zgarmaydi.
   */
  useEffect(() => {
    if (!startupDone) return;
    /*
     * Ilova DARHOL chiziladi — splash hali ustida turadi va uni yopib
     * turadi. Ilgari bu yerda 380 ms kutilardi va splash o'sha zahoti
     * yo'q bo'lardi: oralikda qora ekran ko'rinib, so'ng yozuvlar
     * birin-ketin paydo bo'lardi.
     */
    setShowApp(true);
    Animated.timing(appOpacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();

    // Splash so'nib bo'lgach (420 ms) uni olib tashlaymiz
    const timer = setTimeout(() => setSplashMounted(false), 700);
    return () => clearTimeout(timer);
  }, [startupDone, appOpacity]);

  /**
   * Kirgan foydalanuvchining bosqichini serverdan tekshiramiz.
   *
   * Oqim o'zgarganda telefondagi eski "tugadi" belgisi yangi qadamlarni
   * bosib o'tib yuborardi — endi so'nggi so'z serverda.
   */
  useEffect(() => {
    if (!user || onboardingChecked) return;
    let cancelled = false;
    void api.profile
      .get()
      .then(async (profile) => {
        if (cancelled) return;
        // Sinov rejimi: bosqichni birinchi qadamga qaytaramiz
        if (RESET_ONBOARDING_ON_START && profile.onboardingStage !== 'PERSONAL') {
          await api.profile.update({ onboardingStage: 'PERSONAL' }).catch(() => undefined);
        }
        const done = RESET_ONBOARDING_ON_START ? false : profile.onboardingStage === 'DONE';
        void syncOnboarding(done);
      })
      .catch(() => {
        // Server javob bermasa mahalliy belgiga tayanamiz — ilova qotib qolmasin
        if (!cancelled) void syncOnboarding(onboardingDone);
      });
    return () => {
      cancelled = true;
    };
  }, [user, onboardingChecked, onboardingDone, syncOnboarding]);

  useEffect(() => {
    if (!showApp) return;

    const group = segments[0];
    const path = segments.join('/');
    const inAuth = group === '(auth)';
    const inSetup = group === '(setup)';

    // D) Sessiya yo'q yoki tugagan
    if (!user) {
      /*
       * AI yordamchi kirishdan oldin ham ochiladi. Savolga javob bera
       * olmaydi — server so'rovi sessiya talab qiladi — lekin ekranning
       * o'zi buni tushuntiradi va ro'yxatdan o'tishga yo'naltiradi.
       * Busiz tugma bosilganda hech narsa bo'lmasdi.
       */
      if (path === 'assistant') return;

      if (!inAuth || path === '(auth)/lock') {
        router.replace(seenWelcome ? '/(auth)/phone' : '/(auth)/welcome');
      }
      return;
    }

    // B/E) Biometrika yoqilgan, lekin hali ochilmagan — qulf ekrani
    if (biometricEnabled && !unlocked) {
      if (path !== '(auth)/lock') router.replace('/(auth)/lock');
      return;
    }

    /*
     * Sozlamalar har qanday bosqichda ochiq turishi kerak — til almashtirish,
     * chiqish va hisob ma'lumotlari o'sha yerda. Busiz anketa davomida
     * quyidagi `!inSetup` sharti foydalanuvchini darhol anketaga qaytarib
     * yuborardi va tepadagi tishli g'ildirak tugmasi ishlamasdi.
     *
     * Qulf va sessiya tekshiruvlaridan KEYIN turibdi: qulflangan yoki
     * kirmagan foydalanuvchi bu yerga baribir yeta olmaydi.
     */
    if (path === 'settings') return;

    /*
     * AI yordamchi ham har bosqichda ochiq. Kirishdan oldin u savolga
     * javob bera olmaydi (server so'rovi sessiya talab qiladi) — ekranning
     * o'zi buni tushuntiradi. Muhimi, tugma bosilganda hech narsa
     * bo'lmasdan qolmasin.
     */
    if (path === 'assistant') return;

    // Yuz tekshiruvi va biometrikani sozlash ekranlari ro'yxatdan o'tishning
    // bir qismi — foydalanuvchi javob bermaguncha ularni bosib o'tmaymiz.
    if (
      path === '(auth)/face-id' ||
      path === '(auth)/biometric-setup' ||
      // Parol o'rnatish ham ro'yxatdan o'tishning bir qismi — o'tkazib yubormaymiz
      path === '(auth)/password-setup'
    ) {
      return;
    }

    // Server javobini kutamiz — noto'g'ri ekranga sakrab o'tmaylik
    if (!onboardingChecked) return;

    // E) Sehrgar tugatilmagan — qolgan savoldan davom
    if (!onboardingDone) {
      if (!inSetup) router.replace('/(setup)');
      return;
    }

    /*
     * F) Anketa tugadi, lekin yo'l hali tugamadi — tunnelga.
     *
     * Kabinet FAQAT mahsulot xalqaro savdoga chiqqach ochiladi
     * (`cabinetUnlocked`). Shu sababli kabinet ichidagi ekranga
     * tushib qolsa ham qaytarib olamiz.
     *
     * Yo'l javobi hali kelmagan bo'lsa hech qayerga sakramaymiz —
     * noto'g'ri ekran ko'rsatgandan ko'ra bir lahza kutgan yaxshi.
     */
    const inTabs = group === '(tabs)';
    if (journey.data && !journey.data.cabinetUnlocked) {
      if (inAuth || inSetup || inTabs || path === '') router.replace('/journey');
      return;
    }

    // C) Hammasi tayyor — bosh sahifa
    if (inAuth || inSetup || path === '') router.replace('/(tabs)');
  }, [
    showApp,
    user,
    seenWelcome,
    onboardingDone,
    onboardingChecked,
    biometricEnabled,
    unlocked,
    segments,
    router,
    journey.data,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/*
        Fon videosi navigatorning ORQASIDA, bir marta yaratiladi. Ekranlar
        uning ustidan surilib o'tadi — shu sababli ro'yxatdan o'tish yo'lida
        (oldinga ham, orqaga ham) video hech qachon uzilmaydi.

        `preload` — splash ko'rinib turganda ham video yuklanib, o'ynay
        boshlaydi (splash uni to'liq yopib turadi). Aks holda splash tugagach
        video noldan yuklanardi va ekran bir soniyaga bo'sh qolardi.
      */}
      <VideoBackdropHost preload={!showApp} />

      {showApp ? (
        <Animated.View style={{ flex: 1, opacity: appOpacity }}>{children}</Animated.View>
      ) : null}

      {/* Splash ilovaning USTIDA — u so'nguncha ostidagi ekran tayyor bo'ladi */}
      {splashMounted ? (
        <StartupSplash visible={!startupDone} onVideoEnd={() => setVideoDone(true)} />
      ) : null}
    </View>
  );
}

/** Fon videosi ustidagi guruhlar uchun shaffof fon */
const CLEAR = { backgroundColor: 'transparent' } as const;

/**
 * Navigatsiya mavzusi.
 *
 * React Navigation har bir ekranga o'z fonini chizadi va standart holatda u
 * OCH KULRANG (#F2F2F2) — u orqa fondagi videoni butunlay yopib qo'yardi.
 * `contentStyle` bu qatlamni hamma platformada bosa olmaydi, shu sababli
 * fonni mavzuning o'zida shaffof qilamiz. Eng orqada baribir ilovaning
 * `colors.bg` foni turadi, shu bois videosiz ekranlar o'zgarmaydi.
 */
const NAV_THEME: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent', card: colors.bg, text: colors.text },
};

/**
 * Ilova darajasidagi fon xizmatlari: analitika navbati va push.
 *
 * Alohida komponent — `RootLayout` ichida hook chaqirilsa, u provayderlar
 * (router, auth) tayyor bo'lishidan oldin ishga tushib qolardi.
 */
function AppServices() {
  usePushNotifications();

  useEffect(() => {
    track('app.opened');
    return startAnalytics();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <ToastHost />
          <OfflineBanner />
          <AppServices />
          <StartupGate>
            <ThemeProvider value={NAV_THEME}>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.bg },
                  headerTintColor: colors.text,
                  headerTitleStyle: { fontWeight: '600' },
                  headerShadowVisible: false,
                  /*
                    Barcha ekranlar SHAFFOF — fon videosi ilovaning hamma
                    betida ko'rinadi. Ilgari faqat ikki guruh istisno
                    qilingan edi va qolgan betlar (kabinet, profil) fonsiz
                    qolib, boshqa ilovaga tushgandek tuyulardi.

                    Shaffof ekranlarda animatsiya `fade` bo'lishi SHART:
                    `slide_from_right` bilan ikki shaffof ekran bir-birining
                    ustidan sirpanadi va o'tish paytida ikkalasi ham ko'rinib
                    turadi — ekranning yarmi qotib qolgandek tuyuladi.
                  */
                  contentStyle: CLEAR,
                  animation: 'fade',
                }}
              >
                {/*
                  Fon videosi ko'rinsin uchun bu ikki guruh SHAFFOF.
                  Shuning uchun animatsiya ham `fade` bo'lishi SHART:
                  ildizdagi `slide_from_right` bilan ikki shaffof ekran
                  bir-birining ustidan sirpanadi va o'tish paytida ikkalasi
                  ham ko'rinib turadi — ekranning yarmi qotib qolgandek
                  tuyuladi.
                */}
                <Stack.Screen
                  name="(auth)"
                  options={{ headerShown: false, contentStyle: CLEAR, animation: 'fade' }}
                />
                <Stack.Screen
                  name="(setup)"
                  options={{ headerShown: false, contentStyle: CLEAR, animation: 'fade' }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="subsidy/[id]" options={{ title: 'Subsidiya' }} />
                <Stack.Screen
                  name="subsidy/online-mahalla"
                  options={{ title: 'Subsidiyaga ariza', contentStyle: CLEAR }}
                />
                <Stack.Screen name="apply/[id]" options={{ title: 'Ariza berish' }} />
                <Stack.Screen name="applications/[id]" options={{ title: 'Ariza holati' }} />
                <Stack.Screen name="application" options={{ title: 'Ariza holati' }} />
                <Stack.Screen name="profile/anketa" options={{ title: 'Anketa' }} />
                <Stack.Screen name="profile/personal" options={{ title: 'Shaxsiy ma’lumotlar' }} />
                <Stack.Screen name="profile/craft" options={{ title: 'Hunar ma’lumotlari' }} />
                <Stack.Screen
                  name="profile/business"
                  options={{ title: 'Tadbirkorlik va a’zolik' }}
                />
                <Stack.Screen name="profile/bank" options={{ title: 'Bank rekvizitlari' }} />
                <Stack.Screen name="profile/documents" options={{ title: 'Hujjatlarim' }} />
                <Stack.Screen name="profile/verification" options={{ title: 'Tasdiqlash' }} />
                <Stack.Screen name="products/new" options={{ title: 'Mahsulot qo‘shish' }} />
                <Stack.Screen name="products/[id]" options={{ title: 'Mahsulot' }} />
                <Stack.Screen name="notifications" options={{ title: 'Bildirishnomalar' }} />
                <Stack.Screen name="assistant" options={{ title: ASSISTANT_NAME, contentStyle: CLEAR }} />
                <Stack.Screen name="services" options={{ title: 'ECWT xizmatlari' }} />
                <Stack.Screen name="about" options={{ title: 'Biz haqimizda', contentStyle: CLEAR }} />
                <Stack.Screen name="payment" options={{ title: 'Xizmat to‘lovi', contentStyle: CLEAR }} />
                <Stack.Screen name="contract" options={{ title: 'Shartnoma', contentStyle: CLEAR }} />
                <Stack.Screen name="earnings" options={{ title: 'Hisob-kitob', contentStyle: CLEAR }} />
                <Stack.Screen name="content" options={{ title: 'Xalqaro e‘lon', contentStyle: CLEAR }} />
                <Stack.Screen name="listing" options={{ title: 'Joylashtirish', contentStyle: CLEAR }} />
                {/* Tunnel: orqaga qaytarib yuboradigan sarlavha kerak emas */}
                <Stack.Screen
                  name="journey"
                  options={{ title: 'Sizning yo‘lingiz', headerBackVisible: false, contentStyle: CLEAR }}
                />
                <Stack.Screen name="settings" options={{ title: 'Sozlamalar' }} />
                <Stack.Screen name="security" options={{ title: 'Xavfsizlik' }} />
              </Stack>

              {/*
                AI yordamchi navigatordan TASHQARIDA: ekran almashganda
                yo'qolmaydi va har bir ekranga alohida qo'shish kerak emas.
              */}
              <AiAssistantButton />
            </ThemeProvider>
          </StartupGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
