import { cskColors, cskDarkColors } from '@/constants/theme';
import { NotificationIconConfig } from './types';

export const getNotificationIcon = (type: string, isDark: boolean): NotificationIconConfig => {
    const primaryColor = isDark ? cskDarkColors[500] : cskColors[500];
    
    switch (type) {
        case 'parent_link_request':
            return { name: 'people', color: primaryColor };
        case 'course':
            return { name: 'book', color: primaryColor };
        case 'assignment':
            return { name: 'document-text', color: '#FFB547' };
        case 'success':
            return { name: 'checkmark-circle', color: primaryColor };
        case 'warning':
            return { name: 'warning', color: '#FFB547' };
        default:
            return { name: 'notifications', color: '#3B82F6' };
    }
};

export const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
};
