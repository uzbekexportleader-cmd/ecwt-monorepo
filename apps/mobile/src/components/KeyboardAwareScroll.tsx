import React, { createContext, useCallback, useContext, useRef } from 'react';
import {
  Dimensions,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type View,
} from 'react-native';

import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

/** Fokusdagi maydonni klaviatura tepasiga chiqarish uchun chaqiriladi */
type EnsureVisible = (node: View | null) => void;

const ScrollIntoViewContext = createContext<EnsureVisible>(() => undefined);

/**
 * Maydon bilan klaviatura orasida qoladigan bo'shliq.
 *
 * Kattaroq bo'lishi shart: Android klaviaturalari (Gboard va boshqalar)
 * raqam/harf tugmalari USTIDA qo'shimcha asboblar qatorini chizadi, lekin
 * `keyboardDidShow` qaytaradigan balandlikka u har doim ham kirmaydi.
 * 24 px bo'lganda maydonning pastki yarmi o'sha qator ostida qolib ketardi.
 */
const GAP = 96;

/** Klaviatura ochilib bo'lishini kutish — o'lchash to'g'ri chiqsin */
const SETTLE_MS = 260;

/**
 * Klaviaturani hisobga oladigan ro'yxat.
 *
 * NEGA KERAK: Android'da klaviatura ochilganda ekran har doim ham qisqarmaydi.
 * Natijada pastki maydonlar klaviatura ostida ko'rinmay qoladi va odam nima
 * yozayotganini ko'rmaydi.
 *
 * Bu komponent ikki ish qiladi:
 *   1. ro'yxat tagiga klaviatura balandligicha bo'shliq qo'shadi;
 *   2. maydonga tegilganda uni klaviatura tepasiga surib chiqaradi.
 *
 * Maydonlar (`TextField`) fokusga kelganda kontekst orqali o'zini bildiradi.
 */
export function KeyboardAwareScroll({
  children,
  contentContainerStyle,
  extraBottom = 0,
  ...props
}: ScrollViewProps & { children: React.ReactNode; extraBottom?: number }) {
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  const keyboard = useKeyboardHeight();

  // Callback ichida eng so'nggi balandlik kerak — qayta yaratilmasin
  const keyboardRef = useRef(0);
  keyboardRef.current = keyboard;

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);

  const ensureVisible = useCallback<EnsureVisible>((node) => {
    if (!node) return;
    setTimeout(() => {
      node.measureInWindow((_x, y, _width, height) => {
        const screenHeight = Dimensions.get('window').height;
        const visibleBottom = screenHeight - keyboardRef.current - GAP;
        const nodeBottom = y + height;
        if (nodeBottom <= visibleBottom) return;

        scrollRef.current?.scrollTo({
          y: offset.current + (nodeBottom - visibleBottom),
          animated: true,
        });
      });
    }, SETTLE_MS);
  }, []);

  return (
    <ScrollIntoViewContext.Provider value={ensureVisible}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[contentContainerStyle, { paddingBottom: extraBottom + keyboard }]}
        {...props}
      >
        {children}
      </ScrollView>
    </ScrollIntoViewContext.Provider>
  );
}

/** Maydonlar fokusga kelganda shu funksiyani chaqiradi */
export function useScrollIntoView(): EnsureVisible {
  return useContext(ScrollIntoViewContext);
}
