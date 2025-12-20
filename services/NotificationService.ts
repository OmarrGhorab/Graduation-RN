import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';

// Types
export interface NotificationChild {
    id: string;
    name: string;
    username: string;
    profileImg: string | null;
}

export interface NotificationData {
    body: string;
    type: string;
    child?: NotificationChild;
    title: string;
    createdAt: string;
    requestId?: string;
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

/**
 * Fetch notifications for the current user
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 10)
 */
export async function getNotifications(page: number = 1, limit: number = 10): Promise<NotificationsResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const url = `${BASE_URL}/api/v1/notifications?page=${page}&limit=${limit}`;
        console.log('[Notifications] Fetching notifications:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Failed to fetch notifications');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Notifications] Fetch failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(`Cannot connect to server at ${BASE_URL}.`);
        }

        throw error;
    }
}

/**
 * Mark a specific notification as read
 * @param notificationId - ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<MarkReadResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Notifications] Marking notification as read:', notificationId);

        const response = await fetch(`${BASE_URL}/api/v1/notifications/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ notificationId }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Failed to mark notification as read');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return { success: true, message: responseData.message };
    } catch (error: any) {
        console.error('[Notifications] Mark as read failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(`Cannot connect to server at ${BASE_URL}.`);
        }

        throw error;
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<MarkReadResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Notifications] Marking all notifications as read');

        const response = await fetch(`${BASE_URL}/api/v1/notifications/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ markAll: 'true' }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Failed to mark all notifications as read');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return { success: true, message: responseData.message };
    } catch (error: any) {
        console.error('[Notifications] Mark all as read failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(`Cannot connect to server at ${BASE_URL}.`);
        }

        throw error;
    }
}

export interface ParentLinkRespondRequest {
    requestId: string;
    action: 'accept' | 'decline';
}

export interface ParentLinkRespondResponse {
    success: boolean;
    message?: string;
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
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Notifications] Responding to parent link request:', { requestId, action });

        const response = await fetch(`${BASE_URL}/api/v1/parent-link/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ requestId, action }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Failed to respond to parent link request');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return { success: true, message: responseData.message };
    } catch (error: any) {
        console.error('[Notifications] Parent link respond failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(`Cannot connect to server at ${BASE_URL}.`);
        }

        throw error;
    }
}
