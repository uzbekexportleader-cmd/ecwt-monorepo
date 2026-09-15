import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import type { AuthResponse, SessionUser } from '@ecwt/types';

import { api, EcwtApiError, setSessionExpiredHandler, tokenStorage } from '../api/client';
import { isBiometricEnabled, setBiometricEnabled as persistBiometric } from '../services/biometrics';
import { getLastRegisteredToken, unregisterPushToken } from '../services/push';
import { setMonitoringUser } from '../services/monitoring';
import { useOnboarding } from './onboarding';

/* ------------------------- lokal bayroqlar ----------------------------- */

const KEY_WELCOME = 'ecwt.seenWelcome';
const KEY_ONBOARDING_DONE = 'ecwt.onboardingDone';
const KEY_ONBOARDING_STEP = 'ecwt.onboardingStep';

const isWeb = Platform.OS === 'web';
const memory = new Map<string, string>();

async function readFlag(key: string): Promise<string | null> {
  if (isWeb) return memory.get(key) ?? null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeFlag(key: string, value: string | null): Promise<void> {
  if (isWeb) {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
    return;
  }
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    /* xotira mavjud emas */
  }
}

/* ------------------------------- store --------------------------------- */

interface AuthState {
  /** Startup tekshiruvi tugadimi (splash shu paytgacha turadi) */
  ready: boolean;
  user: SessionUser | null;

  /** "Xush kelibsiz" ekrani ko'rsatilganmi */
  seenWelcome: boolean;
  /** Profil sehrgari to'liq tugatilganmi */
  onboardingDone: boolean;
  /** Serverdagi bosqich tekshirilganmi — tekshirilmaguncha yo'naltirmaymiz */
  onboardingChecked: boolean;
  /** Sehrgar qaysi qadamda to'xtagan (yarim yo'lda davom ettirish uchun) */
  onboardingStep: number;

  /** Biometrik kirish yoqilganmi */
  biometricEnabled: boolean;
  /** Shu ishga tushirishda biometrika bilan ochilganmi */
  unlocked: boolean;

  bootstrap: () => Promise<void>;
  applyAuth: (auth: AuthResponse) => Promise<void>;
  setUser: (user: SessionUser | null) => void;

  markWelcomeSeen: () => Promise<void>;
  resetForTesting: () => Promise<void>;
  saveOnboardingStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  /** Serverdagi bosqichga qarab belgini yangilaydi */
  syncOnboarding: (done: boolean) => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  unlock: () => void;

  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  user: null,
  seenWelcome: false,
  onboardingDone: false,
  onboardingChecked: false,
  onboardingStep: 0,
  biometricEnabled: false,
  unlocked: false,

  /**
   * Ilova ishga tushganda: saqlangan bayroqlar o'qiladi va sessiya tiklanadi.
   * Splash ekran shu ish tugagunicha (va kamida 2 soniya) turadi.
   */
  async bootstrap() {
    const [seenWelcome, onboardingDone, stepRaw, biometricEnabled] = await Promise.all([
      readFlag(KEY_WELCOME),
      readFlag(KEY_ONBOARDING_DONE),
      readFlag(KEY_ONBOARDING_STEP),
      isBiometricEnabled(),
    ]);

    set({
      seenWelcome: seenWelcome === '1',
      onboardingDone: onboardingDone === '1',
      onboardingStep: Number(stepRaw ?? 0) || 0,
      biometricEnabled,
    });

    try {
      const access = await tokenStorage.getAccessToken();
      const refresh = await tokenStorage.getRefreshToken();
      if (!access && !refresh) {
        set({ user: null, ready: true });
        return;
      }
      const user = await api.me.get();
      set({ user, ready: true });
    } catch (e) {
      /*
       * Tarmoq xatosi bilan autentifikatsiya xatosini FARQLAYMIZ.
       *
       * Ilgari ikkalasida ham token o'chirilardi — ya'ni internet bir
       * lahzaga uzilsa, amaldagi token yo'qolib, foydalanuvchi SMS orqali
       * qaytadan kirishga majbur bo'lardi. Endi tokenlar faqat server
       * "sen kim ekanligingni tanimadim" degandagina tozalanadi.
       */
      const isNetworkError = e instanceof EcwtApiError && e.code === 'NETWORK_ERROR';
      if (!isNetworkError) await tokenStorage.clear();
      set({ user: null, ready: true });
    }
  },

  async applyAuth(auth) {
    await tokenStorage.setTokens(auth);
    // Sentry'da xato qaysi foydalanuvchida yuz berganini bilish uchun —
    // faqat ID, telefon va ism yuborilmaydi
    setMonitoringUser(auth.user.id);
    set({ user: auth.user, unlocked: true });
  },

  setUser: (user) => {
    setMonitoringUser(user?.id ?? null);
    set({ user });
  },

  async markWelcomeSeen() {
    await writeFlag(KEY_WELCOME, '1');
    set({ seenWelcome: true });
  },

  async saveOnboardingStep(step) {
    await writeFlag(KEY_ONBOARDING_STEP, String(step));
    set({ onboardingStep: step });
  },

  async completeOnboarding() {
    await writeFlag(KEY_ONBOARDING_DONE, '1');
    await writeFlag(KEY_ONBOARDING_STEP, null);
    set({ onboardingDone: true, onboardingStep: 0, onboardingChecked: true });
  },

  /**
   * Ro'yxatdan o'tish tugagan-tugamaganini SERVER hal qiladi.
   *
   * Telefondagi belgi eskirib qolishi mumkin: oqim o'zgarsa yoki foydalanuvchi
   * boshqa qurilmada davom etsa. Shu sababli haqiqat manbai — serverdagi
   * bosqich, mahalliy belgi esa faqat tezkor javob uchun saqlanadi.
   */
  async syncOnboarding(done) {
    await writeFlag(KEY_ONBOARDING_DONE, done ? '1' : null);
    set({ onboardingDone: done, onboardingChecked: true });
  },

  async setBiometricEnabled(enabled) {
    await persistBiometric(enabled);
    set({ biometricEnabled: enabled, unlocked: enabled ? true : get().unlocked });
  },

  unlock: () => set({ unlocked: true }),

  /**
   * Chiqish: access va refresh tokenlar o'chiriladi, biometrik himoyalangan
   * sessiya yopiladi. Biometrik sozlama ham o'chadi — chunki u aynan shu
   * sessiyani himoya qilar edi.
   */
  /**
   * Sinov uchun: ilovani birinchi marta o'rnatilgandek holatga qaytaradi.
   *
   * Oddiy `logout()` "Xush kelibsiz ko'rildi" belgisini saqlab qoladi —
   * bu ataylab shunday (haqiqiy foydalanuvchi qayta-qayta reklama ekranini
   * ko'rmasin). Sinov paytida esa butun oqimni — Xush kelibsizdan boshlab —
   * qayta ko'rish kerak bo'ladi, shu uchun alohida amal.
   */
  async resetForTesting() {
    await get().logout();
    await writeFlag(KEY_WELCOME, null);
    set({ seenWelcome: false });
  },

  async logout() {
    /*
     * Qurilmani push ro'yxatidan chiqaramiz — aks holda shu telefonga
     * chiqib ketgan foydalanuvchining arizalari haqida push kelaverardi
     * (va uni endi boshqa odam o'qishi mumkin).
     */
    await unregisterPushToken(getLastRegisteredToken());

    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      await api.auth.logout(refreshToken).catch(() => undefined);
    }
    await tokenStorage.clear();
    await persistBiometric(false);
    await writeFlag(KEY_ONBOARDING_STEP, null);
    /*
     * "Ro'yxatdan o'tish tugagan" belgisi ham tozalanadi.
     *
     * U qurilmada qolib ketsa, keyingi kirgan odam uchun ilova "hammasini
     * tugatgan" deb hisoblab, to'g'ridan-to'g'ri bosh sahifaga o'tkazardi —
     * ya'ni Xush kelibsiz, Face ID va qadamlar butunlay o'tkazib
     * yuborilardi. Bu belgi FOYDALANUVCHIGA tegishli, qurilmaga emas.
     */
    await writeFlag(KEY_ONBOARDING_DONE, null);
    // Ro'yxatdan o'tish qoralamasi (F.I.Sh., PINFL, bank kabi) shu qurilmada
    // xotirada qolib ketmasin — aks holda shu telefondan keyingi kirgan
    // boshqa foydalanuvchi oldingi odamning shaxsiy ma'lumotlarini ko'rishi
    // mumkin edi.
    useOnboarding.getState().reset();
    setMonitoringUser(null);
    set({
      user: null,
      unlocked: false,
      biometricEnabled: false,
      onboardingStep: 0,
      onboardingDone: false,
      onboardingChecked: false,
    });
  },
}));

// Token yangilash ham ishlamasa — foydalanuvchini chiqaramiz
setSessionExpiredHandler(() => {
  useOnboarding.getState().reset();
  useAuthStore.setState({ user: null, unlocked: false });
});
