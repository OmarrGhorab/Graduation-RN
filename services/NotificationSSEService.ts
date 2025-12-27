import EventSource from 'react-native-sse';
import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';
import { ApiNotification } from './NotificationService';
import { getErrorMessage } from '@/types/errors';

// Event types from react-native-sse (library doesn't export these)
interface SSEMessageEvent {
    data: string;
}

interface SSEErrorEvent {
    message?: string;
}

// SSE Notification types
export type SSENotificationType =
    | 'connected'
    | 'parent_link_request'
    | 'parent_link_accepted'
    | 'parent_link_declined'
    | 'parent_link_request_accepted'
    | 'parent_link_request_declined'
    | 'unlink_request'
    | 'unlink_request_accepted'
    | 'unlink_request_declined';

export interface SSENotification extends ApiNotification {
    type: SSENotificationType;
}

export interface SSEConnectionMessage {
    type: 'connected';
    message: string;
}

export interface SSENotificationPayload extends SSENotification {
    /** True if this is an update to an existing notification */
    updated?: boolean;
}

export type SSEMessage = SSENotificationPayload | SSEConnectionMessage;

/** Check if message is an update to existing notification */
export function isNotificationUpdate(message: SSEMessage): boolean {
    return 'updated' in message && message.updated === true;
}

type NotificationCallback = (notification: SSENotification, isUpdate: boolean) => void;
type ConnectionCallback = (connected: boolean) => void;
type ErrorCallback = (error: Error) => void;

class NotificationSSEService {
    private eventSource: EventSource | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private isConnecting: boolean = false;
    private shouldReconnect: boolean = true;
    private reconnectDelay: number = 5000;
    private maxReconnectDelay: number = 30000;
    private currentReconnectDelay: number = 5000;

    private onNotificationCallback: NotificationCallback | null = null;
    private onConnectionChangeCallback: ConnectionCallback | null = null;
    private onErrorCallback: ErrorCallback | null = null;

    /**
     * Set callback for new notifications
     */
    onNotification(callback: NotificationCallback): void {
        this.onNotificationCallback = callback;
    }

    /**
     * Set callback for connection state changes
     */
    onConnectionChange(callback: ConnectionCallback): void {
        this.onConnectionChangeCallback = callback;
    }

    /**
     * Set callback for errors
     */
    onError(callback: ErrorCallback): void {
        this.onErrorCallback = callback;
    }

    /**
     * Connect to SSE endpoint for real-time notifications
     */
    async connect(): Promise<void> {
        if (this.isConnecting || this.eventSource) {
            console.log('[SSE] Already connected or connecting, skipping...');
            return;
        }

        this.shouldReconnect = true;
        this.isConnecting = true;

        try {
            const token = await getValidAccessToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const url = `${BASE_URL}/api/v1/notifications/subscribe`;
            console.log('[SSE] Connecting to:', url);

            // Create EventSource with auth header
            this.eventSource = new EventSource(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            // Handle connection open
            this.eventSource.addEventListener('open', () => {
                console.log('[SSE] Connection opened');
                this.isConnecting = false;
                this.currentReconnectDelay = this.reconnectDelay;
                this.onConnectionChangeCallback?.(true);
            });

            // Handle messages
            this.eventSource.addEventListener('message', (event: SSEMessageEvent) => {
                console.log('[SSE] Raw message received:', event.data);
                
                if (!event.data) return;

                try {
                    const message = JSON.parse(event.data) as SSEMessage;
                    this.handleMessage(message);
                } catch (parseError) {
                    console.warn('[SSE] Failed to parse message:', event.data);
                }
            });

            // Handle errors
            this.eventSource.addEventListener('error', (event: SSEErrorEvent) => {
                console.error('[SSE] Error:', event.message || 'Unknown error');
                this.isConnecting = false;
                
                const error = new Error(event.message || 'SSE connection error');
                this.onErrorCallback?.(error);
                this.onConnectionChangeCallback?.(false);

                // Clean up and reconnect
                this.cleanup();
                this.scheduleReconnect();
            });

            // Handle close
            this.eventSource.addEventListener('close', () => {
                console.log('[SSE] Connection closed');
                this.isConnecting = false;
                this.onConnectionChangeCallback?.(false);

                // Clean up and reconnect
                this.cleanup();
                if (this.shouldReconnect) {
                    this.scheduleReconnect();
                }
            });

        } catch (error) {
            this.isConnecting = false;
            console.error('[SSE] Connection error:', getErrorMessage(error));
            this.onErrorCallback?.(error instanceof Error ? error : new Error(getErrorMessage(error)));
            this.onConnectionChangeCallback?.(false);
            this.scheduleReconnect();
        }
    }

    /**
     * Handle incoming SSE message
     */
    private handleMessage(message: SSEMessage): void {
        if (message.type === 'connected') {
            console.log('[SSE] Connection confirmed:', (message as SSEConnectionMessage).message);
            return;
        }

        const notification = message as SSENotificationPayload;
        const isUpdate = notification.updated === true;
        
        console.log(
            `[SSE] ${isUpdate ? 'Updated' : 'New'} notification:`,
            notification.type,
            'id:',
            notification.id
        );
        
        this.onNotificationCallback?.(notification, isUpdate);
    }

    /**
     * Clean up EventSource
     */
    private cleanup(): void {
        if (this.eventSource) {
            this.eventSource.removeAllEventListeners();
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    /**
     * Schedule a reconnection attempt with exponential backoff
     */
    private scheduleReconnect(): void {
        if (!this.shouldReconnect) {
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        console.log(`[SSE] Reconnecting in ${this.currentReconnectDelay / 1000}s...`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, this.currentReconnectDelay);

        // Exponential backoff
        this.currentReconnectDelay = Math.min(
            this.currentReconnectDelay * 1.5,
            this.maxReconnectDelay
        );
    }

    /**
     * Disconnect from SSE
     */
    disconnect(): void {
        console.log('[SSE] Disconnecting...');
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.cleanup();
        this.isConnecting = false;
        this.currentReconnectDelay = this.reconnectDelay;
        this.onConnectionChangeCallback?.(false);
    }

    /**
     * Check if currently connected or connecting
     */
    isActive(): boolean {
        return this.isConnecting || this.eventSource !== null;
    }
}

// Export singleton instance
export const notificationSSEService = new NotificationSSEService();

// Also export the class for testing purposes
export { NotificationSSEService };
