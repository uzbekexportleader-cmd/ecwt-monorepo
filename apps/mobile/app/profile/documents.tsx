import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import type { DocumentType } from '@ecwt/types';

import { useDeleteDocument, useDocuments, useUploadDocument } from '../../src/api/queries';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  LoadingView,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { SelectField } from '../../src/components/form';
import { colors, layout, spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { DOCUMENT_OPTIONS, documentLabel } from '../../src/constants/documents';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';



export default function DocumentsScreen() {
  const t = useT();
  const documents = useDocuments();
  const upload = useUploadDocument();
  const remove = useDeleteDocument();

  const [type, setType] = useState<DocumentType>('PASSPORT');
  const [busy, setBusy] = useState(false);

  const pick = async (source: 'file' | 'photo') => {
    try {
      setBusy(true);
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
          Alert.alert('Ruxsat kerak', 'Galereyaga ruxsat bering.');
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
        if (res.canceled || !res.assets[0]) return;
        const a = res.assets[0];
        asset = {
          uri: a.uri,
          name: a.fileName ?? `photo-${Date.now()}.jpg`,
          mimeType: a.mimeType ?? 'image/jpeg',
        };
      }

      const form = new FormData();
      form.append('type', type);
      /*
       * Expo SDK 57'ning `fetch`i FormData qismi Blob (yoki shunga teng)
       * bo'lishini talab qiladi — eski `{ uri, name, type }` obyekti
       * "Unsupported FormDataPart implementation" xatosi bilan yiqilardi.
       */
      form.append('file', new File(asset.uri), asset.name);
      await upload.mutateAsync(form);
      toastSuccess('Hujjat yuklandi');
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : 'Hujjatni yuklab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t('documents.delete'), 'Hujjatni o‘chirmoqchimisiz?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('documents.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: () => toastSuccess('Hujjat o‘chirildi'),
            onError: (e) =>
              toastError(e instanceof EcwtApiError ? e.message : 'O‘chirib bo‘lmadi'),
          }),
      },
    ]);
  };

  const items = documents.data ?? [];

  return (
    <Screen>
      <SelectField
        label={t('documents.type')}
        value={type}
        options={DOCUMENT_OPTIONS}
        onChange={(v) => setType(v as DocumentType)}
      />

      <View style={[layout.row, { gap: spacing.md, marginTop: spacing.lg }]}>
        <Button
          title="Fayl tanlash"
          icon="document-outline"
          variant="secondary"
          fullWidth={false}
          loading={busy}
          onPress={() => void pick('file')}
          style={{ flex: 1 }}
        />
        <Button
          title="Rasm tanlash"
          icon="image-outline"
          fullWidth={false}
          loading={busy}
          onPress={() => void pick('photo')}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={[typography.caption, { marginTop: spacing.sm }]}>{t('documents.limits')}</Text>

      <SectionHeader title={t('documents.title')} />
      {documents.isLoading ? <LoadingView /> : null}
      {!documents.isLoading && items.length === 0 ? (
        <EmptyState icon="folder-open-outline" title={t('documents.empty')} />
      ) : null}

      {items.map((d) => (
        <Card key={d.id} style={{ marginBottom: spacing.md }}>
          <View style={[layout.row, { gap: spacing.md }]}>
            <Ionicons
              name={d.mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline'}
              size={22}
              color={colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyStrong} numberOfLines={1}>
                {documentLabel(d.type)}
              </Text>
              <Text style={typography.caption} numberOfLines={1}>
                {d.fileName} · {(d.sizeBytes / 1024).toFixed(0)} KB
              </Text>
            </View>
            <Pressable onPress={() => confirmDelete(d.id)} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <Chip
              label={d.verified ? 'Tasdiqlangan' : 'Tekshiruvda'}
              tone={d.verified ? 'success' : 'warning'}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

