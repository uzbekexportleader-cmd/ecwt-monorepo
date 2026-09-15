import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../src/components/AppText';
import { Button, Card } from '../../src/components/ui';
import { StepNav } from '../../src/components/StepNav';
import { useApplications } from '../../src/api/queries';
import { TOTAL_STEPS } from '../../src/components/StepScreen';
import { useOnboarding } from '../../src/store/onboarding';
import { toastError } from '../../src/store/toast';
import { EcwtApiError } from '../../src/api/client';
import { useT } from '../../src/i18n';
import { colors, layout, radius, spacing, typography } from '../../src/theme';

type Decision = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * 13-qadam: subsidiya arizasi holati.
 *
 * Ariza yuborilgach shu ekran ochiladi. Qaror kelmaguncha holat "ko'rib
 * chiqilmoqda" bo'lib turadi; rad etilsa foydalanuvchi yo'qolib ketmasligi
 * uchun uchta yo'l taklif qilinadi.
 */
export default function SubsidyStatusStep() {
  const t = useT();
  const router = useRouter();
  const applications = useApplications();
  const { saveStep, saving } = useOnboarding();

  /** Subsidiya rad etilgan — hunarmand xizmat haqini o'zi to'laydi */
  const chooseSelfPayment = async () => {
    try {
      await saveStep({ paymentMethod: 'SELF' }, 'CONTRACT');
      router.replace('/(setup)/contract');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  /**
   * Qaror haqiqiy ariza holatidan olinadi.
   *
   * Ariza hali yo'q bo'lsa (yoki ko'rib chiqilayotgan bo'lsa) — kutilmoqda.
   * Bu yerda hech narsa o'ylab topilmaydi: server nima desa, shu ko'rsatiladi.
   */
  const latest = applications.data?.[0];
  const decision: Decision =
    latest?.status === 'APPROVED' || latest?.status === 'PAID'
      ? 'APPROVED'
      : latest?.status === 'REJECTED'
        ? 'REJECTED'
        : 'PENDING';

  const rejectionReason = decision === 'REJECTED' ? latest?.rejectionReason : null;

  const timeline: { key: string; label: string; state: 'done' | 'active' | 'todo' }[] = [
    { key: 'received', label: t('status.received'), state: 'done' },
    { key: 'checking', label: t('status.checking'), state: 'active' },
    { key: 'decision', label: t('status.decision'), state: 'todo' },
  ];

  return (
    <View style={layout.screenClear}>
      <SafeAreaView style={styles.safe}>
        <StepNav onBack={() => router.replace('/(setup)/contract')} />

        <View style={styles.body}>
          <Text style={styles.counter}>{t('step.of', { current: 9, total: TOTAL_STEPS })}</Text>
          <Text style={[typography.display, styles.title]}>
            {decision === 'APPROVED'
              ? t('status.approvedTitle')
              : decision === 'REJECTED'
                ? t('status.rejectedTitle')
                : t('status.title')}
          </Text>

          <Card style={styles.timeline}>
            {timeline.map((item) => (
              <View key={item.key} style={styles.row}>
                <Ionicons
                  name={
                    item.state === 'done'
                      ? 'checkmark-circle'
                      : item.state === 'active'
                        ? 'ellipse'
                        : 'ellipse-outline'
                  }
                  size={22}
                  color={
                    item.state === 'done'
                      ? '#3ED598'
                      : item.state === 'active'
                        ? colors.primary
                        : colors.textMuted
                  }
                />
                <Text
                  style={[
                    typography.body,
                    item.state === 'todo' && { color: colors.textMuted },
                    item.state !== 'todo' && { color: colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </Card>

          {rejectionReason ? (
            <Card style={styles.reason}>
              <Text style={typography.caption}>{t('application.rejectionReason')}</Text>
              <Text style={[typography.body, { marginTop: spacing.xs }]}>{rejectionReason}</Text>
            </Card>
          ) : null}

          <View style={{ flex: 1 }} />

          {decision === 'REJECTED' ? (
            <View style={styles.actions}>
              <Button
                title={t('status.fixData')}
                onPress={() => router.replace('/(setup)/personal')}
              />
              <Button
                title={t('status.reapply')}
                variant="secondary"
                onPress={() => router.replace('/(setup)/payment')}
              />
              {/*
                "O'zim to'layman" — to'lov usulini darhol SELF qilib
                shartnomaga o'tadi. Ilgari bu tugma ham to'lov tanlash
                ekraniga qaytarardi, ya'ni yuqoridagi tugmadan farq qilmasdi.
              */}
              <Button
                title={t('status.payMyself')}
                variant="secondary"
                loading={saving}
                onPress={() => void chooseSelfPayment()}
              />
            </View>
          ) : (
            <View style={styles.actions}>
              <Button
                title={decision === 'APPROVED' ? t('status.approvedCta') : t('done.track')}
                onPress={() => router.replace('/(setup)/done')}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  counter: { color: colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, marginTop: spacing.lg },
  title: { marginTop: spacing.sm },
  timeline: { marginTop: spacing['2xl'], gap: spacing.lg, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reason: { marginTop: spacing.lg },
  actions: { gap: spacing.md },
});
