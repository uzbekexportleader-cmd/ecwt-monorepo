import React, { useEffect, useState } from 'react';
import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

import { tokenStorage } from '../api/client';

/**
 * Himoyalangan rasm (pasport, selfi, shartnoma).
 *
 * NEGA KERAK: yuklangan hujjatlar ochiq papkada turmaydi — har bir so'rov
 * serverda autentifikatsiya va egalik tekshiruvidan o'tadi
 * (`GET /documents/:id/file`). Oddiy `<Image source={{ uri }}>` esa hech
 * qanday sarlavha yubormaydi, shuning uchun server 401 qaytaradi va rasm
 * jimgina yuklanmay qoladi — ekranda bo'sh joy ko'rinadi.
 *
 * Shu sababli token qo'lda qo'shiladi.
 */
export function AuthImage({
  uri,
  style,
  contentFit = 'cover',
  fallback,
}: {
  uri: string | undefined;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** Token hali o'qilmaganda yoki rasm yo'qligida ko'rsatiladi */
  fallback?: React.ReactNode;
}) {
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    // `getAccessToken` sinxron ham, va'da ham qaytarishi mumkin
    void Promise.resolve(tokenStorage.getAccessToken()).then((token) => {
      if (cancelled) return;
      setHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  // Token o'qilgunча (bir necha millisekund) joy bo'sh turmasin
  if (!uri || headers === null) return <>{fallback ?? null}</>;

  return (
    <Image
      source={{ uri, headers }}
      style={style}
      contentFit={contentFit}
      transition={180}
      cachePolicy="memory-disk"
    />
  );
}
