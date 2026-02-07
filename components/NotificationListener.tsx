import { useNotificationSSE } from '@/hooks/useNotificationSSE';
import { logger } from '@/libs/logger';
import { DeviceService } from '@/services/DeviceService';
import { LocationService } from '@/services/LocationService';
import { SSENotification } from '@/services/NotificationSSEService';
import { ApiNotification } from '@/services/NotificationService';
import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
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
export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export default function NotificationListener() {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const queryClient = useQueryClient();
    const router = useRouter();
    const processedMessageIds = useRef<Set<string>>(new Set());

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
            const payload = notification as any;
            const msgId = payload.id || payload.data?.id;

            // Prevent duplicate processing
            if (msgId && processedMessageIds.current.has(msgId)) {
                logger.log('[NotificationListener] Skipping duplicate message:', msgId);
                return;
            }
            if (msgId) {
                processedMessageIds.current.add(msgId);
                // Clean up old IDs periodically (optional, but good for memory)
                if (processedMessageIds.current.size > 100) {
                    const it = processedMessageIds.current.values();
                    const oldestId = it.next().value;
                    if (oldestId) {
                        processedMessageIds.current.delete(oldestId);
                    }
                }
            }

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

                // 2. Update specific conversation messages query (Active Chat)
                queryClient.setQueryData(['messages', conversationId], (old: any) => {
                    if (!old) return old;

                    let senderName = payload.senderName || payload.data?.senderName || 'User';
                    let senderImage = payload.senderImage || payload.data?.senderImage || payload.sender_image || payload.data?.sender_image || payload.userImage || payload.data?.userImage;
                    let senderId = payload.senderId || payload.data?.senderId;

                    // FIX: Backend sometimes sends UUID as senderName. Attempt to resolve from cache.
                    // The log showed senderName holding the ID: "senderName":"fae09295..."
                    const isNameUUID = senderName && senderName.includes('-') && senderName.length > 30;

                    if (isNameUUID && !senderId) {
                        senderId = senderName; // Assume the "name" is actually the ID
                    }

                    // Try to find the member in the cached conversation to get real details
                    if (senderId) {
                        const cachedConv = queryClient.getQueryData<any>(['conversation', conversationId]);
                        if (cachedConv && cachedConv.members) {
                            const member = cachedConv.members.find((m: any) => m.user_id === senderId);
                            if (member) {
                                if (isNameUUID || senderName === 'User') {
                                    senderName = member.user_name || 'User';
                                }
                                if (!senderImage) {
                                    senderImage = member.user_image;
                                }
                            }
                        }
                    }

                    const newMessage = {
                        id: payload.id || `temp-${Date.now()}`,
                        content: payload.messagePreview || payload.data?.messagePreview || payload.data?.content || payload.message || '',
                        type: payload.messageType || payload.data?.messageType || 'text',
                        sender_id: senderId,
                        sender_name: senderName,
                        sender_image: senderImage,
                        sender_role: payload.senderRole || payload.data?.senderRole || 'STUDENT',
                        created_at: payload.createdAt || new Date().toISOString(),
                        media_urls: payload.mediaUrls || payload.data?.mediaUrls || payload.data?.media_urls || payload.media_urls || [],
                        media_metadata: payload.mediaMetadata || payload.data?.mediaMetadata || payload.data?.media_metadata || payload.media_metadata || {},
                        is_deleted: false,
                    };

                    // Handle Infinite Query structure ({ pages: [...] })
                    if (old.pages) {
                        const newPages = [...old.pages];
                        if (newPages.length > 0) {
                            // Check if message already exists
                            const exists = newPages.some((page: any) => {
                                const msgs = Array.isArray(page) ? page : page?.messages || [];
                                return msgs.some((m: any) => m.id === newMessage.id);
                            });

                            if (exists) return old;

                            // Add to beginning (assuming [Newest, ..., Oldest])
                            const firstPage = newPages[0];
                            if (Array.isArray(firstPage)) {
                                newPages[0] = [newMessage, ...firstPage];
                            } else if (firstPage && typeof firstPage === 'object') {
                                newPages[0] = {
                                    ...firstPage,
                                    messages: [newMessage, ...(firstPage.messages || [])]
                                };
                            }

                            return { ...old, pages: newPages };
                        }
                    }

                    // 3. Update chat-media query cache if it's a media message or a link
                    const isMedia = ['image', 'voice', 'video', 'file'].includes(newMessage.type) ||
                        newMessage.content.includes('res.cloudinary.com');
                    const isLink = newMessage.content.includes('http') && !newMessage.content.includes('res.cloudinary.com');

                    if (isMedia || isLink) {
                        queryClient.setQueryData(['chat-media', conversationId], (oldMedia: any) => {
                            if (!oldMedia || !oldMedia.messages) return oldMedia;

                            // Check if already exists (shouldn't really happen with SSE unless duplicated)
                            if (oldMedia.messages.some((m: any) => m.id === newMessage.id)) return oldMedia;

                            return {
                                ...oldMedia,
                                messages: [newMessage, ...oldMedia.messages]
                            };
                        });
                    }

                    return old;
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
                // Check if this is a chat message notification
                if (data.type === 'CHAT_MESSAGE' || data.type === 'message') {
                    // 1. Manually call the SSE logic which already handles message cache updating perfectly
                    // We reconstruct a "SSENotification" style object from the push data
                    const ssePayload: SSENotification = {
                        type: 'CHAT_MESSAGE',
                        id: data.messageId || data.id,
                        conversationId: data.conversationId || data.conversation_id,
                        senderId: data.senderId || data.sender_id,
                        senderName: data.senderName || data.sender_name,
                        senderRole: data.senderRole || data.sender_role,
                        userImage: data.userImage || data.user_image || data.senderImage || data.sender_image, // IMPORTANT: Capture image
                        messagePreview: data.messagePreview || data.body || notification.request.content.body,
                        createdAt: data.createdAt || new Date().toISOString()
                    } as any;

                    handleSSENotification(ssePayload, false);
                    return;
                }

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

                // Create notification object for cache in Unified Format
                const apiNotification: ApiNotification = {
                    id: `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: data.type || 'info',
                    title: notification.request.content.title || data.title || 'Notification',
                    body: notification.request.content.body || data.body || '',
                    image: data.image || data.sender_image || data.user_image || null,
                    action: data.action || null,
                    read: false,
                    createdAt: data.createdAt || new Date().toISOString(),
                    data: data, // Keep raw data for backup
                };

                // Add to React Query cache
                addNotificationToCache(apiNotification);

                logger.log('[NotificationListener] Added notification to cache:', apiNotification.id);
            }
        });

        // Listen for user interaction with notifications (tap) - UNIFIED Navigation
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            logger.log('[NotificationListener] Notification tapped:', response);

            const data = response.notification.request.content.data as Record<string, any>;
            const action = data?.action;

            if (action && action.type === 'navigate') {
                logger.log('[NotificationListener] Navigating to:', action.target, 'with params:', action.params);
                // Handle params for expo-router if needed
                if (action.target === 'chat-detail' && action.params?.conversationId) {
                    router.push(`/conversation/${action.params.conversationId}`);
                } else if (action.params) {
                    // Generic navigation fallback
                    router.push({ pathname: action.target as any, params: action.params });
                } else {
                    router.push(action.target as any);
                }
            } else if (data?.type === 'parent_link_request' || data?.type === 'link-requests') {
                // Backward compatibility fallback
                router.push('/link-requests' as any);
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
