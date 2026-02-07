import { logger } from '@/libs/logger';
import { apiClient } from './apiClient';

// Types
export interface NotificationChild {
    id: string;
    name: string;
    username: string;
    profileImg: string | null;
}

export interface NotificationData {
    // Legacy fields
    title?: string;
    createdAt?: string;
    requestId?: string;
    child?: NotificationChild;

    // Flattened Chat fields (New)
    conversation_name?: string;
    sender_name?: string;
    sender_image?: string;
    body: string;
    unread_count?: string | number;
    type: string;

    /** Status after parent responds: "ACCEPTED" or "DECLINED" */
    status?: 'ACCEPTED' | 'DECLINED' | 'PENDING';
    /** Action taken by parent: "accept" or "decline" */
    actionTaken?: 'accept' | 'decline';
    /** Timestamp when parent responded */
    respondedAt?: string;
}

export interface ApiNotification {
    id: string;
    type: string;
    data: NotificationData;
    read: boolean;
    createdAt: string;
}

export interface NotificationPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface NotificationsResponse {
    data: ApiNotification[];
    pagination: NotificationPagination;
}

export interface MarkReadResponse {
    success: boolean;
    message?: string;
}

export interface ParentLinkRespondRequest {
    requestId: string;
    action: 'accept' | 'decline';
}

export interface ParentLinkRespondResponse {
    success: boolean;
    message?: string;
}

export interface DeleteNotificationResponse {
    success: boolean;
    message?: string;
}

/**
 * Fetch notifications for the current user
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 10)
 */
export async function getNotifications(page: number = 1, limit: number = 10): Promise<NotificationsResponse> {
    logger.log('[Notifications] Fetching notifications');
    return apiClient.get<NotificationsResponse>('/api/v1/notifications', {
        params: { page, limit },
    });
}

/**
 * Mark a specific notification as read
 * @param notificationId - ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<MarkReadResponse> {
    logger.log('[Notifications] Marking notification as read:', notificationId);
    const response = await apiClient.patch<{ message?: string }>('/api/v1/notifications/read', { notificationId });
    return { success: true, message: response.message };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<MarkReadResponse> {
    logger.log('[Notifications] Marking all notifications as read');
    const response = await apiClient.patch<{ message?: string }>('/api/v1/notifications/read', { markAll: 'true' });
    return { success: true, message: response.message };
}

/**
 * Delete a specific notification
 * @param notificationId - ID of the notification to delete
 */
export async function deleteNotification(notificationId: string): Promise<DeleteNotificationResponse> {
    logger.log('[Notifications] Deleting notification:', notificationId);
    const response = await apiClient.delete<{ message?: string }>(`/api/v1/notifications/${notificationId}`);
    return { success: true, message: response.message };
}

/**
 * Respond to a parent link request (accept or decline)
 * @param requestId - ID of the parent link request
 * @param action - 'accept' or 'decline'
 */
export async function respondToParentLinkRequest(
    requestId: string,
    action: 'accept' | 'decline'
): Promise<ParentLinkRespondResponse> {
    logger.log('[Notifications] Responding to parent link request:', { requestId, action });
    const response = await apiClient.post<{ message?: string }>('/api/v1/parent-link/respond', { requestId, action });
    return { success: true, message: response.message };
}
