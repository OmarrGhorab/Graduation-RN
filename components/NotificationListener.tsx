import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications';
import { logger } from '@/libs/logger';
import { DeviceService } from '@/services/DeviceService';
import { LocationService } from '@/services/LocationService';
import { SSENotification } from '@/services/NotificationSSEService';
import { ApiNotification } from '@/services/NotificationService';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef } from 'react';

/**
 * NotificationListener component
 * 
 * This component listens for incoming push notifications (FCM) and
 * real-time notifications (SSE) and updates the React Query cache.
 * It should be placed at the root of your app (in _layout.tsx) to
 * ensure it's always active.
 * 
 * SSE provides real-time notifications that work on emulators and
 * when push notifications are disabled.
 */
export default function NotificationListener() {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const queryClient = useQueryClient();

    // Add notification to React Query cache
    const addNotificationToCache = useCallback((notification: ApiNotification) => {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
            if (!old?.pages?.length) {
                // No cache exists, invalidate to trigger fetch
                queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
                return old;
            }

            // Check if notification already exists
            const exists = old.pages.some((page: any) =>
                page.data?.some((n: ApiNotification) => n.id === notification.id)
            );
            if (exists) return old;

            // Add to first page
            const newPages = [...old.pages];
            newPages[0] = {
                ...newPages[0],
                data: [notification, ...(newPages[0].data || [])],
                pagination: {
                    ...newPages[0].pagination,
                    total: (newPages[0].pagination?.total || 0) + 1,
                },
            };

            return { ...old, pages: newPages };
        });
    }, [queryClient]);

    // Handle SSE notification - memoized to prevent unnecessary reconnections
    const handleSSENotification = useCallback((notification: SSENotification, isUpdate: boolean) => {
        logger.log(`[NotificationListener] SSE ${isUpdate ? 'update' : 'notification'} received:`, notification.type);

        if (notification.type === 'message' || notification.type === 'CHAT_MESSAGE') {
            // The structure might vary. Based on logs, for CHAT_MESSAGE, the fields are top-level or in data.
            // Let's handle both cases conservatively.
            const payload = notification as any;
            const conversationId = payload.conversationId ||
                payload.data?.conversationId ||
                payload.data?.conversation_id ||
                payload.conversation_id;

            if (conversationId) {
                // Update conversations list query
                queryClient.setQueriesData({ queryKey: ['conversations'] }, (old: any) => {
                    if (!old?.conversations) return old;

                    const conversations = [...old.conversations];
                    const index = conversations.findIndex((c: any) => c.id === conversationId);

                    if (index !== -1) {
                        const conversation = { ...conversations[index] };

                        conversation.unread_count = (conversation.unread_count || 0) + 1;
                        conversation.updated_at = new Date().toISOString();

                        // Update last message preview
                        const messagePreview = payload.messagePreview || payload.data?.messagePreview || payload.data?.content || payload.message;
                        if (messagePreview) {
                            conversation.last_message = {
                                ...(conversation.last_message || {}),
                                content: messagePreview,
                                sender: {
                                    ...(conversation.last_message?.sender || {}),
                                    name: payload.senderName || payload.data?.senderName || 'User'
                                },
                                sent_at: new Date().toISOString()
                            };
                        }

                        // Move to top
                        conversations.splice(index, 1);
                        conversations.unshift(conversation);

                        return { ...old, conversations };
                    } else {
                        return old;
                    }
                });
            }
        }

        if (isUpdate) {
            // For updates, React Query cache is already updated by useNotificationSSE
            logger.log('[NotificationListener] Notification updated:', notification.id);
            return;
        }

        // New notifications are also handled by useNotificationSSE's cache update
        logger.log('[NotificationListener] New notification received via SSE:', notification.id);
    }, [queryClient]);

    // Connect to SSE for real-time notifications
    const { isConnected: sseConnected, error: sseError } = useNotificationSSE({
        onNotification: handleSSENotification,
        autoConnect: true,
    });

    // Log SSE connection status
    useEffect(() => {
        if (sseConnected) {
            logger.log('[NotificationListener] SSE connected');
        } else if (sseError) {
            logger.log('[NotificationListener] SSE error:', sseError.message);
        }
    }, [sseConnected, sseError]);

    useEffect(() => {
        // Listen for incoming notifications when app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
            logger.log('[NotificationListener] Notification received:', notification);

            const data = notification.request.content.data as Record<string, any>;

            if (data) {
                // Handle silent location request from parent
                if (data.type === 'location_request') {
                    logger.log('[NotificationListener] Location request received from parent');
                    try {
                        // Get fresh location and send to server
                        await DeviceService.getPreciseLocation({ accuracy: 'high', forceRefresh: true });
                        await LocationService.updateLocation();
                        logger.log('[NotificationListener] Location updated in response to parent request');
                    } catch (error) {
                        logger.error('[NotificationListener] Failed to update location:', error);
                    }
                    return; // Don't show this as a notification
                }

                // Create notification object for cache
                const apiNotification: ApiNotification = {
                    id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: data.type || 'info',
                    data: {
                        body: notification.request.content.body || data.body || '',
                        type: data.type || 'info',
                        title: notification.request.content.title || data.title || 'Notification',
                        createdAt: data.createdAt || new Date().toISOString(),
                        requestId: data.requestId,
                        child: data.child ? {
                            id: data.child.id,
                            name: data.child.name,
                            username: data.child.username,
                            profileImg: data.child.profileImg,
                        } : undefined,
                    },
                    read: false,
                    createdAt: data.createdAt || new Date().toISOString(),
                };

                // Add to React Query cache
                addNotificationToCache(apiNotification);

                logger.log('[NotificationListener] Added notification to cache:', apiNotification.id);
            }
        });

        // Listen for user interaction with notifications (tap)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            logger.log('[NotificationListener] Notification tapped:', response);

            const data = response.notification.request.content.data as Record<string, any>;

            // Handle notification tap - you can navigate to specific screens here
            if (data?.type === 'parent_link_request') {
                // Navigate to parent link requests screen
                logger.log('[NotificationListener] Parent link request tapped, requestId:', data.requestId);
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
    }, [addNotificationToCache]);

    // This component doesn't render anything
    return null;
}
