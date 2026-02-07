import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

/**
 * Hook to manage unread message counts for a specific conversation
 */
export function useUnreadCount(conversationId: string | null) {
    const queryClient = useQueryClient();
    const { subscribe } = useWebSocket();
    const currentUser = useAuthStore(state => state.user);

    // Query to get unread count
    const { data, isLoading } = useQuery({
        queryKey: ['unread-count', conversationId],
        queryFn: () => conversationId ? ChatService.getUnreadCount(conversationId) : Promise.resolve({ unread_count: 0 }),
        enabled: !!conversationId,
        staleTime: 30000, // 30 seconds
    });

    // Listen for new messages to update unread count
    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = subscribe('message.created', (payload: any) => {
            const message = payload.data || payload;
            
            // Only increment if message is for this conversation and not from current user
            if (message.conversation_id === conversationId && message.sender_id !== currentUser?.id) {
                queryClient.setQueryData(['unread-count', conversationId], (old: any) => ({
                    unread_count: (old?.unread_count || 0) + 1
                }));
            }
        });

        return () => unsubscribe();
    }, [conversationId, currentUser?.id, queryClient, subscribe]);

    // Function to mark as read
    const markAsRead = async () => {
        if (!conversationId) return;
        
        try {
            await ChatService.markConversationAsRead(conversationId);
            
            // Update local cache
            queryClient.setQueryData(['unread-count', conversationId], { unread_count: 0 });
            
            // Also update the conversation list
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } catch (error) {
            console.error('[useUnreadCount] Failed to mark as read:', error);
        }
    };

    return {
        unreadCount: data?.unread_count || 0,
        isLoading,
        markAsRead,
    };
}

/**
 * Hook to get total unread count across all conversations
 */
export function useTotalUnreadCount() {
    const queryClient = useQueryClient();
    const { subscribe } = useWebSocket();
    const currentUser = useAuthStore(state => state.user);

    // Query to get total unread count
    const { data, isLoading } = useQuery({
        queryKey: ['total-unread-count'],
        queryFn: () => ChatService.getTotalUnreadCount(),
        staleTime: 30000, // 30 seconds
    });

    // Listen for new messages to update total count
    useEffect(() => {
        const unsubscribe = subscribe('message.created', (payload: any) => {
            const message = payload.data || payload;
            
            // Only increment if message is not from current user
            if (message.sender_id !== currentUser?.id) {
                queryClient.setQueryData(['total-unread-count'], (old: any) => ({
                    total_unread: (old?.total_unread || 0) + 1
                }));
            }
        });

        return () => unsubscribe();
    }, [currentUser?.id, queryClient, subscribe]);

    // Listen for read receipts to update total count
    useEffect(() => {
        const unsubscribe = subscribe('conversation.read', (payload: any) => {
            // Invalidate to refetch accurate count
            queryClient.invalidateQueries({ queryKey: ['total-unread-count'] });
        });

        return () => unsubscribe();
    }, [queryClient, subscribe]);

    return {
        totalUnread: data?.total_unread || 0,
        isLoading,
    };
}
