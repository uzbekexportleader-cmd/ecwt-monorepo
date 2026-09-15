import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { Text } from '../../src/components/AppText';
import { StepScreen } from '../../src/components/StepScreen';
import { Button } from '../../src/components/ui';
import { API_URL, EcwtApiError, api } from '../../src/api/client';
import { useOnboarding } from '../../src/store/onboarding';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import { colors, radius, spacing, typography } from '../../src/theme';

/**
 * 12-qadam: shartnoma.
 *
 * Foydalanuvchi shartnomani yuklab oladi, imzolaydi va skanerini qayta
 * yuklaydi. Yuklangan fayl `SIGNED_CONTRACT` turi bilan saqlanadi.
 */
export default function ContractStep() {
  const t = useT();
  const router = useRouter();
  const { draft, saveStep, saving } = useOnboarding();
  const [uploaded, setUploaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const steps = [t('contract.how1'), t('contract.how2'), t('contract.how3'), t('contract.how4')];

  const download = async () => {
    const url = `${API_URL}/contracts/template`;
    try {
      // `canOpenURL` Android 11+ da http uchun ham false qaytarishi mumkin
      // (manifestdagi `queries` cheklovi). Shu sababli to'g'ridan-to'g'ri
      // ochamiz va faqat haqiqiy xatoni ushlaymiz.
      await Linking.openURL(url);
    } catch {
      // Server manzili faqat development'da ko'rsatiladi — productionda
      // ichki infratuzilma manzilini foydalanuvchiga chiqarish keraksiz.
      toastError(__DEV__ ? `${t('contract.downloadFailed')}\n${url}` : t('contract.downloadFailed'));
    }
  };

  const upload = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.length) return;

    const file = picked.assets[0];
    setBusy(true);
    try {
      const form = new FormData();
      form.append('type', 'SIGNED_CONTRACT');
      /*
       * Expo SDK 57'ning `fetch`i FormData qismi Blob (yoki shunga teng)
       * bo'lishini talab qiladi — eski `{ uri, name, type }` obyekti
       * "Unsupported FormDataPart implementation" xatosi bilan yiqilardi.
       */
      form.append('file', new File(file.uri), file.name || 'shartnoma.pdf');

      await api.documents.upload(form);
      setUploaded(true);
      toastSuccess(t('contract.accepted'));
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    try {
      await saveStep({}, 'DONE');
      // Subsidiya tanlangan bo'lsa — ariza holati ekrani, aks holda yakun
      router.replace(draft.paymentMethod === 'SUBSIDY' ? '/(setup)/status' : '/(setup)/done');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen
      step={8}
      backTo={'/(setup)/payment'}
      title={t('step.contract')}
      onNext={() => void next()}
      loading={saving}
    >
      <Button title={t('contract.download')} variant="secondary" onPress={() => void download()} />

      <View style={styles.steps}>
        {steps.map((label, i) => (
          <View key={label} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={[typography.body, styles.stepText]}>{label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => void upload()}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={t('contract.upload')}
        style={({ pressed }) => [
          styles.dropzone,
          uploaded && styles.dropzoneDone,
          pressed && styles.dropzonePressed,
        ]}
      >
        <Ionicons
          name={uploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
          size={40}
          color={uploaded ? '#3ED598' : colors.primary}
        />
        <Text style={[typography.bodyStrong, styles.dropzoneText]}>
          {uploaded ? t('contract.accepted') : t('contract.upload')}
        </Text>
        <Text style={typography.caption}>{t('contract.formats')}</Text>
      </Pressable>

      {/* Imzolangan shartnoma hozir qo'lda bo'lmasligi mumkin — oqim
          to'xtab qolmasin, keyinroq Profil > Hujjatlar orqali yuklanadi */}
      {uploaded ? null : (
        <Text style={[typography.caption, styles.laterNote]}>{t('contract.laterNote')}</Text>
      )}
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  steps: { gap: spacing.md, marginTop: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 194, 224, 0.16)',
  },
  stepNumberText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1 },
  dropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['3xl'],
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'rgba(15, 26, 56, 0.72)',
  },
  dropzoneDone: { borderColor: '#3ED598', borderStyle: 'solid' },
  dropzonePressed: { opacity: 0.75 },
  dropzoneText: { textAlign: 'center' },
  laterNote: { textAlign: 'center' },
});
