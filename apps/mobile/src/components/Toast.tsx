import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '../store/toast';
import { colors, radius, spacing, typography } from '../theme';

const TONE = {
  success: { border: colors.success, fg: colors.success, icon: 'checkmark-circle' },
  error: { border: colors.danger, fg: colors.danger, icon: 'alert-circle' },
  info: { border: colors.info, fg: colors.info, icon: 'information-circle' },
} as const;

/** Ekran tepasida ko'rinadigan qisqa xabar. Root layout'da bir marta ulanadi. */
export function ToastHost() {
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) hide();
      });
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast, anim, hide]);

  if (!toast) return null;
  const tone = TONE[toast.tone];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: insets.top + spacing.sm,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      <Pressable
        onPress={hide}
        style={[styles.toast, { borderColor: tone.border }]}
      >
        <Ionicons name={tone.icon} size={22} color={tone.fg} />
        <Text style={[typography.bodyStrong, { color: tone.fg, flex: 1 }]}>{toast.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.bgElevated,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
