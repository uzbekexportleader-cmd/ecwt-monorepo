import type { Locale } from '@ecwt/contracts';
import type { DemoScreen } from './demo-state';

/**
 * Demo matnlari.
 *
 * Loyihaning asosiy lug‘atlariga qo‘shilmadi: demo pitch oldidan tez-tez
 * o‘zgaradi, uni alohida ushlab turish `i18n/dictionaries` ni toza
 * saqlaydi. Tuzilma esa loyihadagi `TEXT = { uz, ru, en }` uslubiga mos.
 */

interface ShellCopy {
  demoBadge: string;
  stepOf: (current: number, total: number) => string;
  back: string;
  autofill: string;
  restart: string;
  investorToggle: string;
  investorHint: string;
  brandTagline: string;
  brandSubtitle: string;
  benefits: [string, string, string];
  stats: Array<{ value: string; label: string }>;
}

interface AuthCopy {
  registerTitle: string;
  registerSubtitle: string;
  loginTitle: string;
  loginSubtitle: string;
  fullName: string;
  fullNamePlaceholder: string;
  phone: string;
  terms: string;
  termsLink: string;
  submitRegister: string;
  submitLogin: string;
  sending: string;
  or: string;
  oneId: string;
  google: string;
  haveAccount: string;
  goLogin: string;
  noAccount: string;
  goRegister: string;
  errors: {
    fullName: string;
    phone: string;
    terms: string;
  };
}

export const SHELL_COPY: Record<Locale, ShellCopy> = {
  uz: {
    demoBadge: 'Demo rejimi',
    stepOf: (current, total) => `${current} / ${total}`,
    back: 'Orqaga',
    autofill: 'Demo to‘ldirish',
    restart: 'Boshidan',
    investorToggle: 'Investor rejimi',
    investorHint: 'I tugmasi',
    brandTagline: 'O‘zbek mahsulotini AQSH bozoriga 8 qadamda chiqaring',
    brandSubtitle:
      'Hunarmand, tekstil, agro va ishlab chiqaruvchilar uchun yagona eksport oynasi.',
    benefits: ['SMS va Face ID bilan KYC', 'Davlat subsidiyasiga ariza', 'FBA ombori va logistika'],
    stats: [
      { value: '7', label: 'marketplace' },
      { value: '6 daq', label: 'onboarding' },
      { value: '$14K', label: 'o‘rtacha LTV' },
    ],
  },
  ru: {
    demoBadge: 'Демо-режим',
    stepOf: (current, total) => `${current} / ${total}`,
    back: 'Назад',
    autofill: 'Заполнить демо',
    restart: 'Сначала',
    investorToggle: 'Режим инвестора',
    investorHint: 'клавиша I',
    brandTagline: 'Выведите узбекский товар на рынок США за 8 шагов',
    brandSubtitle:
      'Единое экспортное окно для ремесленников, текстиля, агро и производителей.',
    benefits: ['KYC через SMS и Face ID', 'Заявка на госсубсидию', 'Склад FBA и логистика'],
    stats: [
      { value: '7', label: 'маркетплейсов' },
      { value: '6 мин', label: 'онбординг' },
      { value: '$14K', label: 'средний LTV' },
    ],
  },
  en: {
    demoBadge: 'Demo mode',
    stepOf: (current, total) => `${current} / ${total}`,
    back: 'Back',
    autofill: 'Fill demo data',
    restart: 'Restart',
    investorToggle: 'Investor mode',
    investorHint: 'press I',
    brandTagline: 'Take your Uzbek product to the US market in 8 steps',
    brandSubtitle: 'A single export gateway for artisans, textile, agro, and manufacturers.',
    benefits: ['KYC with SMS and Face ID', 'State subsidy application', 'FBA warehouse and logistics'],
    stats: [
      { value: '7', label: 'marketplaces' },
      { value: '6 min', label: 'onboarding' },
      { value: '$14K', label: 'average LTV' },
    ],
  },
};

export const AUTH_COPY: Record<Locale, AuthCopy> = {
  uz: {
    registerTitle: 'Hisob yarating',
    registerSubtitle: 'Telefon raqamingizga tasdiqlash kodi yuboriladi.',
    loginTitle: 'Hisobingizga kiring',
    loginSubtitle: 'Raqamingizni kiriting — kodni SMS orqali yuboramiz.',
    fullName: 'Ism va familiya',
    fullNamePlaceholder: 'Dilshod Rahimov',
    phone: 'Telefon raqam',
    terms: 'Ommaviy oferta va shaxsiy ma’lumotlar siyosatiga roziman',
    termsLink: 'Shartlarni o‘qish',
    submitRegister: 'SMS kod yuborish',
    submitLogin: 'Kirish kodini olish',
    sending: 'Yuborilmoqda...',
    or: 'yoki',
    oneId: 'OneID',
    google: 'Google',
    haveAccount: 'Hisobingiz bormi?',
    goLogin: 'Kirish',
    noAccount: 'Hisobingiz yo‘qmi?',
    goRegister: 'Ro‘yxatdan o‘tish',
    errors: {
      fullName: 'Ism va familiyangizni kiriting',
      phone: 'Raqamni to‘liq kiriting — 9 ta raqam',
      terms: 'Davom etish uchun shartlarga rozilik bering',
    },
  },
  ru: {
    registerTitle: 'Создайте аккаунт',
    registerSubtitle: 'На ваш номер придёт код подтверждения.',
    loginTitle: 'Войдите в аккаунт',
    loginSubtitle: 'Введите номер — код отправим по SMS.',
    fullName: 'Имя и фамилия',
    fullNamePlaceholder: 'Дилшод Рахимов',
    phone: 'Номер телефона',
    terms: 'Согласен с офертой и политикой обработки персональных данных',
    termsLink: 'Читать условия',
    submitRegister: 'Отправить SMS-код',
    submitLogin: 'Получить код для входа',
    sending: 'Отправляем...',
    or: 'или',
    oneId: 'OneID',
    google: 'Google',
    haveAccount: 'Уже есть аккаунт?',
    goLogin: 'Войти',
    noAccount: 'Нет аккаунта?',
    goRegister: 'Регистрация',
    errors: {
      fullName: 'Введите имя и фамилию',
      phone: 'Введите номер полностью — 9 цифр',
      terms: 'Примите условия, чтобы продолжить',
    },
  },
  en: {
    registerTitle: 'Create your account',
    registerSubtitle: 'We will send a verification code to your phone.',
    loginTitle: 'Sign in',
    loginSubtitle: 'Enter your number — we will text you a code.',
    fullName: 'Full name',
    fullNamePlaceholder: 'Dilshod Rahimov',
    phone: 'Phone number',
    terms: 'I agree to the public offer and the privacy policy',
    termsLink: 'Read the terms',
    submitRegister: 'Send SMS code',
    submitLogin: 'Get sign-in code',
    sending: 'Sending...',
    or: 'or',
    oneId: 'OneID',
    google: 'Google',
    haveAccount: 'Already have an account?',
    goLogin: 'Sign in',
    noAccount: 'No account yet?',
    goRegister: 'Create one',
    errors: {
      fullName: 'Enter your first and last name',
      phone: 'Enter the full number — 9 digits',
      terms: 'Accept the terms to continue',
    },
  },
};

interface OtpCopy {
  title: string;
  subtitle: string;
  changeNumber: string;
  resendIn: (seconds: number) => string;
  resend: string;
  verifying: string;
  verified: string;
  wrongCode: string;
  incomplete: string;
  smsSender: string;
  smsBody: (code: string) => string;
  smsAction: string;
  smsNote: string;
  sending: string;
  sent: string;
  sentNote: string;
  sendFailed: string;
  retry: string;
  codeExpired: string;
  tooSoon: string;
}

export const OTP_COPY: Record<Locale, OtpCopy> = {
  uz: {
    title: 'Kodni kiriting',
    subtitle: 'raqamiga 6 xonali tasdiqlash kodini yubordik.',
    changeNumber: 'Raqamni o‘zgartirish',
    resendIn: (seconds) => `Qayta yuborish ${seconds} soniyadan keyin`,
    resend: 'Kodni qayta yuborish',
    verifying: 'Tekshirilmoqda...',
    verified: 'Raqam tasdiqlandi',
    wrongCode: 'Kod noto‘g‘ri. Qaytadan urinib ko‘ring.',
    incomplete: 'Kodni to‘liq kiriting — 6 ta raqam',
    smsSender: 'ECWT',
    smsBody: (code) => `Tasdiqlash kodi: ${code}. Hech kimga aytmang.`,
    smsAction: 'Kodni qo‘yish',
    smsNote: 'Demo: haqiqiy SMS yuborilmaydi',
    sending: 'SMS yuborilmoqda...',
    sent: 'Kod yuborildi',
    sentNote: 'SMS bir daqiqagacha kechikishi mumkin.',
    sendFailed: 'SMS yuborilmadi',
    retry: 'Qayta urinish',
    codeExpired: 'Kod muddati tugadi. Yangi kod so‘rang.',
    tooSoon: 'Yangi kodni birozdan keyin so‘rash mumkin',
  },
  ru: {
    title: 'Введите код',
    subtitle: 'мы отправили 6-значный код подтверждения.',
    changeNumber: 'Изменить номер',
    resendIn: (seconds) => `Повторная отправка через ${seconds} сек.`,
    resend: 'Отправить код заново',
    verifying: 'Проверяем...',
    verified: 'Номер подтверждён',
    wrongCode: 'Неверный код. Попробуйте ещё раз.',
    incomplete: 'Введите код полностью — 6 цифр',
    smsSender: 'ECWT',
    smsBody: (code) => `Код подтверждения: ${code}. Никому не сообщайте.`,
    smsAction: 'Подставить код',
    smsNote: 'Демо: настоящая SMS не отправляется',
    sending: 'Отправляем SMS...',
    sent: 'Код отправлен',
    sentNote: 'SMS может идти до минуты.',
    sendFailed: 'SMS не отправлена',
    retry: 'Повторить',
    codeExpired: 'Срок кода истёк. Запросите новый.',
    tooSoon: 'Новый код можно запросить чуть позже',
  },
  en: {
    title: 'Enter the code',
    subtitle: 'we sent a 6-digit verification code.',
    changeNumber: 'Change number',
    resendIn: (seconds) => `Resend in ${seconds}s`,
    resend: 'Resend the code',
    verifying: 'Verifying...',
    verified: 'Number verified',
    wrongCode: 'Wrong code. Try again.',
    incomplete: 'Enter the full code — 6 digits',
    smsSender: 'ECWT',
    smsBody: (code) => `Verification code: ${code}. Do not share it.`,
    smsAction: 'Use this code',
    smsNote: 'Demo: no real SMS is sent',
    sending: 'Sending SMS...',
    sent: 'Code sent',
    sentNote: 'The SMS can take up to a minute to arrive.',
    sendFailed: 'SMS could not be sent',
    retry: 'Try again',
    codeExpired: 'The code has expired. Request a new one.',
    tooSoon: 'You can request a new code in a moment',
  },
};

/** Chap paneldagi qadam relsi uchun qisqa nomlar */
export const STEP_LABELS: Record<Locale, Record<DemoScreen, string>> = {
  uz: {
    auth: 'Ro‘yxatdan o‘tish',
    otp: 'SMS tasdiq',
    faceid: 'Face ID',
    segment: 'Yo‘nalish',
    funding: 'Moliyalashtirish',
    marketplace: 'Marketplace',
    profile: 'Biznes ma’lumot',
    logistics: 'Logistika',
    done: 'Tayyor',
  },
  ru: {
    auth: 'Регистрация',
    otp: 'SMS-код',
    faceid: 'Face ID',
    segment: 'Направление',
    funding: 'Финансирование',
    marketplace: 'Маркетплейс',
    profile: 'Данные бизнеса',
    logistics: 'Логистика',
    done: 'Готово',
  },
  en: {
    auth: 'Sign up',
    otp: 'SMS code',
    faceid: 'Face ID',
    segment: 'Category',
    funding: 'Funding',
    marketplace: 'Marketplace',
    profile: 'Business data',
    logistics: 'Logistics',
    done: 'Done',
  },
};
