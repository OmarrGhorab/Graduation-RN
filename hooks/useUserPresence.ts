import { logger } from '@/libs/logger';
import { ChatService } from '@/services/ChatService';
import { webSocketService } from '@/services/WebSocketService';
import { UserPresenceEvent } from '@/types/chat';
import { useEffect, useState } from 'react';

/**
 * Hook to manage user presence (online/offline status)
 * 
 * Features:
 * - Fetches initial presence for a list of user IDs
 * - Listens to real-time presence updates via WebSocket
 * - Automatically updates presence state when users go online/offline
 * 
 * @param userIds - Array of user IDs to track presence for
 * @returns Object with presence map and loading state
 */
export function useUserPresence(userIds: string[]) {
    const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    // Fetch initial presence
    useEffect(() => {
        if (userIds.length === 0) {
            setLoading(false);
            return;
        }

        const fetchPresence = async () => {
            try {
                setLoading(true);
                const response = await ChatService.checkUserPresence(userIds);
                setPresenceMap(response.presence);
            } catch (error) {
                logger.error('[useUserPresence] Failed to fetch presence:', error);
                // Set all users as offline on error
                const offlineMap: Record<string, boolean> = {};
                userIds.forEach(id => offlineMap[id] = false);
                setPresenceMap(offlineMap);
            } finally {
                setLoading(false);
            }
        };

        fetchPresence();
    }, [userIds.join(',')]); // Re-fetch when user IDs change

    // Listen to real-time presence updates
    useEffect(() => {
        const handlePresenceUpdate = (event: UserPresenceEvent) => {
            logger.log('[useUserPresence] Presence update:', event);
            
            setPresenceMap(prev => ({
                ...prev,
                [event.user_id]: event.is_online
            }));
        };

        // Subscribe to presence events
        webSocketService.on('chat.user.presence', handlePresenceUpdate);

        // Cleanup
        return () => {
            webSocketService.off('chat.user.presence', handlePresenceUpdate);
        };
    }, []);

    return {
        presenceMap,
        loading,
        isOnline: (userId: string) => presenceMap[userId] ?? false,
    };
}
