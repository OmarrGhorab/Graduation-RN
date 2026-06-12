import { ApiNotification } from '@/services/NotificationService';

export interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
    notifications: ApiNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    loading?: boolean;
    onRefresh?: () => void;
    onNotificationPress?: (notification: ApiNotification) => void;
    onLoadMore?: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onDeleteNotification?: (notificationId: string) => void;
    onRespondToParentLink?: (requestId: string, action: 'accept' | 'decline') => void;
    respondingRequestId?: string | null;
}

export interface NotificationItemProps {
    item: ApiNotification;
    onPress: (item: ApiNotification) => void;
    onDelete?: (id: string) => void;
    onRespondToParentLink?: (requestId: string, action: 'accept' | 'decline') => void;
    isResponding?: boolean;
}

export type NotificationIconConfig = {
    name: string;
    color: string;
};
