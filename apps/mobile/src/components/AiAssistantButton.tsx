import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';

import { colors, spacing } from '../theme';

/**
 * Har bir ekranda turadigan AI yordamchi tugmasi.
 *
 * Navigatordan TASHQARIDA, ildizda bir marta chiziladi — shuning uchun
 * ekran almashganda yo'qolmaydi va har bir ekranga alohida qo'shish
 * kerak emas.
 *
 * Ro'yxatdan o'tish oqimida ko'rinmaydi: u yerda foydalanuvchi qadamma-
 * qadam boradi va tugma yo'lni to'sib qo'yadi.
 */

/** Yordamchi ko'rinmaydigan bo'limlar */
const HIDDEN_GROUPS = new Set(['(auth)', '(setup)']);
/** Yordamchining o'zida tugma kerak emas */
const HIDDEN_SCREENS = new Set(['assistant']);

/** Bitta "nafas" (kattalashib-kichrayish) davri */
const PULSE_MS = 1600;

export function AiAssistantButton() {
  /*
   * Yo'naltirish uchun `useRouter()` EMAS, `router` to'g'ridan-to'g'ri
   * ishlatiladi: bu tugma navigatordan TASHQARIDA chiziladi va u yerda
   * hook orqali kelgan yo'naltiruvchi ishlamay qolardi — tugma bosilsa
   * hech narsa ochilmasdi.
   */
  const segments = useSegments() as readonly string[];

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /*
     * Lipillash: halqa kattalashib so'nadi. `useNativeDriver` — animatsiya
     * JS oqimidan qat'i nazar silliq yursin, ro'yxat aylantirilayotganda
     * ham sekinlashmasin.
     */
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: PULSE_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const group = segments[0] ?? '';
  const screen = segments[segments.length - 1] ?? '';
  if (HIDDEN_GROUPS.has(group) || HIDDEN_SCREENS.has(screen)) return null;

  const ringStyle = {
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
      <Pressable
        onPress={() => router.push('/assistant')}
        accessibilityRole="button"
        accessibilityLabel="ECWT yordamchisi"
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
        hitSlop={8}
      >
        <Ionicons name="sparkles" size={22} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const SIZE = 56;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    /*
     * Pastki yorliqlar ustida turadi. Web'da yorliq balandligi boshqacha,
     * shuning uchun biroz yuqoriroq qo'yiladi.
     */
    bottom: Platform.OS === 'ios' ? 104 : 88,
    right: spacing.lg,
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Ko'tarilgan ko'rinish — fon ustida ajralib tursin
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
