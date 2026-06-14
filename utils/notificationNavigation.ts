import { Router } from 'expo-router';
import { ApiNotification } from '@/services/NotificationService';

/**
 * Single source of truth for notification tap navigation.
 * Used by both NotificationListener (FCM tray taps) and home.tsx (in-app modal taps).
 *
 * Priority order:
 *   0. Security alerts — always highest priority
 *   1. Type-specific role-based overrides (lesson, attendance)
 *   2. Explicit action.type === 'navigate' from backend
 *   3. Type-based fallback routing
 */
export function navigateFromNotification(
    notification: { type?: string; data?: Record<string, any>; action?: any },
    router: Router,
    role?: string | null,
    onScanOpen?: () => void,
): void {
    const { type = '', data = {} } = notification;

    // FCM encodes all data as strings — parse action back to object if needed
    let action = notification.action;
    if (typeof action === 'string') {
        try { action = JSON.parse(action); } catch { action = null; }
    }
    const lcType = type.toLowerCase();

    // 0. Security — highest priority
    if (type === 'security_new_device_blocked') {
        router.push({
            pathname: '/security-alert' as any,
            params: {
                deviceName: data.newDevice?.name,
                platform: data.newDevice?.platform,
                ipAddress: data.newDevice?.ipAddress,
                timestamp: data.timestamp,
                securityTip: data.securityTip,
            },
        });
        return;
    }

    // 1. Lesson / reminder — role based
    // Parent-targeted lesson notifications → course details (not scan QR)
    if (type === 'CHILD_LESSON_STARTED' || type === 'CHILD_LESSON_ENDED' ||
        type === 'CHILD_LESSON_REMINDER') {
        const courseId = data.course_id || data.courseId || action?.params?.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        } else {
            router.push('/(main)/home');
        }
        return;
    }

    const isLessonType =
        type === 'lesson_started' || type === 'LESSON_STARTED' ||
        type === 'LESSON_ENDED' ||
        type === 'LESSON_CANCELED' || type === 'LESSON_RESCHEDULED' ||
        type === 'LESSON_REMINDER' || type === 'reminder';

    if (isLessonType) {
        if (role === 'STUDENT') {
            if (onScanOpen) {
                onScanOpen();
            } else {
                router.push('/(main)/home?action=scan');
            }
            return;
        }
        if (role === 'TEACHER') {
            const lessonId = data.lessonId || data.lesson_id || action?.params?.lessonId;
            const courseId = data.courseId || data.course_id || action?.params?.courseId;
            if (lessonId) {
                router.push({ pathname: '/teacher-control', params: { lessonId } });
            } else if (courseId) {
                router.push({ pathname: '/course-details', params: { id: courseId } });
            } else {
                router.push('/(main)/home');
            }
            return;
        }
    }

    // 2. Explicit action-based navigation from backend
    if (action?.type === 'navigate') {
        const target = action.target;
        const params = action.params;

        const teacherOnlyScreens = ['teacher-control', 'teacher-dashboard', 'teacher-courses', 'create-course', 'create-lesson', 'lesson-analytics'];
        if (role === 'STUDENT' && teacherOnlyScreens.includes(target)) {
            if (onScanOpen) onScanOpen(); else router.push('/(main)/home?action=scan');
            return;
        }

        // Specialised target mappings
        if (target === 'chat-detail') {
            const convId = params?.conversationId || params?.conversation_id;
            if (convId) router.push(`/conversation/${convId}`);
            else router.push('/(main)/chat');
            return;
        }
        if (target === 'link-requests' || target === '/link-requests') {
            router.push('/settings?section=parentLink' as any);
            return;
        }
        if (target === 'security-settings' || target === '/security-settings') {
            router.push({
                pathname: '/security-alert' as any,
                params: {
                    deviceName: data.newDevice?.name,
                    platform: data.newDevice?.platform,
                    timestamp: data.timestamp,
                    securityTip: data.securityTip,
                },
            });
            return;
        }
        if (target === 'course-reviews' || target === '/course-reviews') {
            const courseId = params?.id || params?.courseId;
            if (courseId) router.push({ pathname: '/course-details', params: { id: courseId, tab: 'REVIEWS' } });
            else router.push('/(main)/courses');
            return;
        }

        // Generic fallback
        if (params && Object.keys(params).length > 0) {
            router.push({ pathname: target as any, params });
        } else {
            router.push(target as any);
        }
        return;
    }

    // 3. Type-based fallback routing (no action object from backend)

    // Chat messages → open conversation
    if (lcType === 'chat.message' || lcType === 'message' || lcType === 'chat_message') {
        const convId = data.conversation_id || data.conversationId;
        if (convId) {
            router.push(`/conversation/${convId}`);
        } else {
            router.push('/(main)/chat');
        }
        return;
    }

    // Parent link / unlink
    if (
        lcType.startsWith('parent_link') ||
        lcType.startsWith('unlink_request')
    ) {
        router.push('/settings?section=parentLink' as any);
        return;
    }

    // Parent progress report
    if (type === 'parent_report_ready') {
        const studentId = data.studentId || data.student_id;
        const period = data.period;
        router.push({ pathname: '/progress-report' as any, params: { studentId, period } });
        return;
    }

    // Attendance types → course details or progress
    if (type === 'CHILD_ATTENDANCE_RECORDED') {
        const courseId = data.course_id || data.courseId;
        const childId = data.child_id || data.childId;
        if (courseId && childId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        } else if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        }
        return;
    }

    if (type === 'ATTENDANCE_RECORDED' || type === 'ATTENDANCE_STATUS_UPDATE') {
        const courseId = data.course_id || data.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        } else {
            router.push('/(main)/home');
        }
        return;
    }

    if (type === 'ATTENDANCE_FRAUD_TEACHER') {
        const courseId = data.course_id || data.courseId;
        const lessonId = data.lesson_id || data.lessonId;
        if (lessonId) {
            router.push({ pathname: '/lesson-analytics', params: { lessonId, courseId } });
        } else if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        }
        return;
    }

    if (type === 'ATTENDANCE_FRAUD_PARENT') {
        const courseId = data.course_id || data.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        }
        return;
    }

    // Absence requests
    if (type === 'ABSENCE_REQUEST_TEACHER') {
        const courseId = data.course_id || data.courseId;
        const lessonId = data.lesson_id || data.lessonId;
        router.push({ pathname: '/absence-appeals' as any, params: { lessonId, courseId } });
        return;
    }

    if (type === 'ABSENCE_REQUEST_PARENT') {
        const courseId = data.course_id || data.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        }
        return;
    }

    // Course enrollment
    if (type === 'COURSE_ENROLLMENT') {
        const courseId = data.course_id || data.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        } else {
            router.push('/(main)/courses');
        }
        return;
    }

    // Course review
    if (type === 'COURSE_REVIEW') {
        const courseId = data.course_id || data.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId, tab: 'REVIEWS' } });
        } else {
            router.push('/(main)/courses');
        }
        return;
    }

    // Video processing
    if (type === 'VIDEO_READY' || type === 'VIDEO_FAILED') {
        const lessonId = data.lesson_id || data.lessonId;
        const courseId = data.course_id || data.courseId;
        if (lessonId && courseId) {
            router.push({ pathname: '/lesson-analytics', params: { lessonId, courseId } });
        } else if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        }
        return;
    }

    // Progress updated
    if (type === 'PROGRESS_UPDATED') {
        const courseId = data.course_id || data.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        } else {
            router.push('/(main)/home');
        }
        return;
    }

    // Subscriptions
    if (type === 'SUBSCRIPTION_RENEWAL_SOON' || type === 'CHILD_SUBSCRIPTION_RENEWAL_SOON' || type === 'SUBSCRIPTION_PAYMENT_FAILED') {
        const courseId = data.course_id || data.courseId;
        if (courseId) {
            router.push({ pathname: '/course-details', params: { id: courseId } });
        } else {
            router.push('/(main)/home');
        }
        return;
    }

    // No handler matched — do nothing (don't crash)
}
