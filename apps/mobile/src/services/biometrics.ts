import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Biometrik kirish (Face ID / barmoq izi).
 *
 * XAVFSIZLIK: biometrik ma'lumot (yuz yoki barmoq izi) hech qachon ECWT
 * serveriga yuborilmaydi va ilovada saqlanmaydi. Biz faqat operatsion
 * tizimning o'z mexanizmidan (iOS Secure Enclave / Android Keystore)
 * "tasdiqlandi / tasdiqlanmadi" javobini olamiz.
 *
 * Biometrika server autentifikatsiyasi o'rnini bosmaydi — u qurilmadagi
 * mavjud sessiyani himoya qiladi, xolos.
 */

const BIOMETRIC_ENABLED_KEY = 'ecwt.biometricEnabled';

export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'none';

export interface BiometricInfo {
  /** Qurilmada biometrik datchik bormi */
  hasHardware: boolean;
  /** Foydalanuvchi qurilmada yuz/barmoq izini ro'yxatdan o'tkazganmi */
  isEnrolled: boolean;
  kind: BiometricKind;
  /** UI'da ko'rsatiladigan nom: "Face ID", "Barmoq izi", "Biometrik kirish" */
  label: string;
  /** Sozlash mumkinmi (hardware + enrollment bor) */
  available: boolean;
}

const isWeb = Platform.OS === 'web';

export async function getBiometricInfo(): Promise<BiometricInfo> {
  if (isWeb) {
    return { hasHardware: false, isEnrolled: false, kind: 'none', label: 'Biometrik kirish', available: false };
  }

  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const hasFinger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
  const hasIris = types.includes(LocalAuthentication.AuthenticationType.IRIS);

  const kind: BiometricKind = hasFace ? 'face' : hasFinger ? 'fingerprint' : hasIris ? 'iris' : 'none';

  return {
    hasHardware,
    isEnrolled,
    kind,
    label: labelFor(kind),
    available: hasHardware && isEnrolled,
  };
}

/** iPhone'da "Face ID", Android'da qurilmaga mos o'zbekcha nom. */
export function labelFor(kind: BiometricKind): string {
  if (Platform.OS === 'ios') {
    if (kind === 'face') return 'Face ID';
    if (kind === 'fingerprint') return 'Touch ID';
    return 'Biometrik kirish';
  }
  if (kind === 'face') return 'Yuz orqali kirish';
  if (kind === 'fingerprint') return 'Barmoq izi';
  if (kind === 'iris') return 'Ko‘z orqali kirish';
  return 'Biometrik kirish';
}

export interface BiometricResult {
  success: boolean;
  /** Foydalanuvchi o'zi bekor qildimi (xato emas) */
  cancelled: boolean;
  /** O'zbekcha tushuntirish */
  message?: string;
}

/**
 * Native biometrik oynani ochadi.
 * `fallbackToPasscode` — qurilma parolini ham qabul qilish (kirish ekranida qulay).
 */
export async function authenticate(
  promptMessage: string,
  options: { fallbackToPasscode?: boolean } = {},
): Promise<BiometricResult> {
  if (isWeb) {
    return { success: false, cancelled: false, message: 'Bu qurilmada biometrik kirish mavjud emas.' };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Bekor qilish',
      // Qurilma paroli bilan zaxira kirish (faqat kerak bo'lganda)
      disableDeviceFallback: !options.fallbackToPasscode,
      fallbackLabel: options.fallbackToPasscode ? 'Qurilma paroli' : '',
      requireConfirmation: false,
    });

    if (result.success) return { success: true, cancelled: false };

    const error = 'error' in result ? result.error : '';
    const cancelled = error === 'user_cancel' || error === 'system_cancel' || error === 'app_cancel';

    return {
      success: false,
      cancelled,
      message: cancelled ? undefined : errorMessage(error),
    };
  } catch {
    return { success: false, cancelled: false, message: 'Biometrik tekshiruvni bajarib bo‘lmadi.' };
  }
}

function errorMessage(error: string): string {
  switch (error) {
    case 'not_enrolled':
      return 'Qurilmada biometrik ma’lumot sozlanmagan. Telefon sozlamalaridan qo‘shing.';
    case 'not_available':
      return 'Bu qurilmada biometrik kirish mavjud emas.';
    case 'lockout':
    case 'lockout_permanent':
      return 'Ko‘p marta noto‘g‘ri urinildi. Qurilma parolini kiriting yoki keyinroq urinib ko‘ring.';
    case 'user_fallback':
      return 'Boshqa usul tanlandi.';
    default:
      return 'Tanib bo‘lmadi. Qayta urinib ko‘ring.';
  }
}

/* ------------------------- sozlamani saqlash --------------------------- */

export async function isBiometricEnabled(): Promise<boolean> {
  if (isWeb) return false;
  try {
    return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (isWeb) return;
  try {
    if (enabled) await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1');
    else await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  } catch {
    /* qurilma xotirasi mavjud emas — sozlama yoqilmaydi */
  }
}
