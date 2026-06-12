import { useEffect, useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/libs/auth';
import {
    notificationSSEService,
    SSENotification,
} from '@/services/NotificationSSEService';
import { NOTIFICATIONS_QUERY_KEY } from './useNotifications';
import { ApiNotification, isSameNotification } from '@/services/NotificationService';
import { logger } from '@/libs/logger';

interface UseNotificationSSEOptions {
    /** Called when a new notification arrives or existing one is updated */
    onNotification?: (notification: SSENotification, isUpdate: boolean) => void;
    /** Whether to auto-connect when authenticated (default: true) */
    autoConnect?: boolean;
}

interface UseNotificationSSEReturn {
    /** Whether SSE is currently connected */
    isConnected: boolean;
    /** Last error that occurred */
    error: Error | null;
    /** Manually connect to SSE */
    connect: () => void;
    /** Manually disconnect from SSE */
    disconnect: () => void;
}

/**
 * Hook for managing SSE notification connection
 * Automatically connects when authenticated and handles app state changes
 */
export function useNotificationSSE(
    options: UseNotificationSSEOptions = {}
): UseNotificationSSEReturn {
    const { onNotification, autoConnect = true } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const queryClient = useQueryClient();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const onNotificationRef = useRef(onNotification);

    // Keep callback ref updated
    useEffect(() => {
        onNotificationRef.current = onNotification;
    }, [onNotification]);

    // Handle new notification - update cache and call callback
    const handleNotification = useCallback(
        (notification: SSENotification, isUpdate: boolean) => {
            logger.log(`[useNotificationSSE] ${isUpdate ? 'Updated' : 'New'} notification:`, notification.type);

            const currentData = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY);
            
            if (currentData) {
                queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
                    if (!old?.pages?.length) return old;

                    if (isUpdate) {
                        // UPDATE existing notification
                        logger.log('[useNotificationSSE] Updating existing notification in cache');
                        
                        const newPages = old.pages.map((page: any) => ({
                            ...page,
                            data: page.data?.map((n: ApiNotification) =>
                                n.id === notification.id ? { ...n, ...notification } : n
                            ) || [],
                        }));

                        return { ...old, pages: newPages };
                    } else {
                        // ADD new notification
                        const exists = old.pages.some((page: any) =>
                            page.data?.some((n: ApiNotification) => isSameNotification(n, notification as ApiNotification))
                        );

                        if (exists) {
                            logger.log('[useNotificationSSE] Notification already in cache');
                            return old;
                        }

                        logger.log('[useNotificationSSE] Adding new notification to cache');
                        
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
                    }
                });
            } else {
                // No cache exists yet, invalidate to trigger a fetch
                logger.log('[useNotificationSSE] No cache, invalidating queries');
                queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
            }

            // Call user callback
            onNotificationRef.current?.(notification, isUpdate);
        },
        [queryClient]
    );

    // Setup SSE callbacks
    useEffect(() => {
        notificationSSEService.onNotification(handleNotification);
        notificationSSEService.onConnectionChange(setIsConnected);
        notificationSSEService.onError(setError);

        return () => {
            // Clear callbacks on unmount
            notificationSSEService.onNotification(() => {});
            notificationSSEService.onConnectionChange(() => {});
            notificationSSEService.onError(() => {});
        };
    }, [handleNotification]);

    // Auto-connect when authenticated
    useEffect(() => {
        if (!autoConnect) return;

        if (isAuthenticated) {
            logger.log('[useNotificationSSE] Authenticated, connecting...');
            notificationSSEService.connect();
        } else {
            logger.log('[useNotificationSSE] Not authenticated, disconnecting...');
            notificationSSEService.disconnect();
        }

        return () => {
            // Don't disconnect on unmount if still authenticated
            // The service is a singleton and should stay connected
        };
    }, [isAuthenticated, autoConnect]);

    // Handle app state changes (reconnect when app comes to foreground)
    useEffect(() => {
        if (!autoConnect || !isAuthenticated) return;

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && !notificationSSEService.isActive()) {
                logger.log('[useNotificationSSE] App active, reconnecting...');
                notificationSSEService.connect();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated, autoConnect]);

    const connect = useCallback(() => {
        setError(null);
        notificationSSEService.connect();
    }, []);

    const disconnect = useCallback(() => {
        notificationSSEService.disconnect();
    }, []);

    return {
        isConnected,
        error,
        connect,
        disconnect,
    };
}
