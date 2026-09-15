import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useRouter } from 'expo-router';

import { useCraftCategories, useProfile, useUpdateProfile } from '../../src/api/queries';
import { Button, LoadingView, Screen } from '../../src/components/ui';
import { SelectField, SwitchField, TextField } from '../../src/components/form';
import { spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';

export default function CraftScreen() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const crafts = useCraftCategories();
  const update = useUpdateProfile();

  const [craftCategoryId, setCraftCategoryId] = useState<string | null>(null);
  const [experience, setExperience] = useState('');
  const [hasWorkshop, setHasWorkshop] = useState(false);
  const [workshopAddress, setWorkshopAddress] = useState('');
  const [description, setDescription] = useState('');
  const [apprenticeCount, setApprenticeCount] = useState('');
  const [hasDisability, setHasDisability] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data;
    setCraftCategoryId(p.craftCategoryId);
    setExperience(p.yearsOfExperience !== null ? String(p.yearsOfExperience) : '');
    setHasWorkshop(p.hasWorkshop);
    setWorkshopAddress(p.workshopAddress ?? '');
    setDescription(p.description ?? '');
    setApprenticeCount(String(p.apprenticeCount ?? 0));
    setHasDisability(p.hasDisability);
  }, [profile.data]);

  const save = async () => {
    setError(undefined);
    if (!craftCategoryId) {
      setError('Hunar yo‘nalishini tanlang');
      return;
    }
    const years = Number(experience.replace(/\D/g, ''));
    const apprentices = Number(apprenticeCount.replace(/\D/g, '') || '0');
    try {
      await update.mutateAsync({
        craftCategoryId,
        yearsOfExperience: Number.isFinite(years) ? years : null,
        hasWorkshop,
        workshopAddress: workshopAddress || null,
        description: description || null,
        apprenticeCount: apprentices,
        hasApprentice: apprentices > 0,
        hasDisability,
      });
      toastSuccess('Hunar ma’lumotlari saqlandi');
      router.back();
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : 'Saqlab bo‘lmadi');
    }
  };

  if (profile.isLoading || crafts.isLoading) return <Screen><LoadingView /></Screen>;

  const options = (crafts.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.icon ?? ''} ${c.nameUz}`.trim(),
  }));

  return (
    <Screen>
      <Text style={[typography.small, { marginBottom: spacing.lg }]}>
        Hunar yo‘nalishi va tajribangiz qaysi dasturlarga mos kelishingizni belgilaydi.
      </Text>

      <View style={{ gap: spacing.lg }}>
        <SelectField
          label={t('profile.craftCategory')}
          value={craftCategoryId}
          options={options}
          onChange={setCraftCategoryId}
          error={error}
        />
        <TextField
          label={t('profile.experience')}
          value={experience}
          onChangeText={setExperience}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="0"
        />
        <TextField
          label={t('profile.apprentices')}
          value={apprenticeCount}
          onChangeText={setApprenticeCount}
          keyboardType="number-pad"
          maxLength={2}
          hint="Usta-shogird dasturi uchun muhim"
        />
        <View style={{ gap: spacing.sm }}>
          <SwitchField
            label={t('profile.workshop')}
            value={hasWorkshop}
            onChange={setHasWorkshop}
            hint="Doimiy ish joyingiz bormi?"
          />
          {hasWorkshop ? (
            <TextField
              label={t('profile.workshopAddress')}
              value={workshopAddress}
              onChangeText={setWorkshopAddress}
            />
          ) : null}
        </View>
        <TextField
          label={t('profile.description')}
          value={description}
          onChangeText={setDescription}
          multiline
          hint="Qanday mahsulot tayyorlaysiz?"
        />
        <SwitchField
          label={t('profile.hasDisability')}
          value={hasDisability}
          onChange={setHasDisability}
          hint="Ba’zi dasturlarda qo‘shimcha imkoniyat beradi"
        />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title={t('common.save')} onPress={save} loading={update.isPending} />
      </View>
    </Screen>
  );
}
