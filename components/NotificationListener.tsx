import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore, PushNotificationData } from '@/libs/notifications-store';
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications';
import { DeviceService } from '@/services/DeviceService';
import { LocationService } from '@/services/LocationService';

/**
 * NotificationListener component
 * 
 * This component listens for incoming push notifications and updates
 * the notification store in real-time. It should be placed at the root
 * of your app (in _layout.tsx) to ensure it's always active.
 */
export default function NotificationListener() {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const addNotificationFromPush = useNotificationStore((state) => state.addNotificationFromPush);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Listen for incoming notifications when app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
            console.log('[NotificationListener] Notification received:', notification);

            const data = notification.request.content.data as Record<string, any>;
            
            if (data) {
                // Handle silent location request from parent
                if (data.type === 'location_request') {
                    console.log('[NotificationListener] Location request received from parent');
                    try {
                        // Get fresh location and send to server
                        await DeviceService.getPreciseLocation({ accuracy: 'high', forceRefresh: true });
                        await LocationService.updateLocation(true);
                        console.log('[NotificationListener] Location updated in response to parent request');
                    } catch (error) {
                        console.error('[NotificationListener] Failed to update location:', error);
                    }
                    return; // Don't show this as a notification
                }

                // Parse the push notification data
                const pushData: PushNotificationData = {
                    type: data.type || 'info',
                    title: notification.request.content.title || data.title || 'Notification',
                    body: notification.request.content.body || data.body || '',
                    requestId: data.requestId,
                    child: data.child ? {
                        id: data.child.id,
                        name: data.child.name,
                        username: data.child.username,
                        profileImg: data.child.profileImg,
                    } : undefined,
                    createdAt: data.createdAt || new Date().toISOString(),
                };

                // Add to notification store (for backward compatibility)
                addNotificationFromPush(pushData);
                
                // Invalidate React Query cache to refetch notifications
                queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
                
                console.log('[NotificationListener] Added notification to store:', pushData);
            }
        });

        // Listen for user interaction with notifications (tap)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log('[NotificationListener] Notification tapped:', response);
            
            const data = response.notification.request.content.data as Record<string, any>;
            
            // Handle notification tap - you can navigate to specific screens here
            if (data?.type === 'parent_link_request') {
                // Navigate to parent link requests screen
                console.log('[NotificationListener] Parent link request tapped, requestId:', data.requestId);
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [addNotificationFromPush, queryClient]);

    // This component doesn't render anything
    return null;
}
