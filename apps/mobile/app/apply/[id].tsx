import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { DocumentType } from '@ecwt/types';

import {
  useApplication,
  useAttachDocument,
  useDocuments,
  useProfile,
  useSubmitApplication,
  useSubsidy,
  useUpdateApplication,
  useUploadDocument,
} from '../../src/api/queries';
import {
  Button,
  Card,
  Chip,
  InfoBanner,
  LoadingView,
  ProgressBar,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { TextField } from '../../src/components/form';
import { colors, formatSom, layout, radius, spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { documentLabel } from '../../src/constants/documents';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';

const TOTAL_STEPS = 6;

export default function ApplyWizard() {
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const application = useApplication(id);
  const subsidy = useSubsidy(application.data?.subsidyId ?? '');
  const profile = useProfile();
  const documents = useDocuments();

  const updateApplication = useUpdateApplication(id);
  const attachDocument = useAttachDocument(id);
  const uploadDocument = useUploadDocument();
  const submit = useSubmitApplication(id);

  const [step, setStep] = useState(1);
  const [expense, setExpense] = useState('');
  const [consent, setConsent] = useState(false);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  const app = application.data;
  const s = subsidy.data;
  const p = profile.data;

  const needsExpense = useMemo(
    () => s?.amountType === 'PERCENT_OF_EXPENSE' || s?.requirements.some((r) => r.type === 'MARKETPLACE_EXPENSE'),
    [s],
  );

  const attachedTypes = useMemo(
    () => new Set((app?.documents ?? []).map((d) => d.documentType)),
    [app],
  );

  if (application.isLoading || subsidy.isLoading || profile.isLoading) {
    return <Screen><LoadingView /></Screen>;
  }
  if (!app || !s || !p) {
    return (
      <Screen>
        <Text style={typography.body}>Ariza topilmadi</Text>
      </Screen>
    );
  }

  const isResubmit = app.status === 'NEEDS_CORRECTION';
  const missingDocs = s.requiredDocuments.filter((d) => !d.isOptional && !attachedTypes.has(d.documentType));

  /* ----------------------------- hujjat yuklash ---------------------------- */

  const pickAndUpload = async (docType: DocumentType, source: 'file' | 'photo') => {
    try {
      setUploadingType(docType);
      let asset: { uri: string; name: string; mimeType: string } | null = null;

      if (source === 'file') {
        const res = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/jpeg', 'image/png'],
          copyToCacheDirectory: true,
        });
        if (res.canceled || !res.assets[0]) return;
        const a = res.assets[0];
        asset = { uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf' };
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Ruxsat kerak', 'Rasm tanlash uchun galereyaga ruxsat bering.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
        if (res.canceled || !res.assets[0]) return;
        const a = res.assets[0];
        asset = {
          uri: a.uri,
          name: a.fileName ?? `photo-${Date.now()}.jpg`,
          mimeType: a.mimeType ?? 'image/jpeg',
        };
      }

      const form = new FormData();
      form.append('type', docType);
      /*
       * Expo SDK 57'ning `fetch`i FormData qismi Blob (yoki shunga teng)
       * bo'lishini talab qiladi — eski `{ uri, name, type }` obyekti
       * "Unsupported FormDataPart implementation" xatosi bilan yiqilardi.
       */
      form.append('file', new File(asset.uri), asset.name);

      const uploaded = await uploadDocument.mutateAsync(form);
      await attachDocument.mutateAsync(uploaded.id);
      toastSuccess('Hujjat biriktirildi');
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : 'Hujjatni yuklab bo‘lmadi');
    } finally {
      setUploadingType(null);
    }
  };

  const attachExisting = async (docType: DocumentType) => {
    const candidates = (documents.data ?? []).filter((d) => d.type === docType);
    if (!candidates.length) {
      Alert.alert('Hujjat yo‘q', 'Bu turdagi hujjat hali yuklanmagan.');
      return;
    }
    await attachDocument.mutateAsync(candidates[0]!.id);
  };

  /* -------------------------------- yuborish ------------------------------- */

  const saveExtras = async () => {
    if (!needsExpense) return;
    const value = Number(expense.replace(/\D/g, ''));
    if (!value) return;
    await updateApplication.mutateAsync({ formData: { expense: value } });
  };

  const doSubmit = async () => {
    try {
      await saveExtras();
      await submit.mutateAsync({
        resubmit: isResubmit,
        // E-IMZO ulanmagani uchun ilova ichida tasdiqlash tokeni ishlatiladi
        signatureToken: `in-app-${Date.now()}`,
      });
      toastSuccess(isResubmit ? 'Ariza qayta yuborildi' : 'Ariza yuborildi');
      router.replace(`/applications/${id}`);
    } catch (err) {
      toastError(
        err instanceof EcwtApiError ? err.message : 'Arizani yuborib bo‘lmadi. Qayta urinib ko‘ring.',
      );
    }
  };

  const next = async () => {
    if (step === 4) await saveExtras();
    setStep((v) => Math.min(TOTAL_STEPS, v + 1));
  };

  const canGoNext =
    step === 4 ? missingDocs.length === 0 && (!needsExpense || Number(expense.replace(/\D/g, '')) > 0) : true;

  return (
    <Screen contentStyle={{ paddingBottom: spacing['4xl'] }}>
      {/* Progress */}
      <View style={[layout.rowBetween, { marginBottom: spacing.sm }]}>
        <Text style={typography.caption}>{t('wizard.step', { current: step, total: TOTAL_STEPS })}</Text>
        <Text style={typography.caption}>{app.number}</Text>
      </View>
      <ProgressBar percent={(step / TOTAL_STEPS) * 100} height={6} />

      <Text style={[typography.h2, { marginTop: spacing.lg }]}>{stepTitle(step, t)}</Text>
      <Text style={[typography.small, { marginBottom: spacing.lg }]}>{s.title}</Text>

      {isResubmit && app.correctionNote ? (
        <View style={{ marginBottom: spacing.lg }}>
          <InfoBanner text={`Tuzatish talab qilindi: ${app.correctionNote}`} tone="warning" />
        </View>
      ) : null}

      {/* ---- 1: Shaxsiy ---- */}
      {step === 1 ? (
        <>
          <InfoBanner text={t('wizard.autofilled')} tone="info" />
          <Card style={{ marginTop: spacing.lg }}>
            <ReadRow label={t('profile.lastName')} value={p.lastName} />
            <ReadRow label={t('profile.firstName')} value={p.firstName} />
            <ReadRow label={t('profile.middleName')} value={p.middleName} />
            <ReadRow label={t('profile.birthDate')} value={p.birthDate} />
            <ReadRow label={t('profile.pinfl')} value={p.pinfl} />
            <ReadRow label={t('profile.region')} value={p.region} />
            <ReadRow label={t('profile.district')} value={p.district} last />
          </Card>
          <View style={{ marginTop: spacing.md }}>
            <Button
              title={t('wizard.editProfile')}
              variant="ghost"
              onPress={() => router.push('/profile/personal')}
            />
          </View>
        </>
      ) : null}

      {/* ---- 2: Hunarmand ---- */}
      {step === 2 ? (
        <>
          <Card>
            <ReadRow label={t('profile.craftCategory')} value={p.craftCategory?.nameUz ?? null} />
            <ReadRow
              label={t('profile.experience')}
              value={p.yearsOfExperience ? `${p.yearsOfExperience} yil` : null}
            />
            <ReadRow label={t('profile.businessType')} value={businessLabel(p.businessType)} />
            <ReadRow label={t('profile.stir')} value={p.stir} />
            <ReadRow label={t('profile.membership')} value={membershipLabel(p.membershipStatus)} />
            <ReadRow
              label={t('profile.apprentices')}
              value={p.apprenticeCount ? String(p.apprenticeCount) : '0'}
              last
            />
          </Card>
          <View style={{ marginTop: spacing.md }}>
            <Button
              title={t('wizard.editProfile')}
              variant="ghost"
              onPress={() => router.push('/profile/craft')}
            />
          </View>
        </>
      ) : null}

      {/* ---- 3: Bank ---- */}
      {step === 3 ? (
        <>
          <Card>
            <ReadRow label={t('profile.bankHolder')} value={p.bankHolderName} />
            <ReadRow label={t('profile.bankAccount')} value={p.bankAccount} />
            <ReadRow label={t('profile.bankMfo')} value={p.bankMfo} />
            <ReadRow label={t('profile.bankCard')} value={p.bankCardMasked} last />
          </Card>
          {!p.bankAccount && !p.bankCardMasked ? (
            <View style={{ marginTop: spacing.lg }}>
              <InfoBanner text="Bank rekviziti kiritilmagan — subsidiya to‘lovi shu hisobga o‘tkaziladi." tone="danger" />
              <View style={{ height: spacing.md }} />
              <Button title="Rekvizit qo‘shish" onPress={() => router.push('/profile/bank')} />
            </View>
          ) : (
            <View style={{ marginTop: spacing.md }}>
              <Button
                title={t('wizard.editProfile')}
                variant="ghost"
                onPress={() => router.push('/profile/bank')}
              />
            </View>
          )}
        </>
      ) : null}

      {/* ---- 4: Hujjatlar ---- */}
      {step === 4 ? (
        <>
          {needsExpense ? (
            <View style={{ marginBottom: spacing.lg }}>
              <TextField
                label="Xarajat summasi"
                value={expense}
                onChangeText={setExpense}
                keyboardType="number-pad"
                placeholder="0"
                hint={`Subsidiya shu summaning ${s.amountFactor ?? 50}% i sifatida hisoblanadi`}
              />
            </View>
          ) : null}

          {s.requiredDocuments.map((d) => {
            const attached = attachedTypes.has(d.documentType);
            const busy = uploadingType === d.documentType;
            return (
              <Card key={d.id} style={{ marginBottom: spacing.md }}>
                <View style={[layout.rowBetween, { marginBottom: spacing.sm }]}>
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text style={typography.bodyStrong}>{d.title}</Text>
                    {d.hint ? <Text style={typography.caption}>{d.hint}</Text> : null}
                  </View>
                  <Chip
                    label={attached ? 'Yuklandi' : d.isOptional ? t('common.optional') : t('common.required')}
                    tone={attached ? 'success' : d.isOptional ? 'neutral' : 'warning'}
                  />
                </View>
                {!attached ? (
                  <View style={[layout.row, { gap: spacing.sm }]}>
                    <Button
                      title="Fayl"
                      icon="document-outline"
                      variant="secondary"
                      fullWidth={false}
                      loading={busy}
                      onPress={() => void pickAndUpload(d.documentType, 'file')}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Rasm"
                      icon="image-outline"
                      variant="secondary"
                      fullWidth={false}
                      loading={busy}
                      onPress={() => void pickAndUpload(d.documentType, 'photo')}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : null}
                {!attached && (documents.data ?? []).some((x) => x.type === d.documentType) ? (
                  <Pressable onPress={() => void attachExisting(d.documentType)} style={{ marginTop: spacing.sm }}>
                    <Text style={{ color: colors.primary, fontSize: 13 }}>{t('wizard.selectExisting')}</Text>
                  </Pressable>
                ) : null}
              </Card>
            );
          })}

          <Text style={typography.caption}>{t('documents.limits')}</Text>
        </>
      ) : null}

      {/* ---- 5: Preview ---- */}
      {step === 5 ? (
        <>
          <Card>
            <Text style={[typography.h3, { marginBottom: spacing.md }]}>{s.title}</Text>
            <ReadRow label={t('application.number')} value={app.number} />
            <ReadRow
              label="Ariza beruvchi"
              value={[p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ')}
            />
            <ReadRow label={t('profile.pinfl')} value={p.pinfl} />
            <ReadRow label={t('profile.bankAccount')} value={p.bankAccount ?? p.bankCardMasked} />
            {needsExpense ? (
              <ReadRow label="Xarajat summasi" value={formatSom(Number(expense.replace(/\D/g, '')))} />
            ) : null}
            <ReadRow
              label={t('application.requestedAmount')}
              value={formatSom(app.requestedAmount)}
              last
            />
          </Card>

          <SectionHeader title={t('subsidy.documents')} />
          <Card>
            {(app.documents ?? []).map((d, i, arr) => (
              <View
                key={d.id}
                style={[styles.docRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[typography.body, { flex: 1 }]} numberOfLines={1}>
                  {documentLabel(d.documentType)}
                </Text>
              </View>
            ))}
            {!app.documents.length ? <Text style={typography.small}>Hujjat biriktirilmagan</Text> : null}
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            <InfoBanner text={t('subsidy.estimatedNote')} tone="info" />
          </View>
        </>
      ) : null}

      {/* ---- 6: Rozilik ---- */}
      {step === 6 ? (
        <>
          <Card>
            <Pressable onPress={() => setConsent((v) => !v)} style={[layout.row, { gap: spacing.md }]}>
              <View style={[styles.checkbox, consent && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {consent ? <Ionicons name="checkmark" size={16} color={colors.textInverse} /> : null}
              </View>
              <Text style={[typography.body, { flex: 1 }]}>{t('wizard.consent')}</Text>
            </Pressable>
          </Card>

          <SectionHeader title={t('wizard.signHint')} />
          <InfoBanner text={t('wizard.mockSignature')} tone="warning" icon="construct-outline" />

          <View style={{ marginTop: spacing.xl }}>
            <Button
              title={isResubmit ? t('application.resubmit') : t('application.submit')}
              onPress={doSubmit}
              disabled={!consent}
              loading={submit.isPending}
              icon="shield-checkmark-outline"
            />
          </View>
        </>
      ) : null}

      {/* Navigatsiya */}
      {step < TOTAL_STEPS ? (
        <View style={[layout.row, { gap: spacing.md, marginTop: spacing['2xl'] }]}>
          {step > 1 ? (
            <Button
              title={t('common.back')}
              variant="secondary"
              onPress={() => setStep((v) => v - 1)}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          ) : null}
          <Button
            title={t('common.next')}
            onPress={next}
            disabled={!canGoNext}
            fullWidth={false}
            style={{ flex: 2 }}
          />
        </View>
      ) : (
        <View style={{ marginTop: spacing.lg }}>
          <Button title={t('common.back')} variant="ghost" onPress={() => setStep((v) => v - 1)} />
        </View>
      )}

      {step === 4 && missingDocs.length ? (
        <Text style={[typography.caption, { color: colors.warning, marginTop: spacing.md }]}>
          {t('application.documentsMissing')}: {missingDocs.map((d) => d.title).join(', ')}
        </Text>
      ) : null}
    </Screen>
  );
}

function stepTitle(step: number, t: ReturnType<typeof useT>): string {
  const keys = [
    'wizard.step1',
    'wizard.step2',
    'wizard.step3',
    'wizard.step4',
    'wizard.step5',
    'wizard.step6',
  ] as const;
  return t(keys[step - 1] ?? 'wizard.step1');
}

function businessLabel(type: string): string {
  return { NONE: 'Yo‘q', YATT: 'YaTT', MCHJ: 'MChJ', FAMILY_ENTERPRISE: 'Oilaviy korxona' }[type] ?? type;
}

function membershipLabel(status: string): string {
  return (
    { NONE: 'A’zo emas', PENDING: 'Kutilmoqda', ACTIVE: 'Faol a’zo', EXPIRED: 'Muddati tugagan' }[
      status
    ] ?? status
  );
}

function ReadRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  return (
    <View style={[styles.readRow, last && { borderBottomWidth: 0 }]}>
      <Text style={[typography.caption, { flex: 1 }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { flex: 1.4, textAlign: 'right' }]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  docRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
