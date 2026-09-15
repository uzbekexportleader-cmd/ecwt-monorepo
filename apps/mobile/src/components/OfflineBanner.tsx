import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './AppText';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useT } from '../i18n';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Internet uzilganda ekran tepasida turadigan tasma.
 *
 * NEGA: aloqa yo'qligini aytmasak, foydalanuvchi tugmani bosaveradi va
 * ilova "buzuq" deb o'ylaydi. Bir qator matn shu tushunmovchilikni
 * butunlay yo'q qiladi.
 *
 * Toast'dan farqi: bu o'z-o'zidan yo'qolmaydi — aloqa tiklanmaguncha turadi.
 */
export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const t = useT();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOffline ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOffline, anim]);

  // Ko'rinmayotgan holatda teginishlarni to'smasligi uchun umuman chizmaymiz
  if (!isOffline) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      style={[
        styles.wrap,
        {
          top: insets.top + spacing.sm,
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
          ],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <Text style={styles.text}>{t('network.offline')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 900,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    // Toast bilan bir xil: quyuq fon ustida matn aniq o'qiladi
    backgroundColor: colors.bgElevated,
  },
  text: { ...typography.small, color: colors.text, flex: 1 },
});
