import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import type { ServicePaymentStatus } from '@ecwt/types';

import { Text } from '../src/components/AppText';
import {
  useServicePayment,
  useSubmitPaymentProof,
  useSubsidyArrived,
  useUploadDocument,
} from '../src/api/queries';
import { Button, Card, ErrorView, InfoBanner, LoadingView, Screen, SectionHeader } from '../src/components/ui';
import { TextField } from '../src/components/form';
import { toastError, toastInfo, toastSuccess } from '../src/store/toast';
import { EcwtApiError } from '../src/api/client';
import { colors, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * ECWT xizmat to'lovi.
 *
 * Yo'l: subsidiya bank hisobiga tushadi → hunarmand kelishilgan summani
 * ECWT hisobiga o'tkazadi → o'tkazma hujjatini yuklaydi → operator
 * tekshiradi → savdo bo'limlari ochiladi.
 *
 * "To'landi" holatini ilova ham, foydalanuvchi ham qo'ya olmaydi: uni
 * faqat operator, yuklangan hujjatni ko'rgandan keyin qo'yadi.
 */

const TONE: Record<ServicePaymentStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  AWAITING_SUBSIDY: 'info',
  AWAITING_TRANSFER: 'warning',
  PROOF_SUBMITTED: 'info',
  CONFIRMED: 'success',
  REJECTED: 'danger',
};

export default function PaymentScreen() {
  const t = useT();
  const payment = useServicePayment();
  const arrived = useSubsidyArrived();
  const upload = useUploadDocument();
  const submitProof = useSubmitPaymentProof();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (payment.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  if (payment.isError || !payment.data) {
    return (
      <Screen clear>
        <ErrorView message={t('common.error')} onRetry={() => void payment.refetch()} />
      </Screen>
    );
  }

  const p = payment.data;

  const copy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    toastInfo(t('mahalla.copied'));
  };

  /** Chek yoki to'lov topshirig'ini tanlab, serverga yuklaydi */
  const pickAndSubmit = async () => {
    const sum = Number(amount.replace(/\D/g, ''));
    if (!sum) {
      toastError(t('pay.amountRequired'));
      return;
    }

    try {
      setBusy(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      let asset: { uri: string; name: string } | null = null;
      if (!res.canceled && res.assets[0]) {
        asset = { uri: res.assets[0].uri, name: res.assets[0].name };
      } else if (res.canceled) {
        // Fayl tanlanmadi — galereyani taklif qilamiz
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
        const img = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
        if (img.canceled || !img.assets[0]) return;
        asset = {
          uri: img.assets[0].uri,
          name: img.assets[0].fileName ?? `chek-${Date.now()}.jpg`,
        };
      }
      if (!asset) return;

      const form = new FormData();
      form.append('type', 'OTHER');
      form.append('file', new File(asset.uri), asset.name);
      const document = await upload.mutateAsync(form);

      await submitProof.mutateAsync({
        documentId: document.id,
        amount: sum,
        note: note.trim() || undefined,
      });
      setAmount('');
      setNote('');
      toastSuccess(t('pay.proofSent'));
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('pay.uploadFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmArrived = () =>
    Alert.alert(t('pay.arrivedTitle'), t('pay.arrivedAsk'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        onPress: () => {
          arrived.mutate(undefined, {
            onError: (e) => toastError(e instanceof EcwtApiError ? e.message : t('common.error')),
          });
        },
      },
    ]);

  return (
    <Screen
      clear
      refreshControl={
        <RefreshControl
          refreshing={payment.isFetching && !payment.isLoading}
          onRefresh={() => void payment.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={typography.h1}>{t('pay.title')}</Text>

      <View style={{ marginTop: spacing.md }}>
        <InfoBanner text={t(`pay.st.${p.status}`)} tone={TONE[p.status]} />
      </View>

      {p.reviewerNote ? (
        <Card style={{ marginTop: spacing.md, gap: spacing.xs }}>
          <Text style={typography.caption}>{t('pay.reviewerNote')}</Text>
          <Text style={typography.body}>{p.reviewerNote}</Text>
        </Card>
      ) : null}

      {/* 1-qadam: subsidiya kelishini kutamiz */}
      {p.status === 'AWAITING_SUBSIDY' ? (
        <>
          <Card style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Text style={typography.body}>{t('pay.step1')}</Text>
            <Button
              title={t('pay.arrivedTitle')}
              icon="checkmark-circle-outline"
              onPress={confirmArrived}
              loading={arrived.isPending}
            />
          </Card>
        </>
      ) : null}

      {/* 2-qadam: rekvizitlar va hujjat */}
      {p.payee ? (
        <>
          <SectionHeader title={t('pay.requisites')} />
          <Card style={{ gap: spacing.sm }}>
            <Text style={typography.small}>{t('pay.requisitesHint')}</Text>
            <Field label={t('pay.payee')} value={p.payee.name} onCopy={copy} />
            <Field label={t('profile.bankAccount')} value={p.payee.account} onCopy={copy} />
            <Field label={t('profile.bankMfo')} value={p.payee.mfo} onCopy={copy} />
            <Field label={t('profile.bank')} value={p.payee.bank} onCopy={copy} />
            {p.payee.note ? <Text style={typography.caption}>{p.payee.note}</Text> : null}
          </Card>

          <SectionHeader title={t('pay.proof')} />
          <Card style={{ gap: spacing.md }}>
            <Text style={typography.small}>{t('pay.proofHint')}</Text>
            <TextField
              label={t('pay.amount')}
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
            <TextField label={t('pay.note')} value={note} onChangeText={setNote} multiline />
            <Button
              title={t('pay.attach')}
              icon="document-attach-outline"
              onPress={() => void pickAndSubmit()}
              loading={busy || upload.isPending || submitProof.isPending}
            />
          </Card>
        </>
      ) : null}

      {/* 3-qadam: tekshiruvda */}
      {p.status === 'PROOF_SUBMITTED' ? (
        <Card style={{ marginTop: spacing.lg, gap: spacing.xs }}>
          <Text style={typography.body}>{t('pay.checking')}</Text>
          {p.declaredAmount ? (
            <Text style={typography.caption}>
              {t('pay.amount')}: {p.declaredAmount.toLocaleString('uz-UZ')}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {/* 4-qadam: ochildi */}
      {p.unlocked ? (
        <Card style={{ marginTop: spacing.lg, gap: spacing.xs }}>
          <View style={styles.row}>
            <Ionicons name="lock-open-outline" size={22} color={colors.success} />
            <Text style={[typography.bodyStrong, { flex: 1 }]}>{t('pay.unlocked')}</Text>
          </View>
          <Text style={typography.caption}>{t('pay.unlockedHint')}</Text>
        </Card>
      ) : null}

      {p.history.length ? (
        <>
          <SectionHeader title={t('app.history')} />
          {p.history.map((e, i) => (
            <View key={`${e.createdAt}-${i}`} style={styles.historyRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>{t(`pay.st.${e.status}`)}</Text>
                {e.note ? <Text style={typography.caption}>{e.note}</Text> : null}
                <Text style={typography.caption}>
                  {new Date(e.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

function Field({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string | null;
  onCopy: (v: string) => Promise<void>;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={typography.caption}>{label}</Text>
      {value ? (
        <Pressable onPress={() => void onCopy(value)} style={styles.row}>
          <Text style={[typography.body, { flex: 1 }]}>{value}</Text>
          <Ionicons name="copy-outline" size={18} color={colors.primary} />
        </Pressable>
      ) : (
        <Text style={[typography.body, { color: colors.textMuted }]}>—</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: colors.primary },
});
