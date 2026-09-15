import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from './AppText';
import { Button } from './ui';
import { StepNav } from './StepNav';
import { useT } from '../i18n';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { KeyboardAwareScroll } from './KeyboardAwareScroll';
import { track } from '../services/analytics';
import { colors, layout, spacing, typography } from '../theme';

/**
 * Ro'yxatdan o'tish oqimidagi qadamlar soni — hisoblagich shunga tayanadi.
 *
 * Sakkiztasi forma qadamlari (shaxsiy → shartnoma), qolgan ikkitasi
 * shartnomadan keyingi holat va yakun ekranlari.
 */
export const TOTAL_STEPS = 10;

/**
 * Ro'yxatdan o'tish qadamlarining umumiy ko'rinishi.
 *
 * Har bir qadamda bir xil narsalar bor: fon videosi, tepada orqaga/oldinga,
 * qadam hisoblagichi, sarlavha va pastda bitta asosiy tugma. Shu qismni
 * takrorlamaslik uchun bir joyga yig'ilgan.
 */
export function StepScreen({
  step,
  title,
  subtitle,
  children,
  onNext,
  nextLabel,
  nextDisabled,
  loading,
  onBack,
  backTo,
  footer,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  onBack?: () => void;
  /**
   * Oldingi qadam manzili.
   *
   * Tarixga tayanmaymiz: qadamlarga ba'zan `replace` bilan kelinadi (masalan
   * ilovani qayta ochganda) — o'shanda tarix bo'sh bo'lib, orqaga tugmasi
   * bosilsa ham hech narsa bo'lmaydi. Aniq manzil berilsa, har doim ishlaydi.
   */
  backTo?: string;
  /** Asosiy tugma o'rniga o'z tugmalaringiz kerak bo'lsa */
  footer?: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const keyboard = useKeyboardHeight();
  const segments = useSegments() as readonly string[];

  /*
   * Voronka o'lchovi shu yerda — bitta joyda.
   *
   * Qadam nomi marshrutdan olinadi (`(setup)/bank` → `bank`), shuning uchun
   * yangi qadam qo'shilsa hech narsa qo'shimcha yozish shart emas.
   *
   * Aynan "ko'rsatildi" hodisasi yoziladi, "tugatildi" emas: forma
   * validatsiyadan o'tmasa ham tugma bosiladi, ya'ni "tugatildi" yolg'on
   * raqam berardi. N va N+1 qadamlar orasidagi farq — haqiqiy chiqib ketish.
   */
  const stepName = segments[segments.length - 1] ?? 'unknown';
  useEffect(() => {
    track('onboarding.step.viewed', { step: stepName, index: step });
  }, [stepName, step]);

  // Yo'l yo'q bo'lsa o'q so'nib turadi — bosiladigandek ko'rinib, jim turmasin
  const back =
    onBack ??
    (backTo
      ? () => router.replace(backTo as never)
      : router.canGoBack()
        ? () => router.back()
        : undefined);

  return (
    <View style={layout.screenClear}>
      <SafeAreaView style={styles.safe}>
        <StepNav onBack={back} onNext={nextDisabled || loading ? undefined : onNext} />

        <View style={styles.flex}>
          <KeyboardAwareScroll
            contentContainerStyle={styles.body}
            extraBottom={spacing['2xl']}
          >
            <Text style={styles.counter}>{t('step.of', { current: step, total: TOTAL_STEPS })}</Text>
            <Text style={[typography.display, styles.title]}>{title}</Text>
            {subtitle ? <Text style={[typography.body, styles.subtitle]}>{subtitle}</Text> : null}

            <View style={styles.content}>{children}</View>
          </KeyboardAwareScroll>

          {/* Klaviatura ochiq turganda tugma yashiriladi — u yozuvni
              to'sib qo'ymasin. Yuqoridagi "oldinga" o'qi ishlab turadi. */}
          <View style={[styles.footer, keyboard > 0 && styles.footerHidden]}>
            {footer ?? (
              <Button
                title={nextLabel ?? t('common.continue')}
                onPress={onNext}
                disabled={nextDisabled}
                loading={loading}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing['2xl'] },
  counter: { color: colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  title: { marginTop: spacing.sm },
  subtitle: { marginTop: spacing.sm },
  content: { marginTop: spacing['2xl'], gap: spacing.lg },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  footerHidden: { height: 0, opacity: 0, paddingVertical: 0, overflow: 'hidden' },
});
