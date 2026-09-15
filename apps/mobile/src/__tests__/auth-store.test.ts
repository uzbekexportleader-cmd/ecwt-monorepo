import type { AuthResponse } from '@ecwt/types';

jest.mock('../api/client', () => {
  const tokens = new Map<string, string>();
  return {
    api: {
      me: { get: jest.fn() },
      auth: { logout: jest.fn(async () => undefined) },
    },
    tokenStorage: {
      getAccessToken: async () => tokens.get('access') ?? null,
      getRefreshToken: async () => tokens.get('refresh') ?? null,
      setTokens: async (t: { accessToken: string; refreshToken: string }) => {
        tokens.set('access', t.accessToken);
        tokens.set('refresh', t.refreshToken);
      },
      clear: async () => tokens.clear(),
    },
    setSessionExpiredHandler: jest.fn(),
    // Haqiqiy klass — `bootstrap` tarmoq xatosini autentifikatsiya
    // xatosidan `instanceof` orqali ajratadi.
    EcwtApiError: jest.requireActual('@ecwt/api-client').EcwtApiError,
  };
});

jest.mock('../services/biometrics', () => {
  let enabled = false;
  return {
    isBiometricEnabled: jest.fn(async () => enabled),
    setBiometricEnabled: jest.fn(async (v: boolean) => {
      enabled = v;
    }),
  };
});

import { useAuthStore } from '../store/auth';
import { api, EcwtApiError, tokenStorage } from '../api/client';
import { isBiometricEnabled, setBiometricEnabled } from '../services/biometrics';

const authResponse: AuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 900,
  user: {
    id: 'u1',
    phone: '998901234567',
    role: 'USER',
    locale: 'uz',
    fullName: 'Asror Test User',
    hasProfile: true,
  },
};

function reset() {
  useAuthStore.setState({
    ready: false,
    user: null,
    seenWelcome: false,
    onboardingDone: false,
    onboardingStep: 0,
    biometricEnabled: false,
    unlocked: false,
  });
}

describe('Auth store — ishga tushish', () => {
  beforeEach(async () => {
    await tokenStorage.clear();
    await setBiometricEnabled(false);
    reset();
    jest.clearAllMocks();
  });

  it('token yo‘q bo‘lsa sessiya tiklanmaydi', async () => {
    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().ready).toBe(true);
    expect(api.me.get).not.toHaveBeenCalled();
  });

  it('saqlangan token bilan sessiyani tiklaydi', async () => {
    await tokenStorage.setTokens(authResponse);
    (api.me.get as jest.Mock).mockResolvedValueOnce(authResponse.user);

    await useAuthStore.getState().bootstrap();

    expect(api.me.get).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.id).toBe('u1');
    expect(useAuthStore.getState().ready).toBe(true);
  });

  it('token yaroqsiz bo‘lsa tozalaydi', async () => {
    await tokenStorage.setTokens(authResponse);
    (api.me.get as jest.Mock).mockRejectedValueOnce(new Error('401'));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toBeNull();
    expect(await tokenStorage.getAccessToken()).toBeNull();
  });

  it('tarmoq uzilsa tokenni SAQLAB qoladi', async () => {
    // Internet bir lahzaga uzilgani foydalanuvchini tizimdan chiqarib
    // yuborishga asos emas — token amalda hali yaroqli bo'lishi mumkin.
    await tokenStorage.setTokens(authResponse);
    (api.me.get as jest.Mock).mockRejectedValueOnce(
      new EcwtApiError(0, 'Serverga ulanib bo‘lmadi', 'NETWORK_ERROR'),
    );

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().ready).toBe(true);
    expect(await tokenStorage.getAccessToken()).toBe('access-token');
  });

  it('bootstrap biometrik sozlamani o‘qiydi', async () => {
    await setBiometricEnabled(true);

    await useAuthStore.getState().bootstrap();

    expect(isBiometricEnabled).toHaveBeenCalled();
    expect(useAuthStore.getState().biometricEnabled).toBe(true);
  });
});

describe('Auth store — sessiya', () => {
  beforeEach(async () => {
    await tokenStorage.clear();
    await setBiometricEnabled(false);
    reset();
    jest.clearAllMocks();
  });

  it('kirishdan keyin tokenlar saqlanadi va sessiya ochiladi', async () => {
    await useAuthStore.getState().applyAuth(authResponse);

    expect(await tokenStorage.getAccessToken()).toBe('access-token');
    expect(useAuthStore.getState().user?.phone).toBe('998901234567');
    expect(useAuthStore.getState().unlocked).toBe(true);
  });

  it('biometrikani yoqish sessiyani ochiq holatda qoldiradi', async () => {
    await useAuthStore.getState().setBiometricEnabled(true);

    expect(useAuthStore.getState().biometricEnabled).toBe(true);
    expect(useAuthStore.getState().unlocked).toBe(true);
  });

  it('sehrgar qadami saqlanadi va yakunlanganda tozalanadi', async () => {
    await useAuthStore.getState().saveOnboardingStep(4);
    expect(useAuthStore.getState().onboardingStep).toBe(4);

    await useAuthStore.getState().completeOnboarding();
    expect(useAuthStore.getState().onboardingDone).toBe(true);
    expect(useAuthStore.getState().onboardingStep).toBe(0);
  });

  it('chiqishda tokenlar, biometrika va qulf tozalanadi', async () => {
    await useAuthStore.getState().applyAuth(authResponse);
    await useAuthStore.getState().setBiometricEnabled(true);

    await useAuthStore.getState().logout();

    expect(api.auth.logout).toHaveBeenCalledWith('refresh-token');
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().unlocked).toBe(false);
    expect(useAuthStore.getState().biometricEnabled).toBe(false);
    expect(await tokenStorage.getRefreshToken()).toBeNull();
  });
});
