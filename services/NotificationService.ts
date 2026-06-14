import { logger } from '@/libs/logger';
import { apiClient } from './apiClient';

// Types
export interface NotificationChild {
    id: string;
    name: string;
    username: string;
    profileImg: string | null;
}

export interface NotificationAction {
    type: 'navigate' | 'external_url';
    target: string;
    params?: Record<string, any>;
}

export interface ApiNotification {
    id: string;
    type: string;
    title: string;
    body: string;
    image: string | null;
    action: NotificationAction | null;
    read: boolean;
    createdAt: string;
    data: Record<string, any>;
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

export function getNotificationRequestId(notification: Pick<ApiNotification, 'data' | 'action'>): string | null {
    return (
        notification.data?.requestId ||
        notification.data?.request_id ||
        notification.data?.linkRequestId ||
        notification.data?.link_request_id ||
        notification.data?.request?.id ||
        notification.action?.params?.requestId ||
        notification.action?.params?.request_id ||
        null
    );
}

export function isSameNotification(a: ApiNotification, b: ApiNotification): boolean {
    if (a.id === b.id) return true;

    // Cross-match real DB id with notification_id embedded in FCM data
    const aRealId = a.id || a.data?.notification_id;
    const bRealId = b.id || b.data?.notification_id;
    if (aRealId && bRealId && aRealId === bRealId) return true;

    if (a.type !== b.type) return false;

    // Chat: same conversation + same message
    if (a.type === 'chat.message') {
        const aMsg = a.data?.message_id;
        const bMsg = b.data?.message_id;
        if (aMsg && bMsg) return aMsg === bMsg;
    }

    // Lesson / child lesson: same lesson_id
    if (a.type.startsWith('LESSON_') || a.type.startsWith('CHILD_LESSON_')) {
        const aLesson = a.data?.lesson_id;
        const bLesson = b.data?.lesson_id;
        if (aLesson && bLesson) return aLesson === bLesson;
    }

    // Attendance: same lesson + same student
    if (a.type.startsWith('ATTENDANCE_') || a.type.startsWith('CHILD_ATTENDANCE_')) {
        const aLesson = a.data?.lesson_id;
        const bLesson = b.data?.lesson_id;
        if (aLesson && bLesson) return aLesson === bLesson;
    }

    // Parent link / unlink: same request id
    const aRequestId = getNotificationRequestId(a);
    const bRequestId = getNotificationRequestId(b);
    if (aRequestId && bRequestId && aRequestId === bRequestId) return true;

    return false;
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
