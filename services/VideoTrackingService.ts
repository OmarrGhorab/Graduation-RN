import { apiClient } from './apiClient';

export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';

export interface WatchHeartbeatPayload {
    lessonId: string;
    watchedSeconds: number;
    lastPosition: number;
    completed: boolean;
    deviceType: DeviceType;
}

export interface PreviewHeartbeatPayload {
    courseId: string;
    watchedSeconds: number;
    lastPosition: number;
    completed: boolean;
    deviceType: DeviceType;
}

export interface WatchHeartbeatResponse {
    success: boolean;
    data: {
        totalWatchTime: number;
        progress: number;
        completed: boolean;
    };
}

export interface LessonProgressResponse {
    success: boolean;
    data: {
        lessonId: string;
        totalWatchTime: number;
        lastPosition: number;
        progress: number;
        completed: boolean;
        lastWatchedAt: string;
    };
}

export interface PreviewProgressResponse {
    success: boolean;
    data: {
        courseId: string;
        totalWatchTime: number;
        lastPosition: number;
        progress: number;
        completed: boolean;
        lastWatchedAt: string;
    } | null;
}

export interface CourseWatchProgressResponse {
    success: boolean;
    data: {
        courseId: string;
        totalLessons: number;
        completedLessons: number;
        totalWatchTime: number;
        averageProgress: number;
        lastActivity: string;
        lessons: {
            lessonId: string;
            title: string;
            progress: number;
            completed: boolean;
            watchTime: number;
        }[];
    };
}

export interface WatchDashboardResponse {
    success: boolean;
    data: {
        totalCourses: number;
        activeCourses: number;
        completedCourses: number;
        totalWatchTime: number;
        averageEngagement: number;
        recentActivity: {
            courseId: string;
            courseName: string;
            lastWatched: string;
            progress: number;
        }[];
        streakDays: number;
    };
}

export interface RecommendationProfileResponse {
    success: boolean;
    data: {
        userId: string;
        engagementScore: number;
        preferredTopics: string[];
        watchPatterns: {
            averageSessionDuration: number;
            preferredTimeOfDay: string;
            completionRate: number;
            devicePreference: DeviceType;
        };
        courseInteractions: {
            courseId: string;
            courseName: string;
            totalWatchTime: number;
            progress: number;
            completed: boolean;
            engagementLevel: string;
            lastInteraction: string;
        }[];
        learningVelocity: string;
        recommendationFactors: {
            consistencyScore: number;
            diversityScore: number;
            depthScore: number;
        };
    };
}

export interface CourseLeaderboardResponse {
    success: boolean;
    data: {
        leaderboard: {
            rank: number;
            userId: string;
            userName: string;
            totalWatchTime: number;
            completedLessons: number;
            engagementScore: number;
        }[];
    };
}

export const videoTrackingService = {
    recordHeartbeat: (payload: WatchHeartbeatPayload) =>
        apiClient.post<WatchHeartbeatResponse>('/api/v1/watch/heartbeat', payload, {
            skipDeduplication: true,
        }),

    getLessonProgress: (lessonId: string) =>
        apiClient.get<LessonProgressResponse>(`/api/v1/watch/lesson/${lessonId}/progress`),

    recordPreviewHeartbeat: (payload: PreviewHeartbeatPayload) =>
        apiClient.post<WatchHeartbeatResponse>('/api/v1/watch/preview/heartbeat', payload, {
            skipDeduplication: true,
        }),

    getPreviewProgress: (courseId: string) =>
        apiClient.get<PreviewProgressResponse>(`/api/v1/watch/preview/${courseId}/progress`),

    getCourseProgress: (courseId: string) =>
        apiClient.get<CourseWatchProgressResponse>(`/api/v1/watch/course/${courseId}/progress`),

    getDashboard: () =>
        apiClient.get<WatchDashboardResponse>('/api/v1/watch/dashboard'),

    getRecommendationProfile: () =>
        apiClient.get<RecommendationProfileResponse>('/api/v1/watch/recommendations/profile'),

    getCourseLeaderboard: (courseId: string, limit = 10) =>
        apiClient.get<CourseLeaderboardResponse>(`/api/v1/watch/course/${courseId}/leaderboard`, {
            params: { limit },
        }),
};
