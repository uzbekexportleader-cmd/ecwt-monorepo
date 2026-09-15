import React from 'react';
import { Platform, View, StyleSheet, type ColorValue } from 'react-native';
import { Text } from '../../src/components/AppText';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../../src/theme';
import { useUnreadCount } from '../../src/api/queries';
import { useT } from '../../src/i18n';

function TabIcon({
  name,
  color,
  focused,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View>
      <Ionicons name={name} size={focused ? 26 : 24} color={color} />
      {badge && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const t = useT();
  const { data: unread } = useUnreadCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          /*
           * Besh bo'lim bilan yorliq nomlari kesilib qolmasligi uchun
           * balandlik oshirildi va matnga o'z qatori berildi.
           */
          height: Platform.OS === 'ios' ? 92 : 74,
          paddingTop: spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.sm,
        },
        tabBarLabelStyle: { fontSize: 10, lineHeight: 14, fontWeight: '600' },
      }}
    >
      {/* index faqat yo'naltiradi — yorliqda ko'rinmaydi */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: t('tab.opportunities'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'ribbon' : 'ribbon-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t('tab.products'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'cube' : 'cube-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: t('tab.applications'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'document-text' : 'document-text-outline'}
              color={color}
              focused={focused}
              badge={unread?.count}
            />
          ),
        }}
      />
      {/* Yo'lning oxirgi bosqichi — pul shu yerda olinadi */}
      <Tabs.Screen
        name="money"
        options={{
          title: t('tab.money'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});
