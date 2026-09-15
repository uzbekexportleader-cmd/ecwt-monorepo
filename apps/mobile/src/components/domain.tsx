import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import {
  STATUS_LABEL_UZ,
  TIMELINE_STEPS,
  type ApplicationDto,
  type ApplicationStatus,
  type EligibilityDto,
  type RequirementCheckDto,
  type SubsidyWithEligibilityDto,
} from '@ecwt/types';

import { colors, formatSom, layout, radius, spacing, typography } from '../theme';
import { Card, Chip, ProgressBar } from './ui';

/* ------------------------------ StatusBadge ------------------------------ */

const STATUS_TONE: Record<ApplicationStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'info',
  NEEDS_CORRECTION: 'warning',
  SCORING: 'info',
  LOCAL_REVIEW: 'info',
  APPROVED: 'success',
  PAYMENT_PROCESSING: 'success',
  PAID: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Chip label={STATUS_LABEL_UZ[status]} tone={STATUS_TONE[status]} />;
}

/* -------------------------------- Timeline ------------------------------- */

export function StatusTimeline({ application }: { application: ApplicationDto }) {
  const reached = new Set(application.history.map((h) => h.toStatus));
  const currentIndex = TIMELINE_STEPS.indexOf(application.status);
  const isRejected = application.status === 'REJECTED';
  const isCancelled = application.status === 'CANCELLED';
  const needsCorrection = application.status === 'NEEDS_CORRECTION';

  return (
    <View style={{ gap: 0 }}>
      {TIMELINE_STEPS.map((step, index) => {
        const done = reached.has(step) && (currentIndex < 0 || index < currentIndex);
        const active = step === application.status;
        const pending = !done && !active;
        const last = index === TIMELINE_STEPS.length - 1;

        const color = done
          ? colors.success
          : active
            ? colors.primary
            : colors.textMuted;

        return (
          <View key={step} style={styles.timelineRow}>
            <View style={{ alignItems: 'center', width: 28 }}>
              <View
                style={[
                  styles.dot,
                  { borderColor: color, backgroundColor: done || active ? color : 'transparent' },
                ]}
              >
                {done ? <Ionicons name="checkmark" size={12} color={colors.textInverse} /> : null}
              </View>
              {!last ? (
                <View
                  style={[styles.line, { backgroundColor: done ? colors.success : colors.border }]}
                />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : spacing.lg }}>
              <Text
                style={[
                  typography.bodyStrong,
                  pending && { color: colors.textMuted, fontWeight: '400' },
                  active && { color: colors.primary },
                ]}
              >
                {STATUS_LABEL_UZ[step]}
              </Text>
              {historyNote(application, step)}
            </View>
          </View>
        );
      })}

      {needsCorrection || isRejected || isCancelled ? (
        <View style={[styles.timelineRow, { marginTop: spacing.md }]}>
          <View style={{ alignItems: 'center', width: 28 }}>
            <View
              style={[
                styles.dot,
                {
                  borderColor: isRejected ? colors.danger : colors.warning,
                  backgroundColor: isRejected ? colors.danger : colors.warning,
                },
              ]}
            >
              <Ionicons name={isRejected ? 'close' : 'alert'} size={12} color={colors.textInverse} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: isRejected ? colors.danger : colors.warning }]}>
              {STATUS_LABEL_UZ[application.status]}
            </Text>
            <Text style={typography.caption}>
              {application.rejectionReason ?? application.correctionNote ?? ''}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function historyNote(app: ApplicationDto, status: ApplicationStatus): React.ReactElement | null {
  const entry = [...app.history].reverse().find((h) => h.toStatus === status);
  if (!entry) return null;
  const date = new Date(entry.createdAt).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return (
    <Text style={typography.caption}>
      {date} · {entry.actorName}
      {entry.comment ? ` · ${entry.comment}` : ''}
    </Text>
  );
}

/* ----------------------------- RequirementRow ---------------------------- */

export function RequirementRow({ check }: { check: RequirementCheckDto }) {
  const map = {
    PASSED: { icon: 'checkmark-circle' as const, color: colors.success },
    FAILED: { icon: 'close-circle' as const, color: colors.danger },
    NEEDS_CHECK: { icon: 'alert-circle' as const, color: colors.warning },
  };
  const v = map[check.result];
  return (
    <View style={styles.reqRow}>
      <Ionicons name={v.icon} size={20} color={v.color} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={typography.body}>{check.text}</Text>
        {check.reason ? (
          <Text style={[typography.caption, { color: v.color }]}>{check.reason}</Text>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------ SubsidyCard ------------------------------ */

export function SubsidyCard({
  subsidy,
  onPress,
}: {
  subsidy: SubsidyWithEligibilityDto;
  onPress: () => void;
}) {
  const e = subsidy.eligibility;
  const tone = e.verdict === 'ELIGIBLE' ? 'success' : e.verdict === 'PARTIAL' ? 'warning' : 'danger';
  const failed = e.checks.filter((c) => c.result === 'FAILED').length;

  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <View style={[layout.rowBetween, { marginBottom: spacing.sm }]}>
        <Chip label={subsidy.category} tone="info" />
        {subsidy.isDemo ? <Chip label="DEMO" tone="gold" /> : null}
      </View>

      <Text style={[typography.h3, { marginBottom: 4 }]}>{subsidy.title}</Text>
      <Text style={[typography.small, { marginBottom: spacing.md }]} numberOfLines={2}>
        {subsidy.shortDescription}
      </Text>

      <View style={[layout.rowBetween, { marginBottom: spacing.sm }]}>
        <Text style={typography.caption}>Moslik</Text>
        <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
          {e.matchPercent}%
        </Text>
      </View>
      <ProgressBar percent={e.matchPercent} height={6} />

      <View style={[layout.rowBetween, { marginTop: spacing.md }]}>
        <Chip
          label={
            e.verdict === 'ELIGIBLE'
              ? 'Mos keladi'
              : e.verdict === 'PARTIAL'
                ? `${failed || e.totalCount - e.passedCount} ta talab yetishmayapti`
                : 'Mos emas'
          }
          tone={tone}
        />
        {e.estimatedAmount ? (
          <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
            ~ {formatSom(e.estimatedAmount)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

/* ---------------------------- ApplicationCard ---------------------------- */

export function ApplicationCard({
  application,
  onPress,
}: {
  application: ApplicationDto;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <View style={[layout.rowBetween, { marginBottom: spacing.sm }]}>
        <Text style={typography.caption}>{application.number}</Text>
        <StatusBadge status={application.status} />
      </View>
      <Text style={[typography.bodyStrong, { marginBottom: 4 }]} numberOfLines={2}>
        {application.subsidy?.title ?? 'Subsidiya'}
      </Text>
      <View style={layout.rowBetween}>
        <Text style={typography.caption}>
          {application.submittedAt
            ? new Date(application.submittedAt).toLocaleDateString('uz-UZ')
            : 'Yuborilmagan'}
        </Text>
        <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
          {formatSom(application.approvedAmount ?? application.requestedAmount)}
        </Text>
      </View>
      {application.status === 'NEEDS_CORRECTION' && application.correctionNote ? (
        <View style={styles.correctionNote}>
          <Ionicons name="alert-circle" size={16} color={colors.warning} />
          <Text style={[typography.caption, { color: colors.warning, flex: 1 }]}>
            {application.correctionNote}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

/* ------------------------- EligibilitySummaryCard ------------------------ */

export function EligibilitySummary({ eligibility }: { eligibility: EligibilityDto }) {
  const tone =
    eligibility.verdict === 'ELIGIBLE'
      ? colors.success
      : eligibility.verdict === 'PARTIAL'
        ? colors.warning
        : colors.danger;
  return (
    <Card style={{ borderColor: tone }}>
      <View style={[layout.row, { gap: spacing.md }]}>
        <Ionicons
          name={
            eligibility.verdict === 'ELIGIBLE'
              ? 'checkmark-circle'
              : eligibility.verdict === 'PARTIAL'
                ? 'alert-circle'
                : 'close-circle'
          }
          size={28}
          color={tone}
        />
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyStrong, { color: tone }]}>{eligibility.message}</Text>
          <Text style={typography.caption}>
            {eligibility.passedCount}/{eligibility.totalCount} talab bajarilgan
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, flex: 1, minHeight: 24 },
  reqRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  correctionNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.warningSoft,
  },
});
