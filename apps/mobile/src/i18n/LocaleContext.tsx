import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCALE, type Locale } from '@ecwt/contracts';
import { detectDeviceLocale, getStrings, type Strings } from './index';

const LOCALE_KEY = 'ecwt_locale';

interface LocaleState {
  locale: Locale;
  t: Strings;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleState | null>(null);

/**
 * Til holati.
 *
 * Tanlov AsyncStorage'da saqlanadi (maxfiy ma'lumot emas, SecureStore shart emas).
 * Birinchi ochilishda telefon tili bo'yicha aniqlanadi.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY);

        if (!cancelled) {
          setLocaleState(saved ? (saved as Locale) : detectDeviceLocale());
        }
      } catch {
        if (!cancelled) setLocaleState(detectDeviceLocale());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale): void => {
    setLocaleState(next);
    void AsyncStorage.setItem(LOCALE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<LocaleState>(
    () => ({ locale, t: getStrings(locale), setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleState {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale LocaleProvider ichida ishlatilishi kerak');
  return context;
}
