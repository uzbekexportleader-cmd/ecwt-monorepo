import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';
import { translate } from '../i18n';
import { useAuthStore } from '../store/auth';

/**
 * Ekranning yuqorisidagi yo'nalish tugmalari: chapda orqaga, o'ngda oldinga.
 *
 * Ishlov beruvchi berilmasa (masalan, birinchi ekranda orqaga joy yo'q yoki
 * forma hali to'ldirilmagan), tugma so'nib qoladi va bosilmaydi — shu bilan
 * foydalanuvchi nima uchun o'ta olmayotganini ko'rib turadi.
 */
export function StepNav({
  onBack,
  onNext,
  backLabel = translate('common.back'),
  nextLabel = translate('nav.forward'),
  floating = false,
  showSettings = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  /** Kontent ustida suzadi — sarlavha o'rtada qolib, o'qlar burchaklarda turadi */
  floating?: boolean;
  /**
   * Sozlamalarga kirish tugmasi.
   *
   * Ro'yxatdan o'tish jarayonida (Xush kelibsizdan tortib shartnomagacha)
   * Sozlamalar ekraniga boshqa hech qanday yo'l yo'q — Profil bo'limi faqat
   * ro'yxatdan o'tish tugagach ochiladi. Shu sababli har bir qadamda kichik
   * tishli g'ildirak tugmasi turadi.
   */
  showSettings?: boolean;
}) {
  // iPhone'dagi Dynamic Island / o'yiq va Android'dagi status bar ostiga
  // tushib qolmasligi uchun tepadan xavfsiz masofa qo'shiladi
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Kirishdan oldin sozlamalar ekrani ochilmaydi (marshrut himoyachisi
  // qaytarib yuboradi), shuning uchun tugmani ham ko'rsatmaymiz — bosilsa
  // hech narsa bo'lmaydigan "o'lik" tugma qolmasin. Tilni tanlash
  // kirishdan oldin welcome ekranining o'zida bor.
  const user = useAuthStore((s) => s.user);

  return (
    <View
      style={[styles.row, floating && [styles.floating, { paddingTop: insets.top + spacing.sm }]]}
      pointerEvents="box-none"
    >
      <NavButton icon="chevron-back" label={backLabel} onPress={onBack} />
      <View style={styles.rightGroup}>
        {showSettings && user ? (
          <NavButton
            icon="settings-outline"
            label={translate('settings.title')}
            onPress={() => router.push('/settings')}
            alwaysEnabled
          />
        ) : null}
        <NavButton icon="chevron-forward" label={nextLabel} onPress={onNext} />
      </View>
    </View>
  );
}

function NavButton({
  icon,
  label,
  onPress,
  alwaysEnabled = false,
}: {
  icon: 'chevron-back' | 'chevron-forward' | 'settings-outline';
  label: string;
  onPress?: () => void;
  /** Sozlamalar tugmasi hech qachon so'nib qolmaydi — u har doim ochiq */
  alwaysEnabled?: boolean;
}) {
  const enabled = alwaysEnabled || Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={10}
      style={({ pressed }) => [
        styles.button,
        !enabled && styles.disabled,
        pressed && enabled && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={24} color={enabled ? colors.text : colors.textMuted} />
    </Pressable>
  );
}

const SIZE = 44;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  rightGroup: { flexDirection: 'row', gap: spacing.sm },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 26, 56, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(30, 44, 85, 0.9)',
  },
  floating: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
});
