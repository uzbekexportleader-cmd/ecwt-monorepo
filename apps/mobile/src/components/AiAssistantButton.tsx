import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router, useSegments } from 'expo-router';

import { ChatGptLogo } from './ChatGptLogo';
import { Text } from './AppText';
import { colors, spacing } from '../theme';

/**
 * Har bir ekranda turadigan AI yordamchi tugmasi.
 *
 * Navigatordan TASHQARIDA, ildizda bir marta chiziladi — shuning uchun
 * ekran almashganda yo'qolmaydi va har bir ekranga alohida qo'shish
 * kerak emas.
 *
 * Birinchi ekrandan boshlab ko'rinadi. Avval ro'yxatdan o'tish va anketa
 * davomida yashirilgan edi, lekin yordam aynan o'sha yerda kerak —
 * "JShShIR nima?", "MFO qayerdan olinadi?" kabi savollar shu qadamlarda
 * tug'iladi. Tunnelga yetib kelgan odam yo'lni allaqachon tushungan
 * bo'ladi.
 */

/**
 * Yordamchi ko'rinmaydigan bo'limlar.
 *
 * Splash (ildiz ekrani) bundan mustasno: u yerda ilova hali yuklanmagan.
 */
const HIDDEN_GROUPS = new Set<string>([]);
/** Yordamchining o'zida tugma kerak emas */
const HIDDEN_SCREENS = new Set(['assistant']);

/**
 * Yordamchining nomi — bitta joyda.
 *
 * Tugmada ham, ekran sarlavhasida ham shu ishlatiladi: nom ikki joyda
 * alohida yozilsa, biri o'zgarganda ikkinchisi eskirib qoladi.
 */
export const ASSISTANT_NAME = 'ChatGPT';

/** ChatGPT logotipining rasmiy fon rangi */
export const ASSISTANT_COLOR = '#74AA9C';

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

  /*
   * Ba'zi ekranlarda pastda butun enni egallagan asosiy tugma turadi
   * (anketada "Davom etish", tunnelda "Shaxsiy kabinetga kirish").
   * Yordamchini o'shalarning ustidan ko'taramiz — aks holda tugmaning
   * o'ng chekkasini to'sib, bosishga xalaqit beradi.
   */
  const hasBottomAction = group === '(auth)' || group === '(setup)' || screen === 'journey';
  const lift = hasBottomAction ? { bottom: (Platform.OS === 'ios' ? 104 : 88) + 76 } : null;

  return (
    <View style={[styles.wrap, lift]} pointerEvents="box-none">
      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
      <Pressable
        onPress={() => router.push('/assistant')}
        accessibilityRole="button"
        accessibilityLabel={ASSISTANT_NAME}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
        hitSlop={8}
      >
        <ChatGptLogo size={30} />
      </Pressable>

      {/* Nomi tugma ostida: odam nimaga bosayotganini bilsin */}
      <Text style={styles.caption} numberOfLines={1}>
        {ASSISTANT_NAME}
      </Text>
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
    /*
     * Balandlik QAT'IY belgilanmaydi: tugma ostida nom yozuvi ham bor.
     * Ilgari bu yerda `height: SIZE` turardi va yozuv o'ram chegarasidan
     * chiqib, ko'rinmay qolardi.
     */
    width: SIZE,
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: ASSISTANT_COLOR,
  },
  caption: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.text,
    textAlign: 'center',
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: ASSISTANT_COLOR,
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
