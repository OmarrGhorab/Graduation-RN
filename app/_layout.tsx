import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '@/components/toast';
import { registerForPushNotificationsAsync } from '@/libs/notifications';
import { DeviceService } from '@/services/DeviceService';
import { LocationService } from '@/services/LocationService';
import NotificationListener from '@/components/NotificationListener';
import { setQueryClientRef, useAuthStore } from '@/libs/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Set query client reference for auth store to clear cache on logout
setQueryClientRef(queryClient);

// Location update interval (5 minutes)
const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize device service (pre-fetches location and device info)
    DeviceService.initialize();
    
    // Register for push notifications on app start
    registerForPushNotificationsAsync();

    // Start location updates
    const startLocationUpdates = () => {
      // Clear existing interval
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }

      // Update location periodically (only when authenticated)
      locationIntervalRef.current = setInterval(async () => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          try {
            await LocationService.updateLocation(true); // Record to history
            console.log('[Location] Periodic update sent');
          } catch (e) {
            // Silent fail - location updates are best-effort
          }
        }
      }, LOCATION_UPDATE_INTERVAL);
    };

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh location
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          DeviceService.getPreciseLocation({ accuracy: 'highest', forceRefresh: true });
          LocationService.updateLocation(false).catch(() => {});
        }
        startLocationUpdates();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - stop interval
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    startLocationUpdates();

    return () => {
      subscription.remove();
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

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
