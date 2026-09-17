import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  useApplications,
  useCreateApplication,
  useEligibility,
  useSubsidy,
} from '../../src/api/queries';
import {
  Button,
  Card,
  Chip,
  InfoBanner,
  LoadingView,
  ErrorView,
  Screen,
  SectionHeader,
} from '../../src/components/ui';
import { EligibilitySummary, RequirementRow } from '../../src/components/domain';
import { colors, formatSom, layout, radius, spacing, typography } from '../../src/theme';
import { useT } from '../../src/i18n';
import { EcwtApiError } from '../../src/api/client';

export default function SubsidyDetail() {
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const subsidy = useSubsidy(id);
  const eligibility = useEligibility(id);
  const applications = useApplications();
  const createApplication = useCreateApplication();

  if (subsidy.isLoading) return <Screen><LoadingView /></Screen>;
  if (subsidy.isError || !subsidy.data) {
    return (
      <Screen>
        <ErrorView message="Subsidiya topilmadi" onRetry={() => void subsidy.refetch()} />
      </Screen>
    );
  }

  const s = subsidy.data;
  const e = eligibility.data;
  const existing = (applications.data ?? []).find(
    (a) => a.subsidyId === id && !['PAID', 'REJECTED', 'CANCELLED'].includes(a.status),
  );

  const amountText =
    s.amountType === 'RANGE' && s.minAmount && s.maxAmount
      ? `${formatSom(s.minAmount, false)} — ${formatSom(s.maxAmount)}`
      : s.amountType === 'PERCENT_OF_EXPENSE'
        ? `Xarajatning ${s.amountFactor ?? 0}% (${formatSom(s.maxAmount)} gacha)`
        : s.amountType === 'BHM_MULTIPLE'
          ? `${s.amountFactor ?? 0} × BHM${s.amountPerApprentice ? ' × shogirdlar soni' : ''}`
          : formatSom(s.maxAmount ?? s.minAmount);

  const apply = async () => {
    if (existing) {
      router.push(existing.status === 'DRAFT' ? `/apply/${existing.id}` : `/applications/${existing.id}`);
      return;
    }
    try {
      const app = await createApplication.mutateAsync(id);
      router.push(`/apply/${app.id}`);
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof EcwtApiError ? err.message : 'Ariza yaratib bo‘lmadi',
      );
    }
  };

  const failedFixable = e?.checks.filter((c) => c.result !== 'PASSED' && c.fixRoute) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Screen edges={[]} contentStyle={{ paddingBottom: 140 }}>
        <View style={[layout.row, { gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md }]}>
          <Chip label={s.category} tone="info" />
          {s.isDemo ? <Chip label={t('common.demo')} tone="gold" /> : null}
        </View>

        <Text style={typography.h1}>{s.title}</Text>
        <Text style={[typography.body, { marginTop: spacing.sm }]}>{s.shortDescription}</Text>

        {s.isDemo ? (
          <View style={{ marginTop: spacing.lg }}>
            <InfoBanner text={t('subsidy.demoWarning')} tone="warning" />
          </View>
        ) : null}

        {e ? (
          <View style={{ marginTop: spacing.lg }}>
            <EligibilitySummary eligibility={e} />
          </View>
        ) : null}

        <SectionHeader title="Asosiy ma’lumot" />
        <Card>
          <InfoRow icon="cash-outline" label={t('subsidy.amount')} value={amountText} />
          <InfoRow icon="business-outline" label={t('subsidy.organization')} value={s.organization} />
          <InfoRow
            icon="time-outline"
            label={t('subsidy.processingDays')}
            value={`${s.processingDays} ish kuni`}
          />
          {e?.estimatedAmount ? (
            <InfoRow
              icon="calculator-outline"
              label={t('subsidy.estimated')}
              value={formatSom(e.estimatedAmount)}
              hint={t('subsidy.estimatedNote')}
              last
            />
          ) : null}
        </Card>

        <SectionHeader title={t('subsidy.forWhom')} />
        <Card>
          <Text style={typography.body}>{s.fullDescription}</Text>
        </Card>

        <SectionHeader title={t('subsidy.requirements')} />
        <Card>
          {(e?.checks ?? []).map((c) => (
            <RequirementRow key={c.requirementId} check={c} />
          ))}
          {!e ? (
            s.requirements.map((r) => (
              <View key={r.id} style={{ paddingVertical: spacing.sm }}>
                <Text style={typography.body}>• {r.humanReadableText}</Text>
              </View>
            ))
          ) : null}
        </Card>

        {failedFixable.length ? (
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {failedFixable.map((c) => (
              <Button
                key={c.requirementId}
                title={c.fixLabel ?? t('subsidy.fixRequirement')}
                variant="secondary"
                icon="arrow-forward"
                onPress={() => router.push(c.fixRoute as never)}
              />
            ))}
          </View>
        ) : null}

        <SectionHeader title={t('subsidy.documents')} />
        <Card>
          {s.requiredDocuments.map((d, i) => (
            <View
              key={d.id}
              style={[
                styles.docRow,
                i === s.requiredDocuments.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>{d.title}</Text>
                {d.hint ? <Text style={typography.caption}>{d.hint}</Text> : null}
              </View>
              {d.isOptional ? <Chip label={t('common.optional')} tone="neutral" /> : null}
            </View>
          ))}
        </Card>

        {s.legalBasisUrl ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={typography.caption}>
              {t('subsidy.legalBasis')}: {s.legalBasisUrl}
            </Text>
          </View>
        ) : null}
      </Screen>

      {/* Sticky CTA */}
      <View style={styles.sticky}>
        {e?.verdict === 'NOT_ELIGIBLE' ? (
          <>
            <Text style={[typography.caption, { marginBottom: spacing.sm, textAlign: 'center' }]}>
              {e.message}
            </Text>
            <Button
              title={t('subsidy.fixRequirement')}
              variant="secondary"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </>
        ) : (
          <Button
            title={existing ? 'Arizani davom ettirish' : t('subsidy.apply')}
            onPress={apply}
            loading={createApplication.isPending}
          />
        )}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  hint,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text style={typography.caption}>{label}</Text>
        <Text style={typography.bodyStrong}>{value}</Text>
        {hint ? <Text style={typography.caption}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
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
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
});
