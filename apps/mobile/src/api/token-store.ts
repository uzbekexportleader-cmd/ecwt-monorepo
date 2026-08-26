import * as SecureStore from 'expo-secure-store';

/**
 * Tokenlar qurilmaning xavfsiz xotirasida saqlanadi:
 * iOS'da Keychain, Android'da EncryptedSharedPreferences.
 *
 * AsyncStorage ATAYLAB ishlatilmagan — u oddiy matn faylida saqlaydi
 * va root/jailbreak qilingan qurilmada osongina o'qiladi.
 */
const ACCESS_KEY = 'ecwt_access_token';
const REFRESH_KEY = 'ecwt_refresh_token';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);

    if (!accessToken || !refreshToken) return null;

    return { accessToken, refreshToken };
  } catch {
    // Xavfsiz xotira o'qilmasa — kirmagan holat deb hisoblaymiz
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined),
  ]);
}
