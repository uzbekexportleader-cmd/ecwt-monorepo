import React from 'react';
import { Alert, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { STATUS_DESCRIPTION_UZ } from '@ecwt/types';

import { useApplication } from '../../src/api/queries';
import { documentLabel } from '../../src/constants/documents';
import { toastInfo } from '../../src/store/toast';
import { api } from '../../src/api/client';
import {
  Button,
  Card,
  InfoBanner,
  LoadingView,
  ErrorView,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { StatusBadge, StatusTimeline } from '../../src/components/domain';
import { colors, formatSom, layout, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';

export default function ApplicationDetail() {
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useApplication(id);

  if (query.isLoading) return <Screen><LoadingView /></Screen>;
  if (query.isError || !query.data) {
    return (
      <Screen>
        <ErrorView message="Ariza topilmadi" onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const app = query.data;
  const needsCorrection = app.status === 'NEEDS_CORRECTION';
  const rejected = app.status === 'REJECTED';

  const cancel = () => {
    Alert.alert(t('application.cancel'), 'Arizani bekor qilmoqchimisiz?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('application.cancel'),
        style: 'destructive',
        onPress: async () => {
          await api.applications.cancel(id).catch(() => undefined);
          toastInfo('Ariza bekor qilindi');
          void query.refetch();
        },
      },
    ]);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching && !query.isLoading}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={[layout.rowBetween, { marginBottom: spacing.md }]}>
        <Text style={typography.caption}>{app.number}</Text>
        <StatusBadge status={app.status} />
      </View>

      <Text style={typography.h2}>{app.subsidy?.title ?? 'Subsidiya'}</Text>
      <Text style={[typography.body, { marginTop: spacing.sm }]}>
        {STATUS_DESCRIPTION_UZ[app.status]}
      </Text>

      {/* Rad etish / tuzatish sababi */}
      {needsCorrection || rejected ? (
        <View style={{ marginTop: spacing.lg }}>
          <Card style={{ borderColor: rejected ? colors.danger : colors.warning }}>
            <View style={[layout.row, { gap: spacing.md, marginBottom: spacing.sm }]}>
              <Ionicons
                name={rejected ? 'close-circle' : 'alert-circle'}
                size={22}
                color={rejected ? colors.danger : colors.warning}
              />
              <Text style={[typography.bodyStrong, { color: rejected ? colors.danger : colors.warning }]}>
                {rejected ? t('application.rejectionReason') : t('application.correctionNote')}
              </Text>
            </View>
            <Text style={typography.body}>
              {app.rejectionReason ?? app.correctionNote ?? 'Sabab ko‘rsatilmagan'}
            </Text>

            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              {needsCorrection ? (
                <Button
                  title={t('application.fix')}
                  icon="build-outline"
                  onPress={() => router.push(`/apply/${app.id}`)}
                />
              ) : (
                <Button
                  title="Profilni tekshirish"
                  variant="secondary"
                  onPress={() => router.push('/(tabs)/profile')}
                />
              )}
            </View>
          </Card>
        </View>
      ) : null}

      {/* Timeline */}
      <SectionHeader title={t('application.timeline')} />
      <Card>
        <StatusTimeline application={app} />
      </Card>

      {/* Summa */}
      <SectionHeader title="Moliyaviy ma’lumot" />
      <Card>
        <Row label={t('application.requestedAmount')} value={formatSom(app.requestedAmount)} />
        <Row
          label={t('application.approvedAmount')}
          value={app.approvedAmount ? formatSom(app.approvedAmount) : '—'}
          highlight={!!app.approvedAmount}
        />
        <Row
          label={t('application.submittedAt')}
          value={app.submittedAt ? new Date(app.submittedAt).toLocaleString('uz-UZ') : '—'}
        />
        {app.paidAt ? (
          <Row label="To‘langan sana" value={new Date(app.paidAt).toLocaleString('uz-UZ')} last />
        ) : null}
      </Card>

      {/* Hujjatlar */}
      {app.documents.length ? (
        <>
          <SectionHeader title={t('subsidy.documents')} />
          <Card>
            {app.documents.map((d, i, arr) => (
              <View
                key={d.id}
                style={[styles.docRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
              >
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={typography.body} numberOfLines={1}>
                    {documentLabel(d.documentType)}
                  </Text>
                  <Text style={typography.caption} numberOfLines={1}>
                    {d.document.fileName}
                  </Text>
                </View>
                {d.document.verified ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                ) : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {app.subsidy?.isDemo ? (
        <View style={{ marginTop: spacing.lg }}>
          <InfoBanner text={t('subsidy.demoWarning')} tone="warning" />
        </View>
      ) : null}

      {!['PAID', 'REJECTED', 'CANCELLED'].includes(app.status) ? (
        <View style={{ marginTop: spacing['2xl'] }}>
          <Button title={t('application.cancel')} variant="danger" onPress={cancel} />
        </View>
      ) : null}
    </Screen>
  );
}

function Row({
  label,
  value,
  highlight,
  last,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={[typography.caption, { flex: 1 }]}>{label}</Text>
      <Text
        style={[
          typography.bodyStrong,
          highlight && { color: colors.success },
          { flex: 1, textAlign: 'right' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
});
