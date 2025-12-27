import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    respondToParentLinkRequest,
    deleteNotification,
    ApiNotification,
} from '@/services/NotificationService';
import { STALE_TIMES } from '@/constants/queryConfig';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export function useNotificationsQuery(limit: number = 10) {
    return useInfiniteQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: async ({ pageParam = 1 }) => {
            const response = await getNotifications(pageParam, limit);
            return response;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.pagination.hasNext) {
                return lastPage.pagination.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        staleTime: STALE_TIMES.REALTIME,
    });
}

export function useMarkAsReadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
        onMutate: async (notificationId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY);

            // Optimistically update
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((n: ApiNotification) =>
                            n.id === notificationId ? { ...n, read: true } : n
                        ),
                    })),
                };
            });

            return { previousData };
        },
        onError: (_err, _notificationId, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousData);
            }
        },
    });
}

export function useMarkAllAsReadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => markAllNotificationsAsRead(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

            const previousData = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY);

            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((n: ApiNotification) => ({ ...n, read: true })),
                    })),
                };
            });

            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousData);
            }
        },
    });
}

export function useRespondToParentLinkMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, action }: { requestId: string; action: 'accept' | 'decline' }) =>
            respondToParentLinkRequest(requestId, action),
        onMutate: async ({ requestId, action }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY);

            // Optimistically update the notification
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((n: ApiNotification) => {
                            // Find the notification with matching requestId
                            if (n.data.requestId === requestId && n.type === 'parent_link_request') {
                                return {
                                    ...n,
                                    read: true,
                                    type: action === 'accept' ? 'link_request_accepted' : 'link_request_declined',
                                    data: {
                                        ...n.data,
                                        title: action === 'accept' 
                                            ? 'Link Request Accepted' 
                                            : 'Link Request Declined',
                                        body: action === 'accept'
                                            ? 'You accepted the link request'
                                            : 'You declined the link request',
                                        status: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
                                        respondedAt: new Date().toISOString(),
                                    },
                                };
                            }
                            return n;
                        }),
                    })),
                };
            });

            return { previousData };
        },
        onSuccess: () => {
            // Invalidate to refetch fresh data after responding
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        },
        onError: (_err, _vars, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousData);
            }
        },
    });
}

export function useDeleteNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) => deleteNotification(notificationId),
        onMutate: async (notificationId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY);

            // Optimistically remove the notification
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.filter((n: ApiNotification) => n.id !== notificationId),
                    })),
                };
            });

            return { previousData };
        },
        onError: (_err, _notificationId, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previousData);
            }
        },
    });
}

// Helper to invalidate notifications (call when new notification arrives)
export function useInvalidateNotifications() {
    const queryClient = useQueryClient();
    
    return () => {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    };
}

// Helper to get flattened notifications and unread count
export function useNotifications(limit: number = 10) {
    const query = useNotificationsQuery(limit);
    
    const notifications = query.data?.pages.flatMap((page) => page.data) ?? [];
    const unreadCount = notifications.filter((n) => !n.read).length;
    
    return {
        ...query,
        notifications,
        unreadCount,
    };
}
