import { logger } from '@/libs/logger';
import { webSocketService } from '@/services/WebSocketService';
import { Conversation, ConversationDetail, UserPresenceEvent } from '@/types/chat';
import { useEffect, useState } from 'react';

/**
 * Hook to manage presence for a specific conversation
 * 
 * For DIRECT chats: Tracks peer_online status
 * For GROUP chats: Tracks is_online for all members
 * 
 * @param conversation - The conversation object (can be Conversation or ConversationDetail)
 * @returns Updated conversation with real-time presence
 */
export function useConversationPresence<T extends Conversation | ConversationDetail>(
    conversation: T | null
): T | null {
    const [updatedConversation, setUpdatedConversation] = useState<T | null>(conversation);

    // Debug logging
    useEffect(() => {
        if (conversation?.type === 'DIRECT') {
            console.log('[useConversationPresence] Initial conversation:', {
                id: conversation.id,
                type: conversation.type,
                peer_online: (conversation as any).peer_online,
                peer_profile: (conversation as any).peer_profile
            });
        }
    }, [conversation?.id]);

    // Update when conversation prop changes
    useEffect(() => {
        setUpdatedConversation(conversation);
    }, [conversation]);

    // Listen to real-time presence updates
    useEffect(() => {
        if (!conversation) return;

        const handlePresenceUpdate = (event: UserPresenceEvent) => {
            logger.log('[useConversationPresence] Presence update:', event);

            setUpdatedConversation(prev => {
                if (!prev) return prev;

                // For DIRECT chats, update peer_online
                if (prev.type === 'DIRECT' && prev.peer_profile?.id === event.user_id) {
                    return {
                        ...prev,
                        peer_online: event.is_online
                    };
                }

                // For GROUP chats or ConversationDetail with members
                if ('members' in prev && Array.isArray(prev.members)) {
                    const updatedMembers = prev.members.map(member => {
                        if (member.user_id === event.user_id) {
                            return {
                                ...member,
                                is_online: event.is_online
                            };
                        }
                        return member;
                    });

                    return {
                        ...prev,
                        members: updatedMembers
                    } as T;
                }

                return prev;
            });
        };

        // Subscribe to presence events
        webSocketService.on('chat.user.presence', handlePresenceUpdate);

        // Cleanup
        return () => {
            webSocketService.off('chat.user.presence', handlePresenceUpdate);
        };
    }, [conversation?.id]);

    return updatedConversation;
}
