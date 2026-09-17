import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../src/components/AppText';
import { Button, Card } from '../../src/components/ui';
import { useProfile, useSellerApplication } from '../../src/api/queries';
import { useAuthStore } from '../../src/store/auth';
import { useOnboarding } from '../../src/store/onboarding';
import { TOTAL_STEPS } from '../../src/components/StepScreen';
import { useT } from '../../src/i18n';
import { colors, layout, spacing, typography } from '../../src/theme';
import { flush, track } from '../../src/services/analytics';

/**
 * 14-qadam: yakuniy ekran.
 *
 * Bu ekran yakun emas, o'tish nuqtasi: foydalanuvchi shu yerdan subsidiya
 * arizasiga, ariza holatiga yoki kabinetga o'tadi.
 */
export default function DoneStep() {
  const t = useT();
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const reset = useOnboarding((s) => s.reset);

  /*
   * To'lov yo'li: subsidiya orqali yoki o'zi to'laydi. Shunga qarab
   * quyidagi tugma o'zgaradi.
   */
  const profile = useProfile();
  const selfPaid = profile.data?.paymentMethod === 'SELF';

  /* Anketa yakunlandi — voronkaning eng muhim nuqtasi */
  useEffect(() => {
    track('onboarding.completed');
    // Foydalanuvchi shu yerdan ilovani yopishi mumkin — darhol yuboramiz
    void flush();
  }, []);

  /*
   * Ariza raqami SERVERDAN olinadi.
   *
   * Ilgari u foydalanuvchi identifikatoridan yasalardi — bazada bunday
   * ariza yo'q edi, ya'ni raqam ko'rsatilar, lekin operator uni topa
   * olmasdi. Endi raqam anketa yakunlanganda yaratilgan yozuvdan keladi.
   */
  const application = useSellerApplication();

  /*
   * Har doim avval kabinetga o'tamiz, keyin kerakli ekranni USTIGA
   * qo'yamiz: to'g'ridan-to'g'ri almashtirilsa tarix bo'sh qoladi va
   * foydalanuvchi orqaga qaytadigan joysiz qamalib qoladi.
   */
  const finish = async (to?: '/application' | '/subsidy/online-mahalla' | '/payment') => {
    await completeOnboarding();
    reset();
    router.replace('/(tabs)');
    if (to) router.push(to);
  };

  return (
    <View style={layout.screenClear}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Text style={styles.counter}>{t('step.of', { current: TOTAL_STEPS, total: TOTAL_STEPS })}</Text>
          <View style={styles.mark}>
            <Ionicons name="checkmark" size={48} color="#06301A" />
          </View>

          <Text style={[typography.display, styles.center, styles.title]}>{t('done.title')}</Text>
          <Text style={[typography.body, styles.center]}>{t('done.text')}</Text>

          <Card style={styles.numberCard}>
            <Text style={typography.caption}>{t('done.applicationNo')}</Text>
            <Text style={styles.number}>{application.data?.number ?? '…'}</Text>
          </Card>

          <View style={{ flex: 1 }} />

          <View style={styles.actions}>
            {/*
              Keyingi qadam TO'LOV YO'LIGA bog'liq.

              Subsidiya yo'lidagilar uchun — subsidiya arizasi.
              O'zi to'laydiganlar uchun — xizmat to'lovi: ularga subsidiya
              arizasini taklif qilish xato bo'lardi, chunki ular subsidiya
              olmaydi va o'sha yo'l ular uchun umuman yopiq.

              Mahsulot qo'shishni bu yerda taklif qilmaymiz: u to'lov
              tasdiqlangandan keyin ochiladi, ya'ni yopiq eshik bo'lardi.
            */}
            {selfPaid ? (
              <Button
                title={t('pay.title')}
                variant="gold"
                icon="card-outline"
                onPress={() => void finish('/payment')}
              />
            ) : (
              <Button
                title={t('mahalla.entry')}
                variant="gold"
                icon="document-text-outline"
                onPress={() => void finish('/subsidy/online-mahalla')}
              />
            )}
            <Button
              title={t('done.status')}
              icon="time-outline"
              onPress={() => void finish('/application')}
            />
            <Button
              title={t('done.cabinet')}
              variant="secondary"
              onPress={() => void finish()}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.lg },
  center: { textAlign: 'center' },
  counter: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  mark: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#5FD98A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.xl, marginBottom: spacing.sm },
  numberCard: { marginTop: spacing['2xl'], alignItems: 'center', gap: spacing.xs },
  number: { color: colors.primary, fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  actions: { gap: spacing.md },
});
