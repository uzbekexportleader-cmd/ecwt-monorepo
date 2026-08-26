import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { LocaleProvider, useLocale } from '@/i18n/LocaleContext';
import { Loading } from '@/components/ui';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

/**
 * Kirgan/kirmagan holatga qarab yo'naltirish.
 *
 * `initializing` tugamaguncha hech qayerga yo'naltirmaymiz — aks holda
 * saqlangan sessiya tekshirilayotganda foydalanuvchi bir zumda kirish
 * ekranini ko'rib qoladi (ko'zga tashlanadigan "sakrash" effekti).
 */
function RootNavigator() {
  const { user, initializing } = useAuth();
  const { t } = useLocale();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Kirmagan odam KIRISH ekraniga emas, TANISHTIRUV ekraniga tushadi:
      // avval "bu qanaqa ilova" degan savolga javob, keyin tanlov.
      router.replace('/(auth)/welcome');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initializing, segments, router]);

  if (initializing) {
    return (
      <View style={styles.splash}>
        <Loading label={t.common.loading} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.brand50,
  },
});
