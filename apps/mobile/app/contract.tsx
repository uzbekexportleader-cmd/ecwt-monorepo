import React from 'react';
import { Alert, Linking, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Text } from '../src/components/AppText';
import { useAcceptContract, useContract, useCreateContract } from '../src/api/queries';
import {
  Button,
  Card,
  EmptyState,
  ErrorView,
  InfoBanner,
  LoadingView,
  Screen,
  SectionHeader,
} from '../src/components/ui';
import { toastError, toastSuccess } from '../src/store/toast';
import { EcwtApiError } from '../src/api/client';
import { colors, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * Onlayn shartnoma.
 *
 * Matn shablondan olinadi va hunarmand ma'lumoti bilan to'ldiriladi.
 * Shablonni administrator yangilaydi — ilovada hech narsa o'zgarmaydi.
 *
 * Elektron imzo tizimi ulanmagan bo'lsa, ilova "yuborildi" deb
 * KO'RSATMAYDI: holat qanday bo'lsa shundayligicha aytiladi.
 */
export default function ContractScreen() {
  const t = useT();
  const router = useRouter();
  const contract = useContract();
  const create = useCreateContract();
  const accept = useAcceptContract();

  if (contract.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  if (contract.isError || !contract.data) {
    return (
      <Screen clear>
        <ErrorView message={t('common.error')} onRetry={() => void contract.refetch()} />
      </Screen>
    );
  }

  const c = contract.data;

  // Shablon hali yuklanmagan — bu xato emas
  if (!c.templateVersion) {
    return (
      <Screen clear>
        <EmptyState
          icon="document-text-outline"
          title={t('contract.noTemplate')}
          subtitle={t('contract.noTemplateHint')}
        />
      </Screen>
    );
  }

  /**
   * Shartnomani faylga saqlab, ulashish oynasini ochadi.
   *
   * Foydalanuvchi uni telefonida o'qiydi, saqlaydi yoki chop etadi —
   * tasdiqlashdan oldin matnni sinchiklab ko'rish imkoni bo'lsin.
   */
  const download = async () => {
    const text = c.contract?.body ?? c.body;
    if (!text) return;

    try {
      const name = `${c.contract?.number ?? 'ECWT-shartnoma'}.txt`;
      const file = new File(new Directory(Paths.cache), name);
      if (file.exists) file.delete();
      file.create();
      file.write(text);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: c.title ?? undefined,
        });
      } else {
        toastError(t('contract.downloadUnavailable'));
      }
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('contract.downloadFailed'));
    }
  };

  /**
   * Tasdiqlash — shaxsning o'z harakati.
   *
   * Tasdiqdan oldin ogohlantirish ko'rsatiladi: bu shartnomani qabul
   * qilish demakdir, tasodifan bosilmasin.
   */
  const confirmAccept = () =>
    Alert.alert(t('contract.acceptTitle'), t('contract.acceptAsk'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('contract.accept'),
        onPress: () => {
          accept.mutate(undefined, {
            onSuccess: () => toastSuccess(t('contract.accepted')),
            onError: (e) => toastError(e instanceof EcwtApiError ? e.message : t('common.error')),
          });
        },
      },
    ]);

  const doCreate = async () => {
    try {
      await create.mutateAsync();
      toastSuccess(t('contract.created'));
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('common.error'));
    }
  };

  return (
    <Screen
      clear
      refreshControl={
        <RefreshControl
          refreshing={contract.isFetching && !contract.isLoading}
          onRefresh={() => void contract.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={typography.h2}>{c.title}</Text>
      <Text style={typography.caption}>
        {t('contract.version')}: {c.templateVersion}
      </Text>

      {c.contract ? (
        <Card style={styles.numberCard}>
          <Text style={typography.caption}>{t('contract.number')}</Text>
          <Text style={styles.number}>{c.contract.number}</Text>
          <Text style={typography.caption}>{t(`contract.st.${c.contract.status}`)}</Text>
          {c.contract.externalUrl ? (
            <Button
              title={t('contract.openExternal')}
              variant="secondary"
              icon="open-outline"
              onPress={() => void Linking.openURL(c.contract?.externalUrl as string)}
            />
          ) : null}
        </Card>
      ) : null}

      {c.missing.length ? (
        <View style={{ marginTop: spacing.md }}>
          <InfoBanner
            tone="danger"
            icon="alert-circle-outline"
            text={`${t('contract.missing')}: ${c.missing.join(', ')}`}
          />
        </View>
      ) : null}

      {/*
        E-imzo hali ulanmagan bo'lsa ochiq aytiladi — foydalanuvchi
        "yuborildi" deb kutib qolmasin.
      */}
      {!c.eSignatureReady ? (
        <View style={{ marginTop: spacing.md }}>
          <InfoBanner tone="warning" text={t('contract.eSignOff')} />
        </View>
      ) : null}

      <SectionHeader title={t('contract.data')} />
      <Card style={{ gap: spacing.sm }}>
        {c.placeholders.map((p) => (
          <View key={p.key} style={styles.row}>
            <Text style={[typography.caption, { width: 120 }]}>{p.label}</Text>
            {p.value ? (
              <Text style={[typography.body, { flex: 1 }]}>{p.value}</Text>
            ) : (
              <Text
                style={[typography.body, { flex: 1, color: colors.danger }]}
                onPress={() => p.fixRoute && router.push(p.fixRoute as never)}
              >
                {t('mahalla.empty')}
              </Text>
            )}
          </View>
        ))}
      </Card>

      <SectionHeader title={t('contract.text')} />
      <Card>
        <Text style={styles.body}>{c.contract?.body ?? c.body}</Text>
      </Card>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {/* O'qish uchun yuklab olish — har doim ochiq */}
        {c.contract?.body ?? c.body ? (
          <Button
            title={t('contract.download')}
            variant="secondary"
            icon="download-outline"
            onPress={() => void download()}
          />
        ) : null}

        {!c.contract && c.ready ? (
          <Button
            title={t('contract.create')}
            icon="create-outline"
            onPress={() => void doCreate()}
            loading={create.isPending}
          />
        ) : null}

        {c.contract?.status === 'DRAFT' ? (
          <Button
            title={t('contract.accept')}
            icon="checkmark-done-outline"
            onPress={confirmAccept}
            loading={accept.isPending}
          />
        ) : null}
      </View>

      {c.contract?.acceptedAt ? (
        <Card style={{ marginTop: spacing.lg, gap: spacing.xs }}>
          <View style={styles.row}>
            <Ionicons name="shield-checkmark" size={22} color={colors.success} />
            <Text style={[typography.bodyStrong, { flex: 1 }]}>{t('contract.acceptedTitle')}</Text>
          </View>
          <Text style={typography.caption}>
            {new Date(c.contract.acceptedAt).toLocaleString()}
          </Text>
          <Text style={typography.caption}>{t('contract.acceptedHint')}</Text>
        </Card>
      ) : null}

      {c.contract?.status === 'SIGNED' ? (
        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.row}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={[typography.bodyStrong, { flex: 1 }]}>{t('contract.st.SIGNED')}</Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  numberCard: { marginTop: spacing.lg, gap: spacing.xs },
  number: { color: colors.primary, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  /** Shartnoma matni — bir xil kenglikdagi shrift o'qishni osonlashtiradi */
  body: { color: colors.text, fontSize: 13, lineHeight: 20 },
});
