import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { useFonts, Rubik_300Light, Rubik_400Regular, Rubik_500Medium, Rubik_600SemiBold, Rubik_700Bold, Rubik_800ExtraBold, Rubik_900Black } from '@expo-google-fonts/rubik';
import * as SplashScreen from 'expo-splash-screen';
import { initializeLanguage } from '@/hooks/useTranslation';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '@/components/toast';
import { registerForPushNotificationsAsync } from '@/libs/notifications';
import { DeviceService } from '@/services/DeviceService';
import { LocationUpdateService } from '@/services/LocationUpdateService';
import NotificationListener from '@/components/NotificationListener';
import { setQueryClientRef, useAuthStore } from '@/libs/auth';
import { defaultQueryOptions } from '@/constants/queryConfig';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Set query client reference for auth store to clear cache on logout
setQueryClientRef(queryClient);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [i18nReady, setI18nReady] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Load Rubik fonts from Expo Google Fonts
  const [fontsLoaded, fontsError] = useFonts({
    'Rubik-Light': Rubik_300Light,
    'Rubik-Regular': Rubik_400Regular,
    'Rubik-Medium': Rubik_500Medium,
    'Rubik-SemiBold': Rubik_600SemiBold,
    'Rubik-Bold': Rubik_700Bold,
    'Rubik-ExtraBold': Rubik_800ExtraBold,
    'Rubik-Black': Rubik_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      // Hide the splash screen after fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  // Initialize i18n
  useEffect(() => {
    initializeLanguage().then(() => {
      setI18nReady(true);
    });
  }, []);

  useEffect(() => {
    // Initialize device service (pre-fetches location and device info)
    DeviceService.initialize();
    
    // Register for push notifications on app start
    registerForPushNotificationsAsync();
  }, []);

  // Start/stop location updates based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      LocationUpdateService.start();
    } else {
      LocationUpdateService.stop();
    }

    return () => {
      LocationUpdateService.stop();
    };
  }, [isAuthenticated]);

  // Don't render anything until fonts are loaded and i18n is ready
  if ((!fontsLoaded && !fontsError) || !i18nReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <NotificationListener />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
