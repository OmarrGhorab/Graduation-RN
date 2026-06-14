import { cskColors, cskDarkColors } from '@/constants/theme';
import { NotificationIconConfig } from './types';

export const getNotificationIcon = (type: string, isDark: boolean): NotificationIconConfig => {
    const primaryColor = isDark ? cskDarkColors[500] : cskColors[500];

    switch (type) {
        // Parent link
        case 'parent_link_request':
        case 'parent_link_accepted':
        case 'parent_link_declined':
        case 'parent_link_request_accepted':
        case 'parent_link_request_declined':
            return { name: 'people', color: primaryColor };
        case 'unlink_request':
        case 'unlink_request_accepted':
        case 'unlink_request_declined':
            return { name: 'person-remove', color: '#F97316' };

        // Security
        case 'security_new_device_blocked':
            return { name: 'shield', color: '#EF4444' };
        case 'security_device_verified':
            return { name: 'shield-checkmark', color: '#22C55E' };
        case 'security_password_changed':
            return { name: 'lock-closed', color: '#F97316' };

        // Chat
        case 'chat.message':
        case 'message':
        case 'CHAT_MESSAGE':
            return { name: 'chatbubble-ellipses', color: primaryColor };

        // Lessons
        case 'LESSON_STARTED':
        case 'lesson_started':
            return { name: 'play-circle', color: '#22C55E' };
        case 'LESSON_ENDED':
        case 'CHILD_LESSON_ENDED':
            return { name: 'checkmark-circle', color: primaryColor };
        case 'CHILD_LESSON_STARTED':
            return { name: 'play-circle', color: '#22C55E' };
        case 'LESSON_CANCELED':
            return { name: 'close-circle', color: '#EF4444' };
        case 'LESSON_RESCHEDULED':
            return { name: 'calendar', color: '#F97316' };
        case 'LESSON_REMINDER':
        case 'CHILD_LESSON_REMINDER':
        case 'reminder':
            return { name: 'alarm', color: '#F97316' };

        // Attendance
        case 'ATTENDANCE_RECORDED':
            return { name: 'checkmark-done', color: primaryColor };
        case 'CHILD_ATTENDANCE_RECORDED':
            return { name: 'location', color: primaryColor };
        case 'ATTENDANCE_STATUS_UPDATE':
            return { name: 'clipboard', color: '#3B82F6' };
        case 'ATTENDANCE_FRAUD_TEACHER':
        case 'ATTENDANCE_FRAUD_PARENT':
            return { name: 'warning', color: '#EF4444' };

        // Absence
        case 'ABSENCE_REQUEST_TEACHER':
        case 'ABSENCE_REQUEST_PARENT':
            return { name: 'document-text', color: '#FFB547' };

        // Courses
        case 'COURSE_ENROLLMENT':
            return { name: 'school', color: primaryColor };
        case 'COURSE_REVIEW':
            return { name: 'star', color: '#FFB547' };

        // Video
        case 'VIDEO_READY':
            return { name: 'videocam', color: primaryColor };
        case 'VIDEO_FAILED':
            return { name: 'videocam-off', color: '#EF4444' };

        // Progress
        case 'PROGRESS_UPDATED':
        case 'parent_report_ready':
            return { name: 'trending-up', color: primaryColor };

        // Subscriptions
        case 'SUBSCRIPTION_RENEWAL_SOON':
        case 'CHILD_SUBSCRIPTION_RENEWAL_SOON':
            return { name: 'card', color: '#F97316' };
        case 'SUBSCRIPTION_PAYMENT_FAILED':
            return { name: 'card', color: '#EF4444' };

        // Legacy
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

export const formatTimeAgo = (dateString: string, t: (key: string, params?: Record<string, any>) => string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minAgo', { count: diffMins });
    if (diffHours < 24) {
        return diffHours === 1 
            ? t('notifications.hourAgo', { count: diffHours })
            : t('notifications.hoursAgo', { count: diffHours });
    }
    if (diffDays === 1) return t('notifications.yesterday');
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString();
};
