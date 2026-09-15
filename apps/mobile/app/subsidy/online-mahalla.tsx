import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import type { MahallaFieldDto, MahallaFormStep } from '@ecwt/types';

import { Text } from '../../src/components/AppText';
import {
  useMahallaHandoff,
  useMahallaPacket,
  useMahallaSubmission,
} from '../../src/api/queries';
import { Button, Card, ErrorView, InfoBanner, LoadingView, Screen } from '../../src/components/ui';
import { TextField } from '../../src/components/form';
import { toastError, toastInfo, toastSuccess } from '../../src/store/toast';
import { EcwtApiError } from '../../src/api/client';
import { colors, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

/**
 * online-mahalla.uz ga subsidiya arizasini topshirishga yordam.
 *
 * Ilova arizani foydalanuvchi O'RNIGA topshirmaydi: OneID ga kirish va
 * ommaviy oferta bilan rozilik — shaxsning o'z harakati, uni bot bajarsa
 * hujjatni ko'rmagan odam javobgar bo'lib qoladi. Shuning o'rniga ilova
 * og'ir ishni bajaradi: har bir maydonga tayyor qiymat beradi, nusxalash
 * bir bosishda bo'ladi, keyin ariza raqami saqlanib kuzatiladi.
 */

const STEP_TITLE: Record<MahallaFormStep, string> = {
  APPLICANT: '1-qadam — Аризачи',
  ADDRESS: '2-qadam — Манзил',
  REQUISITES: '3-qadam — Реквизитлар',
};

const STEPS: MahallaFormStep[] = ['APPLICANT', 'ADDRESS', 'REQUISITES'];

export default function OnlineMahallaScreen() {
  const t = useT();
  const router = useRouter();
  const packet = useMahallaPacket();
  const handoff = useMahallaHandoff();
  const submission = useMahallaSubmission();

  const [applicationNumber, setApplicationNumber] = useState('');
  const [numberError, setNumberError] = useState<string | null>(null);

  if (packet.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  if (packet.isError || !packet.data) {
    return (
      <Screen clear>
        <ErrorView message={t('common.error')} onRetry={() => void packet.refetch()} />
      </Screen>
    );
  }

  const data = packet.data;
  const saved = data.submission;

  const copy = async (field: MahallaFieldDto) => {
    if (!field.value) return;
    await Clipboard.setStringAsync(field.value);
    toastInfo(t('mahalla.copied'));
  };

  const openSite = async () => {
    // Saytga o'tish qayd etiladi — lekin bu hali "topshirildi" emas
    await handoff.mutateAsync().catch(() => undefined);
    await WebBrowser.openBrowserAsync(data.url);
  };

  const saveNumber = async () => {
    if (applicationNumber.trim().length < 3) {
      setNumberError(t('mahalla.numberRequired'));
      return;
    }
    setNumberError(null);
    try {
      await submission.mutateAsync({ externalNumber: applicationNumber.trim() });
      setApplicationNumber('');
      toastSuccess(t('mahalla.numberSaved'));
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('common.error'));
    }
  };

  return (
    <Screen clear>
      <Text style={typography.h3}>{t('mahalla.title')}</Text>
      <Text style={[typography.small, { marginTop: spacing.xs }]}>{t('mahalla.intro')}</Text>

      {/*
       * Chegara ochiq aytiladi: foydalanuvchi "AI mening o'rnimga kirib
       * topshiradi" deb kutib qolmasligi kerak.
       */}
      <View style={{ marginTop: spacing.lg }}>
        <InfoBanner tone="warning" text={t('mahalla.limit')} />
      </View>

      {data.missing.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <InfoBanner
            tone="danger"
            icon="alert-circle-outline"
            text={`${t('mahalla.missing')}: ${data.missing.join(', ')}`}
          />
        </View>
      ) : null}

      {saved?.externalNumber ? (
        <Card style={styles.savedCard}>
          <Text style={typography.caption}>{t('mahalla.savedNumber')}</Text>
          <Text style={styles.savedNumber}>{saved.externalNumber}</Text>
          <Text style={typography.caption}>{t('mahalla.savedHint')}</Text>
        </Card>
      ) : null}

      {/*
        Ariza topshirilgach keyingi qadam aniq bo'lsin: hunarmand kutib
        qolmasin, kim bilan gaplashishini bilsin.
      */}
      {saved?.externalNumber ? (
        <View style={{ marginTop: spacing.md }}>
          <InfoBanner text={t('mahalla.specialists')} tone="success" icon="people-outline" />
          <View style={{ marginTop: spacing.md }}>
            <Button
              title={t('pay.open')}
              variant="secondary"
              icon="card-outline"
              onPress={() => router.push('/payment')}
            />
          </View>
        </View>
      ) : null}

      {STEPS.map((step) => {
        const fields = data.fields.filter((f) => f.step === step);
        if (fields.length === 0) return null;
        return (
          <View key={step} style={{ marginTop: spacing.xl }}>
            <Text style={typography.label}>{STEP_TITLE[step]}</Text>
            {fields.map((field) => (
              <Card key={field.key} style={styles.fieldCard}>
                <Text style={typography.caption}>{field.label}</Text>

                {field.value ? (
                  <Pressable onPress={() => void copy(field)} style={styles.valueRow}>
                    <Text style={[typography.body, { flex: 1 }]}>{field.value}</Text>
                    <Ionicons name="copy-outline" size={18} color={colors.primary} />
                  </Pressable>
                ) : !field.fixRoute ? (
                  /*
                   * Qiymati yo'q, lekin ilovada tuzatiladigan joyi ham yo'q —
                   * demak bu maydonni foydalanuvchi saytda o'zi kiritadi.
                   * Uni "to'ldirilmagan" deb qizil ko'rsatish xato taassurot
                   * beradi: hech narsa buzilmagan.
                   */
                  <Text style={[typography.body, { color: colors.textMuted }]}>
                    {t('mahalla.youFill')}
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => field.fixRoute && router.push(field.fixRoute as never)}
                    style={styles.valueRow}
                  >
                    <Text style={[typography.body, { flex: 1, color: colors.danger }]}>
                      {t('mahalla.empty')}
                    </Text>
                    {field.fixRoute ? (
                      <Ionicons name="chevron-forward" size={18} color={colors.danger} />
                    ) : null}
                  </Pressable>
                )}

                {field.hint ? <Text style={typography.caption}>{field.hint}</Text> : null}
              </Card>
            ))}
          </View>
        );
      })}

      <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
        <Button
          title={t('mahalla.open')}
          variant="gold"
          icon="open-outline"
          onPress={() => void openSite()}
          loading={handoff.isPending}
        />
      </View>

      <Text style={[typography.label, { marginTop: spacing['2xl'] }]}>
        {t('mahalla.afterTitle')}
      </Text>
      <Text style={[typography.small, { marginBottom: spacing.md }]}>{t('mahalla.afterHint')}</Text>
      <TextField
        label={t('mahalla.numberLabel')}
        value={applicationNumber}
        onChangeText={setApplicationNumber}
        error={numberError ?? undefined}
      />
      <View style={{ marginTop: spacing.md }}>
        <Button
          title={t('mahalla.numberSave')}
          onPress={() => void saveNumber()}
          loading={submission.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  savedCard: { marginTop: spacing.lg, gap: spacing.xs },
  savedNumber: { color: colors.primary, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  fieldCard: { marginTop: spacing.sm, gap: spacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
