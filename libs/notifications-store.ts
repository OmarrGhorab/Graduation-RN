import { create } from 'zustand';
import { ApiNotification } from '@/services/NotificationService';

interface NotificationState {
    notifications: ApiNotification[];
    unreadCount: number;
    isLoading: boolean;
    
    // Actions
    setNotifications: (notifications: ApiNotification[]) => void;
    addNotification: (notification: ApiNotification) => void;
    addNotificationFromPush: (pushData: PushNotificationData) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    setLoading: (loading: boolean) => void;
    clearNotifications: () => void;
}

// Push notification data structure from FCM
export interface PushNotificationData {
    type: string;
    title: string;
    body: string;
    requestId?: string;
    child?: {
        id: string;
        name: string;
        username: string;
        profileImg: string | null;
    };
    createdAt: string;
}

// Convert push notification to ApiNotification format
const pushToApiNotification = (pushData: PushNotificationData): ApiNotification => {
    const id = `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
        id,
        type: pushData.type,
        data: {
            body: pushData.body,
            type: pushData.type,
            title: pushData.title,
            createdAt: pushData.createdAt,
            requestId: pushData.requestId,
            child: pushData.child,
        },
        read: false,
        createdAt: pushData.createdAt || new Date().toISOString(),
    };
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.read).length;
        set({ notifications, unreadCount });
    },

    addNotification: (notification) => {
        set((state) => {
            // Check if notification already exists
            const exists = state.notifications.some((n) => n.id === notification.id);
            if (exists) return state;

            const newNotifications = [notification, ...state.notifications];
            const unreadCount = newNotifications.filter((n) => !n.read).length;
            return { notifications: newNotifications, unreadCount };
        });
    },

    addNotificationFromPush: (pushData) => {
        const notification = pushToApiNotification(pushData);
        get().addNotification(notification);
    },

    markAsRead: (id) => {
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            );
            const unreadCount = notifications.filter((n) => !n.read).length;
            return { notifications, unreadCount };
        });
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    setLoading: (isLoading) => set({ isLoading }),

    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
