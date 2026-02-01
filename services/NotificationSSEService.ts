import { BASE_URL } from '@/constants/config';
import { logger } from '@/libs/logger';
import { getErrorMessage } from '@/types/errors';
import EventSource from 'react-native-sse';
import { getValidAccessToken } from './AuthService';
import { ApiNotification } from './NotificationService';

// Event types matching react-native-sse library types
interface SSEMessageEvent {
    data: string | null;
    type: string;
    lastEventId: string | null;
    url: string;
}

interface SSEErrorEvent {
    type: 'error';
    message: string;
    xhrState: number;
    xhrStatus: number;
}

interface SSETimeoutEvent {
    type: 'timeout';
}

interface SSEExceptionEvent {
    type: 'exception';
    message: string;
    error: Error;
}

type SSEError = SSEErrorEvent | SSETimeoutEvent | SSEExceptionEvent;

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
    | 'unlink_request_declined'
    | 'message'
    | 'CHAT_MESSAGE';

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
    private maxRetryAttempts: number = 10;
    private retryAttempts: number = 0;

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
            logger.log('[SSE] Already connected or connecting, skipping...');
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
            logger.log('[SSE] Connecting to:', url);

            // Create EventSource with auth header
            this.eventSource = new EventSource(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            // Handle connection open
            this.eventSource.addEventListener('open', () => {
                logger.log('[SSE] Connection opened');
                this.isConnecting = false;
                this.currentReconnectDelay = this.reconnectDelay;
                this.retryAttempts = 0; // Reset retry count on successful connection
                this.onConnectionChangeCallback?.(true);
            });

            // Handle messages
            this.eventSource.addEventListener('message', (event: SSEMessageEvent) => {
                logger.log('[SSE] Raw message received:', event.data);

                if (!event.data) return;

                try {
                    // event.data might already be an object if the library parsed it, 
                    // or it might be single or double-serialized string.
                    let message: any = event.data;

                    if (typeof message === 'string') {
                        try {
                            message = JSON.parse(message);
                        } catch (e) {
                            // First parse failed, might be normal string
                        }
                    }

                    // Check if it's still a string that looks like JSON (double-serialized)
                    if (typeof message === 'string' && (message.trim().startsWith('{') || message.trim().startsWith('['))) {
                        try {
                            message = JSON.parse(message);
                        } catch (e) {
                            logger.warn('[SSE] Failed to parse potential JSON string:', message);
                            // It might be just a text message, so we'll leave it as string if this fails? 
                            // Or return if we strictly expect JSON? 
                            // For now, let's proceed and see if we can cast it.
                        }
                    }

                    this.handleMessage(message as SSEMessage);

                } catch (error) {
                    logger.warn('[SSE] Error processing message:', error);
                }
            });

            // Handle errors
            this.eventSource.addEventListener('error', (event: SSEError) => {
                const errorMessage = 'message' in event ? event.message : event.type;
                logger.error('[SSE] Error:', errorMessage);
                this.isConnecting = false;

                const error = new Error(errorMessage || 'SSE connection error');
                this.onErrorCallback?.(error);
                this.onConnectionChangeCallback?.(false);

                // Clean up and reconnect
                this.cleanup();
                this.scheduleReconnect();
            });

            // Handle close
            this.eventSource.addEventListener('close', () => {
                logger.log('[SSE] Connection closed');
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
            logger.error('[SSE] Connection error:', getErrorMessage(error));
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
            logger.log('[SSE] Connection confirmed:', (message as SSEConnectionMessage).message);
            return;
        }

        const notification = message as SSENotificationPayload;
        const isUpdate = notification.updated === true;

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

        // Check max retry limit
        if (this.retryAttempts >= this.maxRetryAttempts) {
            logger.warn(`[SSE] Max retry attempts (${this.maxRetryAttempts}) reached, giving up`);
            this.onErrorCallback?.(new Error('Max reconnection attempts reached'));
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.retryAttempts++;
        logger.log(`[SSE] Reconnecting in ${this.currentReconnectDelay / 1000}s... (attempt ${this.retryAttempts}/${this.maxRetryAttempts})`);

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
        logger.log('[SSE] Disconnecting...');
        this.shouldReconnect = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.cleanup();
        this.isConnecting = false;
        this.currentReconnectDelay = this.reconnectDelay;
        this.retryAttempts = 0; // Reset retry count on manual disconnect
        this.onConnectionChangeCallback?.(false);
    }

    /**
     * Check if currently connected or connecting
     */
    isActive(): boolean {
        return this.isConnecting || this.eventSource !== null;
    }

    /**
     * Reset retry attempts and reconnect (useful for manual retry)
     */
    resetAndReconnect(): void {
        this.retryAttempts = 0;
        this.currentReconnectDelay = this.reconnectDelay;
        this.disconnect();
        this.connect();
    }
}

// Export singleton instance
export const notificationSSEService = new NotificationSSEService();

// Also export the class for testing purposes
export { NotificationSSEService };

