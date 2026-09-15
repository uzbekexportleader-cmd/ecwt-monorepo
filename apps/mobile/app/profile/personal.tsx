import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '../../src/components/AppText';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { z } from 'zod';

import { useProfile, useUpdateProfile } from '../../src/api/queries';
import { Button, InfoBanner, LoadingView, Screen } from '../../src/components/ui';
import { DateField, SelectField, TextField } from '../../src/components/form';
import { REGION_OPTIONS, districtOptions } from '../../src/constants/regions';
import { spacing, typography } from '../../src/theme';
import { EcwtApiError } from '../../src/api/client';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';

/** Ekran uchun sxema — bo'sh qiymatlarni ham qabul qiladi, saqlashda tozalanadi. */
const schema = z.object({
  lastName: z.string().trim().min(2, 'Familiya kamida 2 belgi'),
  firstName: z.string().trim().min(2, 'Ism kamida 2 belgi'),
  middleName: z.string().trim().optional(),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Sana YYYY-MM-DD ko‘rinishida (masalan 1990-05-14)'),
  pinfl: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'JShShIR 14 ta raqamdan iborat')
    .or(z.literal('')),
  passportNumber: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}\d{7}$/, 'Pasport AA1234567 ko‘rinishida')
    .or(z.literal('')),
  region: z.string().min(1, 'Viloyatni tanlang'),
  district: z.string().min(1, 'Tumanni tanlang'),
  address: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PersonalScreen() {
  const t = useT();
  const router = useRouter();
  const profile = useProfile();
  const update = useUpdateProfile();

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lastName: '',
      firstName: '',
      middleName: '',
      birthDate: '',
      pinfl: '',
      passportNumber: '',
      region: '',
      district: '',
      address: '',
    },
  });

  const region = watch('region');

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data;
    reset({
      lastName: p.lastName ?? '',
      firstName: p.firstName ?? '',
      middleName: p.middleName ?? '',
      birthDate: p.birthDate ?? '',
      // JShShIR server tomonidan maskalab qaytariladi — maska bo'lsa bo'sh ko'rsatamiz
      pinfl: p.pinfl && !p.pinfl.includes('•') ? p.pinfl : '',
      passportNumber: p.passportNumber ?? '',
      region: p.region ?? '',
      district: p.district ?? '',
      address: p.address ?? '',
    });
  }, [profile.data, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await update.mutateAsync({
        lastName: values.lastName,
        firstName: values.firstName,
        middleName: values.middleName || null,
        birthDate: values.birthDate,
        ...(values.pinfl ? { pinfl: values.pinfl } : {}),
        ...(values.passportNumber ? { passportNumber: values.passportNumber } : {}),
        region: values.region,
        district: values.district,
        address: values.address || null,
      });
      toastSuccess('Shaxsiy ma’lumotlar saqlandi');
      router.back();
    } catch (err) {
      toastError(err instanceof EcwtApiError ? err.message : 'Saqlab bo‘lmadi');
    }
  };

  if (profile.isLoading) return <Screen><LoadingView /></Screen>;

  return (
    <Screen>
      <Text style={[typography.small, { marginBottom: spacing.lg }]}>
        Bu ma’lumotlar barcha arizalarga avtomatik qo‘yiladi — qayta yozish shart emas.
      </Text>

      <View style={{ gap: spacing.lg }}>
        <Controller
          control={control}
          name="lastName"
          render={({ field, fieldState }) => (
            <TextField
              label={t('profile.lastName')}
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              autoCapitalize="words"
            />
          )}
        />
        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <TextField
              label={t('profile.firstName')}
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              autoCapitalize="words"
            />
          )}
        />
        <Controller
          control={control}
          name="middleName"
          render={({ field, fieldState }) => (
            <TextField
              label={t('profile.middleName')}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              autoCapitalize="words"
            />
          )}
        />
        <Controller
          control={control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <DateField
              label={t('profile.birthDate')}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="pinfl"
          render={({ field, fieldState }) => (
            <TextField
              label={t('profile.pinfl')}
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="number-pad"
              maxLength={14}
              hint="14 ta raqam"
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="passportNumber"
          render={({ field, fieldState }) => (
            <TextField
              label={t('profile.passport')}
              value={field.value}
              onChangeText={(v) => field.onChange(v.toUpperCase())}
              placeholder="AA1234567"
              autoCapitalize="characters"
              maxLength={9}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="region"
          render={({ field, fieldState }) => (
            <SelectField
              label={t('profile.region')}
              value={field.value}
              options={REGION_OPTIONS}
              onChange={(v) => {
                field.onChange(v);
                setValue('district', '');
              }}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="district"
          render={({ field, fieldState }) => (
            <SelectField
              label={t('profile.district')}
              value={field.value}
              options={districtOptions(region)}
              onChange={field.onChange}
              error={fieldState.error?.message}
              hint={!region ? 'Avval viloyatni tanlang' : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="address"
          render={({ field, fieldState }) => (
            <TextField
              label={t('profile.address')}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              multiline
              error={fieldState.error?.message}
            />
          )}
        />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <InfoBanner text={t('profile.oneIdNotice')} tone="info" />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title={t('common.save')} onPress={handleSubmit(onSubmit)} loading={update.isPending} />
      </View>
    </Screen>
  );
}
