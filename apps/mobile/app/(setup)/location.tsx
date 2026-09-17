import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../src/components/AppText';
import { StepScreen } from '../../src/components/StepScreen';
import { Button, InfoBanner } from '../../src/components/ui';
import { useOnboarding } from '../../src/store/onboarding';
import { EcwtApiError } from '../../src/api/client';
import { toastError, toastSuccess } from '../../src/store/toast';
import { useT } from '../../src/i18n';
import { colors, spacing, typography } from '../../src/theme';

/**
 * 3-qadam: turgan joyni GPS orqali belgilash.
 *
 * Oldingi qadamda manzil YOZILADI (viloyat, tuman, ko'cha). Bu yerda esa
 * aniq nuqta olinadi — mutaxassis xaritada ko'rishi va ustaxonagacha bora
 * olishi uchun. Yozma manzil ko'pincha noaniq bo'ladi ("Navbahor mahallasi,
 * 12-uy" degan joyni topish qiyin), koordinata esa aniq.
 *
 * Majburiy EMAS: GPS o'chiq bo'lishi, binoda signal yetmasligi yoki odam
 * ruxsat bermasligi mumkin. Bunday holda qadam o'tkazib yuboriladi —
 * ro'yxatdan o'tish shu sababli to'xtab qolmasligi kerak.
 */
export default function LocationStep() {
  const t = useT();
  const router = useRouter();
  const { draft, set, saveStep, saving } = useOnboarding();
  const [locating, setLocating] = useState(false);

  const hasLocation = draft.latitude != null && draft.longitude != null;

  const detect = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toastError(t('location.denied'));
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      set('latitude', pos.coords.latitude);
      set('longitude', pos.coords.longitude);
      toastSuccess(t('location.found'));
    } catch {
      toastError(t('location.failed'));
    } finally {
      setLocating(false);
    }
  };

  const next = async () => {
    try {
      await saveStep(
        hasLocation
          ? { latitude: draft.latitude, longitude: draft.longitude }
          : {},
        'ACTIVITY_TYPE',
      );
      router.push('/(setup)/activity');
    } catch (e) {
      toastError(e instanceof EcwtApiError ? e.message : t('done.saveFailed'));
    }
  };

  return (
    <StepScreen
      step={3}
      backTo={'/(setup)/address'}
      title={t('step.location')}
      onNext={() => void next()}
      loading={saving}
      nextLabel={hasLocation ? undefined : t('location.skip')}
    >
      <Text style={[typography.body, { marginBottom: spacing.xl }]}>
        {t('location.intro')}
      </Text>

      <Button
        title={hasLocation ? t('location.again') : t('location.detect')}
        icon="location-outline"
        variant={hasLocation ? 'secondary' : 'primary'}
        onPress={() => void detect()}
        loading={locating}
      />

      {hasLocation ? (
        <View style={{ marginTop: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#3ED598" />
            <Text style={[typography.body, { color: colors.text }]}>
              {t('location.found')}
            </Text>
          </View>

          {/* Koordinata ko'rsatiladi: odam o'zi to'g'ri joyda turganini biladi */}
          <Text style={typography.caption}>
            {draft.latitude?.toFixed(5)}, {draft.longitude?.toFixed(5)}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.xl }}>
          <InfoBanner text={t('location.optional')} tone="info" />
        </View>
      )}
    </StepScreen>
  );
}
