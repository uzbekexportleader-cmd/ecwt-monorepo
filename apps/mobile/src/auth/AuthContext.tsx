import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from '@ecwt/contracts';
import { apiFetch, setSessionExpiredHandler } from '@/api/client';
import { clearTokens, loadTokens, saveTokens } from '@/api/token-store';

interface AuthState {
  user: AuthUser | null;
  /** Ilova ochilganda saqlangan sessiya tekshirilmoqda */
  initializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(async (): Promise<void> => {
    // Serverdagi sessiyani ham yopamiz, lekin u javob bermasa ham
    // lokal tokenlar baribir o'chiriladi — foydalanuvchi chiqa olishi kerak
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // e'tiborsiz
    }

    await clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const me = await apiFetch<AuthUser>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  // Ilova ochilganda: saqlangan token bormi va u hali amal qiladimi?
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const tokens = await loadTokens();

      if (!tokens) {
        if (!cancelled) setInitializing(false);
        return;
      }

      try {
        const me = await apiFetch<AuthUser>('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh token ham eskirsa klient bizga xabar beradi
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    const result = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      skipAuth: true,
    });

    await saveTokens({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });

    setUser(result.user);
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<void> => {
    const result = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      skipAuth: true,
    });

    await saveTokens({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });

    setUser(result.user);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, initializing, login, register, logout, refreshUser }),
    [user, initializing, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return context;
}
