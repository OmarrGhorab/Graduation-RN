import { STALE_TIMES } from '@/constants/queryConfig';
import {
    cancelLesson,
    createLesson,
    endLesson,
    getCourseLessons,
    getLessonAttendance,
    getLessonDetails,
    getLessonQR,
    rescheduleLesson,
    manualAttendanceOverride,
    rotateQRToken,
    scanAttendance,
    startLesson,
    updateLesson
} from '@/services/CourseService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const LESSON_DETAILS_QUERY_KEY = (id: string) => ['lesson', id];
export const LESSON_QR_QUERY_KEY = (id: string) => ['lesson', id, 'qr'];
export const LESSON_ATTENDANCE_QUERY_KEY = (id: string) => ['lesson', id, 'attendance'];
export const COURSE_LESSONS_QUERY_KEY = (courseId: string) => ['course', courseId, 'lessons'];

export function useLessonDetails(lessonId: string) {
    return useQuery({
        queryKey: LESSON_DETAILS_QUERY_KEY(lessonId),
        queryFn: () => getLessonDetails(lessonId),
        enabled: !!lessonId,
        staleTime: STALE_TIMES.REALTIME,
    });
}

export function useLessonQR(lessonId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: LESSON_QR_QUERY_KEY(lessonId),
        queryFn: () => getLessonQR(lessonId),
        enabled: !!lessonId && enabled,
        refetchInterval: 15000, // Refresh every 15s (recommended: 15-20s for 30s QR validity with ±30s tolerance)
        staleTime: 0,
    });
}

export function useLessonAttendance(lessonId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: LESSON_ATTENDANCE_QUERY_KEY(lessonId),
        queryFn: () => getLessonAttendance(lessonId),
        enabled: !!lessonId && enabled,
        refetchInterval: 10000, // Refresh every 10s to show new students scanning
        staleTime: STALE_TIMES.REALTIME,
    });
}

export function useLessonControl(lessonId: string) {
    const queryClient = useQueryClient();

    const startLessonMutation = useMutation({
        mutationFn: () => startLesson(lessonId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LESSON_DETAILS_QUERY_KEY(lessonId) });
            queryClient.invalidateQueries({ queryKey: LESSON_QR_QUERY_KEY(lessonId) });
        },
    });

    const endLessonMutation = useMutation({
        mutationFn: () => endLesson(lessonId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LESSON_DETAILS_QUERY_KEY(lessonId) });
        },
    });

    return {
        startLesson: startLessonMutation,
        endLesson: endLessonMutation,
    };
}

export function useCreateLesson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createLesson,
        onSuccess: (response) => {
            // Invalidate course details to show the new lesson in the list
            if (response.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: ['course', response.data.courseId] });
            }
        },
    });
}

export function useLessonMutations() {
    const queryClient = useQueryClient();

    const startMutation = useMutation({
        mutationFn: (lessonId: string) => startLesson(lessonId),
        onSuccess: (_, lessonId) => {
            queryClient.invalidateQueries({ queryKey: LESSON_DETAILS_QUERY_KEY(lessonId) });
            queryClient.invalidateQueries({ queryKey: ['course'] }); // Broad invalidation to refresh lists
        },
    });

    const endMutation = useMutation({
        mutationFn: (lessonId: string) => endLesson(lessonId),
        onSuccess: (_, lessonId) => {
            queryClient.invalidateQueries({ queryKey: LESSON_DETAILS_QUERY_KEY(lessonId) });
            queryClient.invalidateQueries({ queryKey: ['course'] });
        },
    });

    return {
        startLesson: startMutation,
        endLesson: endMutation,
    };
}

/**
 * Get all lessons for a specific course (Teacher)
 */
export function useCourseLessons(courseId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: COURSE_LESSONS_QUERY_KEY(courseId),
        queryFn: () => getCourseLessons(courseId),
        enabled: !!courseId && enabled,
        staleTime: STALE_TIMES.STANDARD,
    });
}

/**
 * Cancel lesson mutation
 */
export function useCancelLesson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (lessonId: string) => cancelLesson(lessonId),
        onSuccess: (_, lessonId) => {
            queryClient.invalidateQueries({ queryKey: LESSON_DETAILS_QUERY_KEY(lessonId) });
            queryClient.invalidateQueries({ queryKey: ['course'] });
        },
    });
}

/**
 * Reschedule lesson mutation
 */
export function useRescheduleLesson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ lessonId, data }: { lessonId: string; data: Parameters<typeof rescheduleLesson>[1] }) => 
            rescheduleLesson(lessonId, data),
        onSuccess: (response: Awaited<ReturnType<typeof rescheduleLesson>>) => {
            if (response.data?.id) {
                queryClient.invalidateQueries({ queryKey: LESSON_DETAILS_QUERY_KEY(response.data.id) });
            }
            if (response.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: COURSE_LESSONS_QUERY_KEY(response.data.courseId) });
            }
            queryClient.invalidateQueries({ queryKey: ['course'] });
        },
    });
}

/**
 * Update lesson mutation
 */
export function useUpdateLesson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ lessonId, data }: { lessonId: string; data: Parameters<typeof updateLesson>[1] }) => 
            updateLesson(lessonId, data),
        onSuccess: (response: Awaited<ReturnType<typeof updateLesson>>) => {
            if (response.data?.id) {
                queryClient.invalidateQueries({ queryKey: LESSON_DETAILS_QUERY_KEY(response.data.id) });
            }
            if (response.data?.courseId) {
                queryClient.invalidateQueries({ queryKey: COURSE_LESSONS_QUERY_KEY(response.data.courseId) });
            }
            queryClient.invalidateQueries({ queryKey: ['course'] });
        },
    });
}

/**
 * Rotate QR token mutation
 */
export function useRotateQRToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (lessonId: string) => rotateQRToken(lessonId),
        onSuccess: (_, lessonId) => {
            queryClient.invalidateQueries({ queryKey: LESSON_QR_QUERY_KEY(lessonId) });
        },
    });
}

/**
 * Scan attendance mutation with location support
 */
export function useScanAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            qrString, 
            options 
        }: { 
            qrString: string; 
            options?: Parameters<typeof scanAttendance>[1] 
        }) => {
            const { scanAttendance } = await import('@/services/CourseService');
            return scanAttendance(qrString, options);
        },
        onSuccess: (response) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['course'] });
        },
    });
}

/**
 * Manual attendance override mutation
 */
export function useManualAttendanceOverride() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ 
            lessonId, 
            data 
        }: { 
            lessonId: string; 
            data: Parameters<typeof manualAttendanceOverride>[1] 
        }) => manualAttendanceOverride(lessonId, data),
        onSuccess: (_, { lessonId }) => {
            queryClient.invalidateQueries({ queryKey: LESSON_ATTENDANCE_QUERY_KEY(lessonId) });
            queryClient.invalidateQueries({ queryKey: ['absences', 'lesson', lessonId] });
        },
    });
}

