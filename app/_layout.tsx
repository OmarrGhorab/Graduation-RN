import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState, useRef } from 'react';
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
import { logger } from '@/libs/logger';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // SplashScreen.preventAutoHideAsync() can fail if called too late
  logger.log('[Layout] SplashScreen.preventAutoHideAsync failed (non-critical)');
});

const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Set query client reference for auth store to clear cache on logout
setQueryClientRef(queryClient);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [i18nReady, setI18nReady] = useState(false);
  const [forceReady, setForceReady] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    logger.log('[Layout] Fonts state - loaded:', fontsLoaded, 'error:', !!fontsError);
    if (fontsLoaded || fontsError) {
      // Hide the splash screen after fonts are loaded
      SplashScreen.hideAsync().catch(() => {
        logger.log('[Layout] SplashScreen.hideAsync failed (non-critical)');
      });
    }
  }, [fontsLoaded, fontsError]);

  // Initialize i18n with error handling
  useEffect(() => {
    logger.log('[Layout] Starting i18n initialization...');
    initializeLanguage()
      .then(() => {
        logger.log('[Layout] i18n initialized successfully');
        setI18nReady(true);
      })
      .catch((error) => {
        logger.error('[Layout] i18n initialization failed:', error);
        // Force ready even on error - app should still work with default locale
        setI18nReady(true);
      });
  }, []);

  // Safety timeout: force the app to render after 5 seconds no matter what
  // This prevents the app from being stuck on a white screen forever
  useEffect(() => {
    safetyTimerRef.current = setTimeout(() => {
      logger.warn('[Layout] Safety timeout reached - forcing render. fontsLoaded:', fontsLoaded, 'fontsError:', !!fontsError, 'i18nReady:', i18nReady);
      setForceReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 5000);

    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Initialize device service (pre-fetches location and device info)
    // Wrapped in try/catch to prevent crashes from blocking the app
    try {
      DeviceService.initialize().catch((error) => {
        logger.error('[Layout] DeviceService initialization failed:', error);
      });
    } catch (error) {
      logger.error('[Layout] DeviceService initialization sync error:', error);
    }
    
    // Register for push notifications on app start
    registerForPushNotificationsAsync().catch((error) => {
      logger.error('[Layout] Push notification registration failed:', error);
    });
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
  // BUT force render after safety timeout to prevent infinite white screen
  const isReady = (fontsLoaded || !!fontsError) && i18nReady;
  if (!isReady && !forceReady) {
    logger.log('[Layout] Not ready yet - fontsLoaded:', fontsLoaded, 'fontsError:', !!fontsError, 'i18nReady:', i18nReady);
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
