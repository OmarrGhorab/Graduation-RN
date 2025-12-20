import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '@/components/toast';
import { registerForPushNotificationsAsync } from '@/libs/notifications';
import NotificationListener from '@/components/NotificationListener';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
        <NotificationListener />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
        <StatusBar style="auto" />
      </ToastProvider>
    </ThemeProvider>
  );
}
