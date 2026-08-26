import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch } from './client';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Pastga tortib yangilash uchun */
  refreshing: boolean;
  refresh: () => void;
}

/**
 * Oddiy ma'lumot yuklash hook'i.
 *
 * React Query ataylab ishlatilmagan: bu ekranlarda kesh, mutatsiya va
 * optimistik yangilanish kerak emas — faqat yuklash va qayta yuklash.
 * Ehtiyoj paydo bo'lganda kutubxonaga o'tish oson.
 */
export function useApi<T>(path: string): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await apiFetch<T>(path);
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Xatolik yuz berdi');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  return { data, loading, error, refreshing, refresh };
}
