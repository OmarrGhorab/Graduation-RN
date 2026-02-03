import { ConnectionState, WebSocketEventType, webSocketService } from '@/services/WebSocketService';
import { useEffect, useRef, useState } from 'react';

interface UseWebSocketOptions {
    onMessage?: (type: string, payload: any) => void;
    autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const { onMessage, autoConnect = true } = options;
    const isMounted = useRef(false);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        isMounted.current = true;

        // Initialize connection state
        setConnectionState(webSocketService.getConnectionState());
        setIsConnected(webSocketService.isConnected());

        // Subscribe to connection state changes
        const handleConnectionStateChange = (payload: { state: ConnectionState }) => {
            if (isMounted.current) {
                setConnectionState(payload.state);
                setIsConnected(payload.state === 'connected');
            }
        };

        webSocketService.on('connection.state', handleConnectionStateChange);

        // Auto connect on mount
        if (autoConnect) {
            webSocketService.connect();
        }

        return () => {
            isMounted.current = false;
            webSocketService.off('connection.state', handleConnectionStateChange);
        };
    }, [autoConnect]);

    /**
     * Subscribe to a specific event
     */
    const subscribe = (event: WebSocketEventType | string, callback: (payload: any) => void) => {
        webSocketService.on(event, callback);
        return () => webSocketService.off(event, callback);
    };

    /**
     * Send a message
     */
    const send = (type: WebSocketEventType, payload: any) => {
        webSocketService.send(type, payload);
    };

    /**
     * Connect to WebSocket
     */
    const connect = () => {
        webSocketService.connect();
    };

    /**
     * Disconnect from WebSocket
     */
    const disconnect = () => {
        webSocketService.disconnect();
    };

    /**
     * Manually trigger reconnection
     */
    const reconnect = () => {
        webSocketService.reconnect();
    };

    /**
     * Subscribe to all events for a specific conversation
     * Useful for conversation detail screens
     */
    const subscribeToConversation = (conversationId: string) => {
        const unsubscribers: (() => void)[] = [];

        // Subscribe to message events for this conversation
        const unsubMessage = subscribe('message.created', (payload) => {
            const data = payload.data || payload;
            if (data.conversation_id === conversationId) {
                // Event will be handled by the caller
            }
        });

        // Subscribe to typing events for this conversation
        const unsubTyping = subscribe('typing', (payload) => {
            const data = payload.data || payload;
            if (data.conversation_id === conversationId) {
                // Event will be handled by the caller
            }
        });

        unsubscribers.push(unsubMessage, unsubTyping);

        // Return cleanup function
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    };

    /**
     * Unsubscribe from conversation events
     * Note: This is handled automatically by the cleanup function returned from subscribeToConversation
     */
    const unsubscribeFromConversation = (conversationId: string) => {
        // This is a no-op since subscribeToConversation returns a cleanup function
        // Kept for API compatibility
        console.log(`[useWebSocket] unsubscribeFromConversation called for ${conversationId} (handled by cleanup function)`);
    };

    return {
        // Connection state
        connectionState,
        isConnected,
        
        // Connection methods
        connect,
        disconnect,
        reconnect,
        
        // Event methods
        subscribe,
        send,
        
        // Conversation helpers
        subscribeToConversation,
        unsubscribeFromConversation,
        
        // Legacy service access (for backward compatibility)
        service: webSocketService
    };
}
