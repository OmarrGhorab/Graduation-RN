import { ChatService } from '@/services/ChatService';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

interface TypingUser {
    user_id: string;
    user_name: string;
    user_image?: string;
}

const TYPING_THROTTLE_MS = 3000; // Send typing indicator at most once every 3 seconds
const TYPING_TIMEOUT_MS = 5000; // Auto-clear typing indicator after 5 seconds

export function useTypingIndicator(conversationId: string) {
    const queryClient = useQueryClient();
    const { subscribe, isConnected } = useWebSocket();
    const lastTypingSent = useRef(0);
    const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    // Initialize typing cache with empty state
    useEffect(() => {
        queryClient.setQueryData(['typing', conversationId], { typing_users: [] });
    }, [conversationId, queryClient]);

    // Listen for typing events - try multiple event types
    useEffect(() => {
        if (!conversationId || !isConnected) return;

        // Listen for 'typing' event (unified)
        const unsubscribeTyping = subscribe('typing', (payload) => {
            const data = payload.data || payload;
            if (data.conversation_id !== conversationId) return;

            const userId = data.user_id;
            const userName = data.user_name || 'Someone';
            const isTyping = data.is_typing;

            // Update cache
            queryClient.setQueryData(['typing', conversationId], (old: any) => {
                const users = old?.typing_users || [];
                
                if (isTyping) {
                    if (!users.find((u: TypingUser) => u.user_id === userId)) {
                        const newUser: TypingUser = {
                            user_id: userId,
                            user_name: userName,
                            user_image: data.user_image,
                        };
                        return { typing_users: [...users, newUser] };
                    }
                } else {
                    return { typing_users: users.filter((u: TypingUser) => u.user_id !== userId) };
                }
                
                return old;
            });

            // Set timeout to auto-clear
            if (isTyping) {
                const existingTimeout = typingTimeouts.current.get(userId);
                if (existingTimeout) clearTimeout(existingTimeout);

                const timeout = setTimeout(() => {
                    queryClient.setQueryData(['typing', conversationId], (old: any) => {
                        const users = old?.typing_users || [];
                        return { typing_users: users.filter((u: TypingUser) => u.user_id !== userId) };
                    });
                    typingTimeouts.current.delete(userId);
                }, TYPING_TIMEOUT_MS);

                typingTimeouts.current.set(userId, timeout);
            }
        });

        return () => {
            unsubscribeTyping();
            typingTimeouts.current.forEach(clearTimeout);
            typingTimeouts.current.clear();
        };
    }, [conversationId, queryClient, subscribe, isConnected]);

    // Send typing indicator (throttled) - Use HTTP API
    const sendTypingIndicator = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingSent.current < TYPING_THROTTLE_MS) return;
        lastTypingSent.current = now;
        ChatService.sendTyping(conversationId, true).catch(console.warn);
    }, [conversationId]);

    return { sendTypingIndicator };
}
