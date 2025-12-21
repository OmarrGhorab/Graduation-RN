import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '@/components/toast';
import { registerForPushNotificationsAsync } from '@/libs/notifications';
import { DeviceService } from '@/services/DeviceService';
import NotificationListener from '@/components/NotificationListener';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize device service (pre-fetches location and device info)
    DeviceService.initialize();
    
    // Register for push notifications on app start
    registerForPushNotificationsAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <NotificationListener />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
          <StatusBar style="auto" />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
