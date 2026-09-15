import React, { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { JourneyDto } from '@ecwt/types';

import { Text } from '../src/components/AppText';
import {
  useChooseSalesMode,
  useJourney,
  useMahallaVisit,
  useUpdateProfile,
} from '../src/api/queries';
import { Button, Card, ErrorView, LoadingView, ProgressBar, Screen } from '../src/components/ui';
import { TextField } from '../src/components/form';
import { toastError, toastSuccess } from '../src/store/toast';
import { EcwtApiError } from '../src/api/client';
import { colors, spacing, typography } from '../src/theme';
import { useT } from '../src/i18n';

/**
 * Hunarmand yo'li (tunnel).
 *
 * Ro'yxatdan o'tgach foydalanuvchi kabinetga tushmaydi — mahsuloti
 * xalqaro savdoga chiqquncha shu ekran orqali qadamlardan o'tadi.
 *
 * Qaysi qadam ekanini SERVER aytadi (`useJourney`). Shu sababli ilovadan
 * chiqib qaytganda ham aynan o'sha qadam ochiladi va "qadamda turibman,
 * lekin ish allaqachon bajarilgan" holati bo'lmaydi.
 *
 * Har qadamda uchta narsa ko'rinadi: hozir nima bo'lyapti, kimning
 * harakati kutilmoqda, siz nima qilasiz.
 */

/** Kim harakat qilmoqda — belgisi va rangi */
const ACTOR: Record<JourneyDto['actor'], { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  ARTISAN: { label: 'Siz', icon: 'person-outline', color: colors.primary },
  MAHALLA: { label: 'Mahalla 7-ligi', icon: 'business-outline', color: colors.warning },
  ECWT: { label: 'ECWT', icon: 'shield-checkmark-outline', color: colors.info },
  MARKETPLACE: { label: 'Savdo maydonchasi', icon: 'globe-outline', color: colors.info },
};

export default function JourneyScreen() {
  const t = useT();
  const router = useRouter();
  const journey = useJourney();

  if (journey.isLoading) {
    return (
      <Screen clear>
        <LoadingView />
      </Screen>
    );
  }

  if (journey.isError || !journey.data) {
    return (
      <Screen clear>
        <ErrorView message={t('common.error')} onRetry={() => void journey.refetch()} />
      </Screen>
    );
  }

  const j = journey.data;
  const actor = ACTOR[j.actor];

  return (
    <Screen
      clear
      refreshControl={
        <RefreshControl
          refreshing={journey.isFetching && !journey.isLoading}
          onRefresh={() => void journey.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      {/* Qadam hisobi — odam qayerda turganini bilsin */}
      <Text style={styles.counter}>
        {t('step.of', { current: j.index, total: j.total })}
      </Text>
      <ProgressBar percent={Math.round((j.index / j.total) * 100)} height={8} />

      <Card style={styles.card}>
        <Text style={typography.caption}>{t('journey.now')}</Text>
        <Text style={typography.h3}>{j.now}</Text>

        <View style={styles.actorRow}>
          <Ionicons name={actor.icon} size={18} color={actor.color} />
          <Text style={[typography.small, { color: actor.color, flex: 1 }]}>
            {t('journey.actor')}: {actor.label}
          </Text>
          {!j.actionable ? (
            <View style={styles.waitBadge}>
              <Text style={styles.waitText}>{t('journey.waiting')}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={typography.caption}>{t('journey.next')}</Text>
        <Text style={typography.body}>{j.next}</Text>
      </Card>

      {j.rejectionReason ? <RejectedBlock reason={j.rejectionReason} /> : <StepAction step={j} />}

      {/* Kutish qadamlarida ham yordam doim qo'l ostida */}
      <View style={{ marginTop: spacing['2xl'], gap: spacing.md }}>
        <Button
          title={t('about.support')}
          variant="secondary"
          icon="headset-outline"
          onPress={() => router.push('/about')}
        />
        <Button
          title={t('profile.title')}
          variant="ghost"
          icon="person-outline"
          onPress={() => router.push('/profile/anketa')}
        />
      </View>
    </Screen>
  );
}

/* ---------------------------- qadam amallari ---------------------------- */

function StepAction({ step }: { step: JourneyDto }) {
  const t = useT();
  const router = useRouter();

  switch (step.step) {
    case 'SUBSIDY_APPLICATION':
      return (
        <ActionCard
          title={t('mahalla.entry')}
          icon="document-text-outline"
          onPress={() => router.push('/subsidy/online-mahalla')}
        />
      );

    case 'MAHALLA_VISIT':
      return <MahallaVisitForm />;

    case 'SERVICE_PAYMENT':
      return (
        <ActionCard
          title={t('pay.title')}
          icon="card-outline"
          onPress={() => router.push('/payment')}
        />
      );

    case 'SALES_MODE':
      return <SalesModeChoice />;

    case 'PRODUCT_PREP':
      return (
        <ActionCard
          title={t('product.add')}
          icon="cube-outline"
          onPress={() => router.push('/products/new')}
        />
      );

    case 'CONTENT_PREP':
      return (
        <ActionCard
          title={t('content.title')}
          icon="language-outline"
          onPress={() => router.push('/content')}
        />
      );

    case 'EARNINGS_PREVIEW':
      return (
        <ActionCard
          title={t('earnings.title')}
          icon="calculator-outline"
          onPress={() => router.push('/earnings')}
        />
      );

    case 'LISTING':
      return (
        <ActionCard
          title={t('listing.title')}
          icon="globe-outline"
          onPress={() => router.push('/listing')}
        />
      );

    case 'DONE':
      return <DoneBlock />;

    default:
      // Kutish qadami — tugma yo'q, holat o'zi gapiradi
      return null;
  }
}

function ActionCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Button title={title} icon={icon} onPress={onPress} />
    </View>
  );
}

/** 12-qadam: Hokim yordamchisi ma'lumotlari */
function MahallaVisitForm() {
  const t = useT();
  const save = useMahallaVisit();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = t('common.required');
    if (!/^\+?998\d{9}$/.test(phone.replace(/\s/g, ''))) next.phone = t('journey.phoneFormat');
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await save.mutateAsync({
        assistantName: name.trim(),
        assistantPhone: phone.replace(/\s/g, ''),
        note: note.trim() || undefined,
      });
      toastSuccess(t('journey.visitSaved'));
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('common.error'));
    }
  };

  return (
    <Card style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <Text style={typography.small}>{t('journey.visitHint')}</Text>
      <TextField
        label={t('journey.assistantName')}
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
      <TextField
        label={t('journey.assistantPhone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+998 90 123 45 67"
        error={errors.phone}
      />
      <TextField label={t('pay.note')} value={note} onChangeText={setNote} multiline />
      <Button
        title={t('common.save')}
        icon="checkmark-outline"
        onPress={() => void submit()}
        loading={save.isPending}
      />
    </Card>
  );
}

/** 17-qadam: FBM yoki FBA — bir marta tanlanadi */
function SalesModeChoice() {
  const t = useT();
  const choose = useChooseSalesMode();

  const pick = async (mode: 'FBM' | 'FBA') => {
    try {
      await choose.mutateAsync(mode);
      toastSuccess(t('journey.modeSaved'));
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('common.error'));
    }
  };

  return (
    <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <Card style={styles.modeCard}>
        <Text style={typography.h3}>🇺🇿 {t('journey.fbm')}</Text>
        <Text style={typography.small}>{t('journey.fbmHint')}</Text>
        <Button
          title={t('journey.choose')}
          variant="secondary"
          onPress={() => void pick('FBM')}
          loading={choose.isPending}
        />
      </Card>

      <Card style={styles.modeCard}>
        <Text style={typography.h3}>🇺🇸 {t('journey.fba')}</Text>
        <Text style={typography.small}>{t('journey.fbaHint')}</Text>
        {/*
          Tariflar shartnomadan olingan — to'qib yozilmagan.
        */}
        <Text style={typography.caption}>{t('journey.fbaTariff')}</Text>
        <Button
          title={t('journey.choose')}
          onPress={() => void pick('FBA')}
          loading={choose.isPending}
        />
      </Card>
    </View>
  );
}

/**
 * 22-qadam: yo'l tugadi.
 *
 * Bu yagona joy — kabinet shu yerdan ochiladi. Shuning uchun oddiy
 * tugma emas, yo'l tugaganini bildiradigan ekran.
 */
function DoneBlock() {
  const t = useT();
  const router = useRouter();

  return (
    <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
      <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing['2xl'] }}>
        <View style={styles.doneCircle}>
          <Ionicons name="checkmark" size={38} color={colors.textInverse} />
        </View>
        <Text style={[typography.h3, { textAlign: 'center' }]}>{t('journeyDone.title')}</Text>
        <Text style={[typography.small, { textAlign: 'center' }]}>{t('journeyDone.body')}</Text>
      </Card>
      <Button
        title={t('journey.toCabinet')}
        icon="home-outline"
        onPress={() => router.replace('/(tabs)')}
      />
    </View>
  );
}

/** Mahalla rad etgan holat: sabab + o'zi to'lash imkoni */
function RejectedBlock({ reason }: { reason: string }) {
  const t = useT();
  const update = useUpdateProfile();

  const switchToSelf = async () => {
    try {
      await update.mutateAsync({ paymentMethod: 'SELF' });
      toastSuccess(t('journey.selfPayChosen'));
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : t('common.error'));
    }
  };

  return (
    <Card style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <View style={styles.actorRow}>
        <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
        <Text style={[typography.bodyStrong, { color: colors.danger, flex: 1 }]}>
          {t('journey.rejected')}
        </Text>
      </View>
      <Text style={typography.caption}>{t('journey.rejectReason')}</Text>
      <Text style={typography.body}>{reason}</Text>
      <Text style={typography.small}>{t('journey.selfPayOffer')}</Text>
      <Button
        title={t('journey.selfPay')}
        icon="card-outline"
        onPress={() => void switchToSelf()}
        loading={update.isPending}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  counter: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  card: { marginTop: spacing.lg, gap: spacing.xs },
  actorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  waitBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.warningSoft,
  },
  waitText: { color: colors.warning, fontSize: 11, fontWeight: '700' },
  modeCard: { gap: spacing.sm },
  doneCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
