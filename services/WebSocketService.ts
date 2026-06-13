import { WS_URL } from '@/constants/config';
import { logger } from '@/libs/logger';
import { getValidAccessToken } from './AuthService';

// Define known event types
export type WebSocketEventType =
    | 'message.send'
    | 'message.created'
    | 'message.ack'
    | 'typing.start'
    | 'typing.stop'
    | 'typing.update'
    | 'typing' // Unified typing event
    | 'chat.user.presence' // User presence event
    | 'connection.established'
    | 'error';

export interface WebSocketMessage {
    type: WebSocketEventType;
    payload?: any;
    event?: string;
    data?: any;
}

// Connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

type EventCallback = (payload: any) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private listeners: Map<string, Set<EventCallback>> = new Map();
    private isConnecting: boolean = false;
    private shouldReconnect: boolean = true;
    private connectionState: ConnectionState = 'disconnected';

    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10; // Max retry limit
    private maxReconnectDelay = 30000;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    private messageQueue: string[] = [];

    private static instance: WebSocketService;

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    /**
     * Get current connection state
     */
    public getConnectionState(): ConnectionState {
        return this.connectionState;
    }

    /**
     * Check if WebSocket is connected
     */
    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN && this.connectionState === 'connected';
    }

    /**
     * Set connection state and emit change event
     */
    private setConnectionState(state: ConnectionState): void {
        if (this.connectionState !== state) {
            this.connectionState = state;
            logger.log(`[WS] Connection state changed to: ${state}`);
            this.emit('connection.state', { state });
        }
    }

    /**
     * Normalize incoming WebSocket events to a consistent format
     */
    private normalizeEvent(rawData: string): WebSocketMessage | null {
        try {
            const parsed = JSON.parse(rawData);
            
            // Normalize event type - check multiple possible fields
            const type = parsed.type || parsed.event || parsed.event_type;
            
            // Normalize payload - check multiple possible fields
            const payload = parsed.payload || parsed.data || parsed;
            
            if (!type) {
                logger.warn('[WS] Message missing type field:', parsed);
                return null;
            }

            return { type, payload };
        } catch (e) {
            logger.error('[WS] Failed to parse message:', rawData, e);
            return null;
        }
    }

    /**
     * Validate payload before sending
     */
    private validatePayload(type: WebSocketEventType, payload: any): boolean {
        // Basic validation - ensure payload is an object
        if (payload === null || payload === undefined) {
            logger.warn(`[WS] Invalid payload for ${type}: null or undefined`);
            return false;
        }

        // Type-specific validation
        switch (type) {
            case 'message.send':
                if (!payload.conversation_id || !payload.content) {
                    logger.warn(`[WS] Invalid message.send payload:`, payload);
                    return false;
                }
                break;
            case 'typing.start':
            case 'typing.stop':
                if (!payload.conversation_id) {
                    logger.warn(`[WS] Invalid typing payload:`, payload);
                    return false;
                }
                break;
        }

        return true;
    }

    async connect(token?: string): Promise<void> {
        // Early return if already connected or connecting
        if (this.ws?.readyState === WebSocket.OPEN) {
            logger.log('[WS] Already connected, skipping connect()');
            return;
        }
        if (this.isConnecting) {
            logger.log('[WS] Connection already in progress, skipping connect()');
            return;
        }

        // Check if we've exceeded max reconnect attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('[WS] Max reconnection attempts reached. Clearing message queue.');
            this.messageQueue = []; // Clear queue on permanent failure
            this.setConnectionState('disconnected');
            this.shouldReconnect = false;
            return;
        }

        this.shouldReconnect = true;
        this.isConnecting = true;
        this.setConnectionState('connecting');

        logger.log('[WS] Starting Connect Sequence...');

        try {
            const finalToken = token || await getValidAccessToken();
            if (!finalToken) {
                logger.error('[WS] No access token available. Aborting.');
                this.isConnecting = false;
                this.setConnectionState('disconnected');
                return;
            }

            const url = `${WS_URL}/ws?token=${finalToken}`;
            logger.log(`[WS] Connecting to: ${WS_URL}`);
            this.ws = new WebSocket(url);

            // Add connection timeout (10 seconds)
            const connectionTimeout = setTimeout(() => {
                if (this.ws?.readyState === WebSocket.CONNECTING) {
                    console.error('[WS TIMEOUT] Connection timeout after 10 seconds');
                    console.error(`[WS TIMEOUT] Server may be down or unreachable at ${WS_URL}`);
                    this.ws?.close();
                    this.isConnecting = false;
                    this.setConnectionState('disconnected');
                }
            }, 10000);

            this.ws.onopen = () => {
                clearTimeout(connectionTimeout);
                logger.log('[WS] Connected');
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                this.setConnectionState('connected');
                this.processMessageQueue();
                this.emit('connection.established', { connected: true });
            };

            this.ws.onmessage = (event) => {
                // Defensive check for null/undefined data
                if (event.data === undefined || event.data === null) {
                    logger.warn('[WS] Received undefined/null event data');
                    return;
                }

                // Handle "ping" text
                if (event.data === 'ping') {
                    this.ws?.send('pong');
                    return;
                }

                // Use normalization for all events
                try {
                    const message = this.normalizeEvent(event.data);
                    
                    if (message) {
                        this.emit(message.type, message.payload);
                    }
                } catch (e) {
                    // Catch errors from listeners to prevent WebSocket from closing
                    logger.error('[WS] Error processing message:', (e as any).message, e);
                }
            };

            this.ws.onerror = (e) => {
                this.isConnecting = false;
                console.error('[WS ERROR] WebSocket error occurred:', e);
                console.error('[WS ERROR] Error type:', e.type);
                console.error('[WS ERROR] Error target:', e.target);
                logger.error('[[WS ERROR TRAP]] OnError Event:', (e as any).message || 'No Error Message', e);
                // Don't change state here - let onclose handle it
            };

            this.ws.onclose = (e) => {
                this.isConnecting = false;
                console.log(`[WS CLOSE] Connection closed. Code: ${e.code}, Reason: "${e.reason}", Clean: ${e.wasClean}`);
                logger.log(`[WS] Closed: ${e.code} (${e.reason})`);
                this.cleanup();
                
                if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.setConnectionState('reconnecting');
                    this.scheduleReconnect(finalToken);
                } else {
                    this.setConnectionState('disconnected');
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        logger.error('[WS] Max reconnection attempts reached');
                        this.messageQueue = []; // Clear queue on permanent failure
                    }
                }
            };

        } catch (error) {
            logger.error('[[WS ERROR TRAP]] Connect Function Failed:', error);
            this.isConnecting = false;
            this.setConnectionState('disconnected');
            
            if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.setConnectionState('reconnecting');
                this.scheduleReconnect(token || '');
            }
        }
    }

    sendTyping(conversationId: string) {
        // Safe check
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.send('typing.start', { conversation_id: conversationId });
        }
    }

    send(type: WebSocketEventType, payload: any): void {
        if (!this.validatePayload(type, payload)) {
            logger.error(`[WS] Invalid payload for ${type}, not sending`);
            return;
        }

        const message = JSON.stringify({ type, payload });

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            logger.log(`[WS] Queueing message: ${type} (not connected)`);
            this.messageQueue.push(message);
            if (!this.isConnecting && this.shouldReconnect) {
                this.connect();
            }
        }
    }

    on(event: string, callback: EventCallback): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);
    }

    off(event: string, callback: EventCallback): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    disconnect(): void {
        this.shouldReconnect = false;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.close();
        }
        this.cleanup();
        this.setConnectionState('disconnected');
    }

    /**
     * Manually trigger reconnection
     */
    reconnect(): void {
        logger.log('[WS] Manual reconnect triggered');
        this.disconnect();
        this.reconnectAttempts = 0; // Reset attempts on manual reconnect
        this.shouldReconnect = true;
        this.connect();
    }

    private emit(event: string, payload: any): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            // execute safely
            callbacks.forEach(cb => {
                try {
                    cb(payload);
                } catch (e) {
                    logger.error(`[WS] Error in listener for ${event}:`, e);
                }
            });
        }
    }

    private cleanup(): void {
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws = null;
        }
    }

    private scheduleReconnect(token: string): void {
        if (this.reconnectTimeout) return;
        
        // Check if we've exceeded max attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('[WS] Max reconnection attempts reached. Stopping reconnection.');
            this.shouldReconnect = false;
            this.messageQueue = []; // Clear queue on permanent failure
            this.setConnectionState('disconnected');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
        logger.log(`[WS] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.reconnectAttempts++;
            this.connect(token);
        }, delay);
    }

    private processMessageQueue(): void {
        while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
            const msg = this.messageQueue.shift();
            if (msg) this.ws.send(msg);
        }
    }
}

export const webSocketService = WebSocketService.getInstance();
