import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from '@/libs/logger';

// Configure how notifications should behave when received while the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Registers the device for push notifications and returns the token.
 * This function asks for permission if not already granted.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // If we don't have permission, ask for it
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        // If still no permission, return undefined
        if (finalStatus !== 'granted') {
            logger.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token
        // For Expo Go, this gets an ExpoPushToken
        // For Development Builds / Production, this gets the FCM/APNs token if configured correctly
        // To explicitly get FCM token for bare/dev builds, properly configure projectId in app.json
        try {
            // Check environment first
            const isExpoGo = Constants.appOwnership === 'expo';

            if (isExpoGo) {
                logger.log('Running in Expo Go: Fetching Expo Push Token (Middleware required for FCM)');
                // In Expo Go, we can ONLY get the Expo token. 
                // Using getDevicePushTokenAsync() will throw an error in Expo Go.
                // You must strip validation on backend or use specific Expo-to-FCM middleware for testing.
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            } else {
                logger.log('Running in Native/Dev Build: Fetching Raw Device Token (FCM/APNs)');
                // Returns the raw FCM registration token on Android
                const tokenData = await Notifications.getDevicePushTokenAsync();
                token = tokenData.data;
            }

            logger.log('Push Token Generated:', token);
        } catch (e) {
            logger.error('Error fetching push token:', e);
        }
    } else {
        logger.log('Must use physical device for Push Notifications');
    }

    return token;
}
