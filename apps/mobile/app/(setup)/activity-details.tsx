import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '../../src/components/AppText';
import { StepScreen } from '../../src/components/StepScreen';
import { ChoiceCard } from '../../src/components/ChoiceCard';
import { CRAFT_KINDS, EXPERIENCE_OPTIONS, SECTOR_KINDS } from '../../src/constants/onboarding';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import { spacing, typography } from '../../src/theme';

/**
 * 8-qadam: faoliyat tafsilotlari.
 *
 * Savollar 7-qadamda tanlangan turga qarab o'zgaradi. Hunarmandga
 * hunarmandchilik turi, uyushma a'zoligi va YATT savollari beriladi;
 * qolganlariga o'z sohasining yo'nalish ro'yxati chiqadi — hunarmand
 * savollari ularga umuman ko'rinmaydi.
 */
export default function ActivityDetailsStep() {
  const t = useT();
  const router = useRouter();
  const { draft, set, saveStep, saving } = useOnboarding();

  const activity = draft.activityType;
  const isCraftsman = activity === 'HUNARMAND';
  const kinds =
    activity === null ? [] : activity === 'HUNARMAND' ? CRAFT_KINDS : SECTOR_KINDS[activity];

  const chosenKind = isCraftsman ? draft.craftCategoryId : draft.sectorKind;
  const setKind = (value: string) =>
    isCraftsman ? set('craftCategoryId', value) : set('sectorKind', value);

  const ready =
    Boolean(chosenKind) &&
    draft.yearsOfExperience !== null &&
    (!isCraftsman || (draft.isMember !== null && draft.hasYatt !== null));

  const next = async () => {
    if (!ready) return;
    try {
      await saveStep(
        {
          yearsOfExperience: draft.yearsOfExperience,
          ...(isCraftsman
            ? {
                craftSubcategoryId: draft.craftCategoryId,
                membershipStatus: draft.isMember ? 'ACTIVE' : 'NONE',
                businessType: draft.hasYatt ? 'YATT' : 'NONE',
              }
            : { description: draft.sectorKind }),
        },
        'SERVICES',
      );
      router.push('/(setup)/services');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen
      step={5}
      backTo={'/(setup)/activity'}
      title={isCraftsman ? t('step.craftDetails') : t('step.activityDetails')}
      onNext={() => void next()}
      nextDisabled={!ready}
      loading={saving}
    >
      <Text style={typography.label}>
        {isCraftsman ? t('field.craftKind') : t('field.sectorKind')}
      </Text>
      {kinds.map((k) => (
        <ChoiceCard
          key={k.value}
          title={t(k.labelKey)}
          selected={chosenKind === k.value}
          onPress={() => setKind(k.value)}
        />
      ))}

      <Text style={[typography.label, { marginTop: spacing.lg }]}>{t('field.experience')}</Text>
      {EXPERIENCE_OPTIONS.map((e) => (
        <ChoiceCard
          key={e.value}
          title={t(e.labelKey)}
          selected={draft.yearsOfExperience === e.value}
          onPress={() => set('yearsOfExperience', e.value)}
        />
      ))}

      {isCraftsman ? (
        <View style={{ gap: spacing.lg }}>
          <Text style={[typography.label, { marginTop: spacing.lg }]}>
            {t('field.association')}
          </Text>
          <ChoiceCard
            title={t('common.yes')}
            selected={draft.isMember === true}
            onPress={() => set('isMember', true)}
          />
          <ChoiceCard
            title={t('common.no')}
            selected={draft.isMember === false}
            onPress={() => set('isMember', false)}
          />

          <Text style={[typography.label, { marginTop: spacing.lg }]}>{t('field.yatt')}</Text>
          <ChoiceCard
            title={t('yatt.yes')}
            selected={draft.hasYatt === true}
            onPress={() => set('hasYatt', true)}
          />
          <ChoiceCard
            title={t('yatt.no')}
            selected={draft.hasYatt === false}
            onPress={() => set('hasYatt', false)}
          />
        </View>
      ) : null}
    </StepScreen>
  );
}
