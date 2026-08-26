import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LOCALES, LOCALE_LABELS, UZ_REGION_LABELS, type Supplier } from '@ecwt/contracts';
import { useApi } from '@/api/use-api';
import { useAuth } from '@/auth/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import { Badge, Button, Card, ErrorBanner, Loading } from '@/components/ui';
import { supplierStatus } from '@/lib/status-labels';
import { formatUsd } from '@/lib/format';
import { colors, fontSize, radius, spacing } from '@/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const { data, loading, error, refreshing, refresh } = useApi<Supplier>('/suppliers/me');

  if (loading && !data) return <Loading label={t.common.loading} />;

  const status = data ? supplierStatus(data.status, locale) : null;

  function confirmLogout(): void {
    Alert.alert(t.auth.logout, t.auth.logoutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.auth.logout, style: 'destructive', onPress: () => void logout() },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      {error ? <ErrorBanner message={error} /> : null}

      <Card style={styles.headerCard}>
        <Text style={styles.company}>{data?.companyName ?? user?.fullName ?? ''}</Text>
        <Text style={styles.person}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {status ? (
          <View style={styles.badgeRow}>
            <Badge label={status.label} tone={status.tone} />
          </View>
        ) : null}
      </Card>

      {data ? (
        <Card>
          <Row label={t.profile.balance} value={formatUsd(data.balanceUsd)} highlight />
          <Row label={t.profile.stir} value={data.stir ?? '—'} />
          <Row
            label={t.profile.company}
            value={data.region ? UZ_REGION_LABELS[data.region] : '—'}
          />
          <Row label={t.profile.phone} value={data.contactPhone ?? '—'} />
          <Row label={t.profile.email} value={data.contactEmail ?? '—'} />
          <Row label={t.profile.bank} value={data.bankName ?? '—'} />
          <Row label={t.profile.account} value={data.bankAccount ?? '—'} last />
        </Card>
      ) : null}

      <Text style={styles.hint}>{t.profile.editHint}</Text>

      <Card>
        <Text style={styles.sectionTitle}>{t.profile.language}</Text>

        <View style={styles.languageRow}>
          {LOCALES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setLocale(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: item === locale }}
              style={[styles.langChip, item === locale && styles.langChipActive]}
            >
              <Text style={[styles.langText, item === locale && styles.langTextActive]}>
                {LOCALE_LABELS[item]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Button title={t.auth.logout} onPress={confirmLogout} variant="outline" />
    </ScrollView>
  );
}

function Row({
  label,
  value,
  highlight = false,
  last = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerCard: { gap: 2 },
  company: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brand950 },
  person: { fontSize: fontSize.sm, color: colors.brand600, marginTop: spacing.xs },
  email: { fontSize: fontSize.sm, color: colors.brand400 },
  badgeRow: { marginTop: spacing.md },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brand100,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: fontSize.sm, color: colors.brand500 },
  rowValue: { fontSize: fontSize.sm, fontWeight: '500', color: colors.brand950, flexShrink: 1 },
  rowValueHighlight: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brand800 },

  hint: { fontSize: fontSize.xs, color: colors.brand400, textAlign: 'center' },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.brand900,
    marginBottom: spacing.md,
  },
  languageRow: { flexDirection: 'row', gap: spacing.sm },
  langChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  langChipActive: { backgroundColor: colors.brand700, borderColor: colors.brand700 },
  langText: { fontSize: fontSize.sm, color: colors.brand600, fontWeight: '500' },
  langTextActive: { color: colors.white },
});
