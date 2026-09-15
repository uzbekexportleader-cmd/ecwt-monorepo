import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Fon videosi navigatorning orqasida turadi (`VideoBackdropHost`) —
        // ekranlar uni yopib qo'ymasligi uchun fon shaffof.
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}
    />
  );
}
