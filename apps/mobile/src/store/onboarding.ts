import { create } from 'zustand';
import type { ActivityType, ArtisanProfileDto, Gender, OnboardingStage, PaymentMethod } from '@ecwt/types';

import { api } from '../api/client';

/**
 * Ro'yxatdan o'tish oqimining javoblari.
 *
 * Har bir qadam tugagach javoblar serverga yuboriladi va `onboardingStage`
 * oldinga suriladi — foydalanuvchi ilovani yopib qaytsa, o'sha joydan
 * davom etadi.
 */
export interface OnboardingDraft {
  /* 5. shaxsiy */
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  gender: Gender | null;
  pinfl: string;
  passportSeries: string;
  passportNumber: string;

  /* 6. manzil */
  region: string;
  district: string;
  mahalla: string;
  street: string;
  houseNumber: string;
  contactPhone: string;

  /* 7-8. faoliyat */
  activityType: ActivityType | null;
  craftCategoryId: string | null;
  sectorKind: string | null;
  yearsOfExperience: number | null;
  isMember: boolean | null;
  hasYatt: boolean | null;

  /* 9. xizmatlar */
  selectedMarketplaces: string[];
  wantsBrandSite: boolean;
  wantsDropshipping: boolean;
  wantsChinaImport: boolean;

  /* 10. bank */
  bankAccount: string;
  /**
   * Serverda allaqachon saqlangan hisob raqami (maskalangan ko‘rinishda).
   *
   * Server raqamni to‘liq qaytarmaydi — bu ataylab. Shu sababli maska
   * TAHRIR maydoniga solinmaydi: aks holda foydalanuvchi «•••• 4567» ni
   * saqlamoqchi bo‘lib xatoga uchraydi. Maska faqat «saqlangan» deb
   * ko‘rsatish uchun ishlatiladi.
   */
  bankAccountSaved: string | null;
  bankMfo: string;
  bankName: string;
  bankSwift: string;
  stir: string;
  /** Yuridik shaxs nomi — subsidiya arizasida talab qilinadi */
  organizationName: string;

  /* 11. to'lov */
  paymentMethod: PaymentMethod | null;
}

const EMPTY: OnboardingDraft = {
  firstName: '',
  lastName: '',
  middleName: '',
  birthDate: '',
  gender: null,
  pinfl: '',
  passportSeries: '',
  passportNumber: '',

  region: '',
  district: '',
  mahalla: '',
  street: '',
  houseNumber: '',
  contactPhone: '',

  activityType: null,
  craftCategoryId: null,
  sectorKind: null,
  yearsOfExperience: null,
  isMember: null,
  hasYatt: null,

  selectedMarketplaces: [],
  wantsBrandSite: false,
  wantsDropshipping: false,
  wantsChinaImport: false,

  bankAccount: '',
  bankAccountSaved: null,
  bankMfo: '',
  bankName: '',
  bankSwift: '',
  stir: '',
  organizationName: '',

  paymentMethod: null,
};

interface OnboardingState {
  draft: OnboardingDraft;
  stage: OnboardingStage;
  hydrated: boolean;
  saving: boolean;
  set: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  /** Serverdagi profilni qoralamaga o'giradi */
  hydrate: (profile: ArtisanProfileDto, phone: string) => void;
  /** Qadam javoblarini yuboradi va bosqichni oldinga suradi */
  saveStep: (patch: Record<string, unknown>, nextStage: OnboardingStage) => Promise<void>;
  reset: () => void;
  /** Serverdagi bosqichni ham birinchi qadamga qaytaradi */
  restart: () => Promise<void>;
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
  draft: EMPTY,
  stage: 'PERSONAL',
  hydrated: false,
  saving: false,

  set(key, value) {
    set((s) => ({ draft: { ...s.draft, [key]: value } }));
  },

  hydrate(profile, phone) {
    if (get().hydrated) return;
    set({
      hydrated: true,
      stage: profile.onboardingStage,
      draft: {
        ...EMPTY,
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        middleName: profile.middleName ?? '',
        birthDate: profile.birthDate ?? '',
        gender: profile.gender,
        // JShShIR serverdan niqoblangan holda keladi — uni qayta yubormaymiz
        pinfl: profile.pinfl && !profile.pinfl.includes('•') ? profile.pinfl : '',
        passportSeries: profile.passportSeries ?? '',
        passportNumber: profile.passportNumber ?? '',

        region: profile.region ?? '',
        district: profile.district ?? '',
        mahalla: profile.mahalla ?? '',
        street: profile.street ?? '',
        houseNumber: profile.houseNumber ?? '',
        contactPhone: profile.contactPhone ?? phone,

        activityType: profile.activityType,
        craftCategoryId: profile.craftCategoryId,
        yearsOfExperience: profile.yearsOfExperience,
        isMember: profile.membershipStatus === 'ACTIVE' ? true : null,
        hasYatt: profile.businessType === 'YATT' ? true : null,

        selectedMarketplaces: profile.selectedMarketplaces ?? [],
        wantsBrandSite: profile.wantsBrandSite,
        wantsDropshipping: profile.wantsDropshipping,
        wantsChinaImport: profile.wantsChinaImport,

        // Maskalangan qiymat (• belgilari) tahrirlanmaydi
        bankAccount: isMasked(profile.bankAccount) ? '' : (profile.bankAccount ?? ''),
        bankAccountSaved: isMasked(profile.bankAccount) ? profile.bankAccount : null,
        bankMfo: profile.bankMfo ?? '',
        bankName: profile.bankName ?? '',
        bankSwift: profile.bankSwift ?? '',
        stir: profile.stir ?? '',
        organizationName: profile.organizationName ?? '',

        paymentMethod: profile.paymentMethod,
      },
    });
  },

  async saveStep(patch, nextStage) {
    set({ saving: true });
    try {
      await api.profile.update({ ...patch, onboardingStage: nextStage } as never);
      set({ stage: nextStage });
    } finally {
      set({ saving: false });
    }
  },

  reset() {
    set({ draft: EMPTY, stage: 'PERSONAL', hydrated: false, saving: false });
  },

  /**
   * Ro'yxatdan o'tishni boshidan boshlaydi.
   *
   * Kiritilgan ma'lumotlar bazada qoladi — faqat bosqich birinchi qadamga
   * qaytariladi, shunda oldingi javoblar formalarga qayta tushadi va
   * ularni tahrirlab chiqish mumkin bo'ladi.
   */
  async restart() {
    await api.profile.update({ onboardingStage: 'PERSONAL' });
    set({ draft: EMPTY, stage: 'PERSONAL', hydrated: false, saving: false });
  },
}));

/** Server maskalab qaytargan qiymatmi */
function isMasked(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.includes('•');
}
