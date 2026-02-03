import { ChatService } from '@/services/ChatService';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

interface TypingUser {
    user_id: string;
    user_name: string;
}

const TYPING_THROTTLE_MS = 3000; // Send typing indicator at most once every 3 seconds
const TYPING_TIMEOUT_MS = 5000; // Auto-clear typing indicator after 5 seconds

export function useTypingIndicator(conversationId: string) {
    const queryClient = useQueryClient();
    const { send, subscribe, isConnected } = useWebSocket();
    const lastTypingSent = useRef(0);
    const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    console.log('[useTypingIndicator] Hook called with conversationId:', conversationId, 'isConnected:', isConnected);

    // Initialize typing cache with empty state
    useEffect(() => {
        console.log('[useTypingIndicator] Initializing typing cache for:', conversationId);
        queryClient.setQueryData(['typing', conversationId], { typing_users: [] });
    }, [conversationId, queryClient]);

    // Listen for typing events - try multiple event types
    useEffect(() => {
        if (!conversationId) {
            console.log('[useTypingIndicator] No conversationId, skipping listener setup');
            return;
        }

        if (!isConnected) {
            console.log('[useTypingIndicator] WebSocket not connected, skipping listener setup');
            return;
        }

        console.log('[useTypingIndicator] Setting up listeners for conversation:', conversationId);

        // Listen for 'typing' event (unified)
        const unsubscribeTyping = subscribe('typing', (payload) => {
            console.log('[useTypingIndicator] Received typing event:', payload);
            const data = payload.data || payload;
            
            if (data.conversation_id !== conversationId) {
                console.log('[useTypingIndicator] Ignoring typing event for different conversation');
                return;
            }

            const userId = data.user_id;
            const userName = data.user_name || data.name || 'Someone';
            const isTyping = data.is_typing;

            console.log('[useTypingIndicator] Processing typing event:', { userId, userName, isTyping });

            // Update cache
            queryClient.setQueryData(['typing', conversationId], (old: any) => {
                const users = old?.typing_users || [];
                
                if (isTyping) {
                    // Add user if not already typing
                    if (!users.find((u: TypingUser) => u.user_id === userId)) {
                        const newUser = {
                            user_id: userId,
                            user_name: userName,
                        };
                        console.log('[useTypingIndicator] Adding typing user:', newUser);
                        return { typing_users: [...users, newUser] };
                    }
                } else {
                    // Remove user
                    console.log('[useTypingIndicator] Removing typing user:', userId);
                    return { typing_users: users.filter((u: TypingUser) => u.user_id !== userId) };
                }
                
                return old;
            });

            // Set timeout to auto-clear
            if (isTyping) {
                const existingTimeout = typingTimeouts.current.get(userId);
                if (existingTimeout) clearTimeout(existingTimeout);

                const timeout = setTimeout(() => {
                    console.log('[useTypingIndicator] Auto-clearing typing user after timeout:', userId);
                    queryClient.setQueryData(['typing', conversationId], (old: any) => {
                        const users = old?.typing_users || [];
                        return { typing_users: users.filter((u: TypingUser) => u.user_id !== userId) };
                    });
                    typingTimeouts.current.delete(userId);
                }, TYPING_TIMEOUT_MS);

                typingTimeouts.current.set(userId, timeout);
            }
        });

        // Also listen for 'typing.user' event (alternative format)
        const unsubscribeTypingUser = subscribe('typing.user', (payload) => {
            console.log('[useTypingIndicator] Received typing.user event:', payload);
            const data = payload.data || payload;
            
            if (data.conversation_id !== conversationId) return;

            const userId = data.user_id;
            const userName = data.user_name || data.name || 'Someone';
            const isTyping = data.is_typing;

            // Update cache
            queryClient.setQueryData(['typing', conversationId], (old: any) => {
                const users = old?.typing_users || [];
                
                if (isTyping) {
                    if (!users.find((u: TypingUser) => u.user_id === userId)) {
                        const newUser = { user_id: userId, user_name: userName };
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

        console.log('[useTypingIndicator] Listeners set up successfully');

        return () => {
            console.log('[useTypingIndicator] Cleaning up listeners for conversation:', conversationId);
            unsubscribeTyping();
            unsubscribeTypingUser();
            typingTimeouts.current.forEach(clearTimeout);
            typingTimeouts.current.clear();
        };
    }, [conversationId, queryClient, subscribe, isConnected]);

    // Send typing indicator (throttled) - Use HTTP API
    const sendTypingIndicator = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingSent.current < TYPING_THROTTLE_MS) {
            console.log('[useTypingIndicator] Throttling typing indicator (too soon)');
            return;
        }

        console.log('[useTypingIndicator] Sending typing indicator via HTTP for conversation:', conversationId);
        lastTypingSent.current = now;
        
        // Send via HTTP API instead of WebSocket
        ChatService.sendTyping(conversationId, true).catch(error => {
            console.error('[useTypingIndicator] Failed to send typing indicator:', error);
        });
    }, [conversationId]);

    return { sendTypingIndicator };
}
