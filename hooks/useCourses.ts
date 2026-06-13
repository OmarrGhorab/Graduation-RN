import { STALE_TIMES } from '@/constants/queryConfig';
import {
    createAbsenceRequest,
    createCourse,
    enrollInCourse,
    getAllCourses,
    getCourseAutocomplete,
    getRecommendedCourses,
    getAllSubjects,
    getCourse,
    getCourseDetails,
    getTrendingCourses,
    getLessonAbsenceRequests,
    getMyCourses,
    getTeacherCourses,
    getMySubjects,
    getPendingParentAbsenceRequests,
    getStudentAbsenceRequests,
    getStudentAnalytics,
    getSubjectDetails,
    respondToAbsenceRequest,
    updateCourse,
    getCourseReviews,
    createCourseReview,
    updateCourseReview,
    deleteCourseReview,
    recordCourseSearchFeedback
} from '@/services/CourseService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const ALL_COURSES_QUERY_KEY = (params?: any) => ['courses', 'all', params];
export const COURSES_QUERY_KEY = ['courses', 'my'];
export const SUBJECTS_QUERY_KEY = ['courses', 'subjects'];
export const COURSE_DETAILS_QUERY_KEY = (id: string, studentId?: string) => ['course', id, 'details', studentId];
export const COURSE_QUERY_KEY = (id: string) => ['course', id];
export const SUBJECT_DETAILS_QUERY_KEY = (id: string) => ['subject', id, 'details'];
export const STUDENT_ANALYTICS_QUERY_KEY = (studentId: string, courseId: string) => ['analytics', 'student', studentId, 'course', courseId];
export const ABNSENCE_STUDENT_QUERY_KEY = (studentId: string) => ['absences', 'student', studentId];
export const ABNSENCE_LESSON_QUERY_KEY = (lessonId: string) => ['absences', 'lesson', lessonId];
export const ABSENCES_PENDING_PARENT_QUERY_KEY = ['absences', 'pending-parent'];
export const TRENDING_COURSES_QUERY_KEY = ['courses', 'trending'];
export const RECOMMENDED_COURSES_QUERY_KEY = ['courses', 'recommended'];
export const REVIEWS_QUERY_KEY = (courseId: string, page?: number) => ['reviews', courseId, { page }];
export const COURSE_AUTOCOMPLETE_QUERY_KEY = (search: string, limit: number) => ['courses', 'autocomplete', search, limit];

export function useMyCourses() {
    return useQuery({
        queryKey: COURSES_QUERY_KEY,
        queryFn: getMyCourses,
        staleTime: STALE_TIMES.STANDARD,
    });
}

export function useTeacherCourses() {
    return useQuery({
        queryKey: ['courses', 'teacher'],
        queryFn: getTeacherCourses,
        staleTime: 0,
    });
}

export function useAllCourses(params?: {
    teacherId?: string;
    subjectId?: string;
    teacherName?: string;
    subjectName?: string;
    search?: string;
    deliveryType?: 'OFFLINE' | 'ONLINE';
    isPaid?: boolean;
    status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    billingType?: 'ONE_TIME' | 'MONTHLY';
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: ALL_COURSES_QUERY_KEY(params),
        queryFn: () => getAllCourses(params),
        staleTime: STALE_TIMES.STANDARD,
    });
}

export function useCourseAutocomplete(search: string, limit: number = 8) {
    const normalized = search.trim();
    return useQuery({
        queryKey: COURSE_AUTOCOMPLETE_QUERY_KEY(normalized, limit),
        queryFn: () => getCourseAutocomplete(normalized, limit),
        enabled: normalized.length >= 2,
        staleTime: 1000 * 60,
        retry: false,
    });
}

export function useTrendingCourses() {
    return useQuery({
        queryKey: TRENDING_COURSES_QUERY_KEY,
        queryFn: () => getTrendingCourses(),
        staleTime: STALE_TIMES.STANDARD,
        retry: false,
    });
}

export function useRecommendedCourses() {
    return useQuery({
        queryKey: RECOMMENDED_COURSES_QUERY_KEY,
        queryFn: () => getRecommendedCourses(),
        staleTime: STALE_TIMES.STANDARD,
        retry: false,
    });
}

export function useMySubjects() {
    return useQuery({
        queryKey: SUBJECTS_QUERY_KEY,
        queryFn: getMySubjects,
        staleTime: STALE_TIMES.STATIC, // Subjects don't change often
    });
}

export function useCourseDetails(courseId: string, studentId?: string) {
    return useQuery({
        queryKey: COURSE_DETAILS_QUERY_KEY(courseId, studentId),
        queryFn: () => getCourseDetails(courseId, studentId),
        enabled: !!courseId,
        staleTime: STALE_TIMES.STANDARD,
    });
}

export function useSubjectDetails(subjectId: string) {
    return useQuery({
        queryKey: SUBJECT_DETAILS_QUERY_KEY(subjectId),
        queryFn: () => getSubjectDetails(subjectId),
        enabled: !!subjectId,
        staleTime: STALE_TIMES.STANDARD,
    });
}

/**
 * Get single course (Teacher/Student)
 */
export function useCourse(courseId: string) {
    return useQuery({
        queryKey: COURSE_QUERY_KEY(courseId),
        queryFn: () => getCourse(courseId),
        enabled: !!courseId,
        staleTime: STALE_TIMES.STANDARD,
    });
}

/**
 * Create course mutation (Teacher)
 */
export function useCreateCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });
}

/**
 * Update course mutation (Teacher)
 */
export function useUpdateCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, data }: { courseId: string; data: Parameters<typeof updateCourse>[1] }) =>
            updateCourse(courseId, data),
        onSuccess: (response) => {
            if (response.data?.id) {
                queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEY(response.data.id) });
                queryClient.invalidateQueries({ queryKey: COURSE_DETAILS_QUERY_KEY(response.data.id) });
            }
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });
}


/**
 * Enroll in course mutation (Student)
 */
export function useEnrollCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
            enrollInCourse(courseId, { studentId }),
        onSuccess: (_, { courseId }) => {
            queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: COURSE_DETAILS_QUERY_KEY(courseId) });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
        },
    });
}

/**
 * Get all subjects
 */
export const ALL_SUBJECTS_QUERY_KEY = ['subjects', 'all'];

export function useAllSubjects() {
    return useQuery({
        queryKey: ALL_SUBJECTS_QUERY_KEY,
        queryFn: getAllSubjects,
        staleTime: STALE_TIMES.STATIC,
    });
}

export function useStudentAnalytics(studentId: string, courseId: string) {
    return useQuery({
        queryKey: STUDENT_ANALYTICS_QUERY_KEY(studentId, courseId),
        queryFn: () => getStudentAnalytics(studentId, courseId),
        enabled: !!studentId && !!courseId,
        staleTime: STALE_TIMES.STANDARD,
    });
}

export function useStudentAbsences(studentId: string) {
    return useQuery({
        queryKey: ABNSENCE_STUDENT_QUERY_KEY(studentId),
        queryFn: () => getStudentAbsenceRequests(studentId),
        enabled: !!studentId,
        staleTime: STALE_TIMES.REALTIME,
    });
}

export function useLessonAbsences(lessonId: string) {
    return useQuery({
        queryKey: ABNSENCE_LESSON_QUERY_KEY(lessonId),
        queryFn: () => getLessonAbsenceRequests(lessonId),
        enabled: !!lessonId,
        staleTime: STALE_TIMES.REALTIME,
    });
}

export function usePendingParentAbsences() {
    return useQuery({
        queryKey: ABSENCES_PENDING_PARENT_QUERY_KEY,
        queryFn: getPendingParentAbsenceRequests,
        staleTime: STALE_TIMES.REALTIME,
    });
}

export function useAbsenceMutations() {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: createAbsenceRequest,
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['absences'] });
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['course'] });
        },
    });

    const respondMutation = useMutation({
        mutationFn: ({ requestId, data }: { requestId: string; data: { approve: boolean; responseNote?: string } }) =>
            respondToAbsenceRequest(requestId, data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['absences'] });
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['course'] });
        },
    });

    return {
        createAbsence: createMutation,
        respondToAbsence: respondMutation,
    };
}

export function useCourseReviews(courseId: string, page: number = 1, limit: number = 20) {
    return useQuery({
        queryKey: REVIEWS_QUERY_KEY(courseId, page),
        queryFn: () => getCourseReviews(courseId, page, limit),
        enabled: !!courseId,
        staleTime: STALE_TIMES.STANDARD,
    });
}

export function useCreateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, data }: { courseId: string; data: Parameters<typeof createCourseReview>[1] }) =>
            createCourseReview(courseId, data),
        onSuccess: (_, { courseId }) => {
            queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY(courseId) });
            queryClient.invalidateQueries({ queryKey: COURSE_DETAILS_QUERY_KEY(courseId) });
        },
    });
}

export function useUpdateReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, reviewId, data }: { courseId: string; reviewId: string; data: Parameters<typeof updateCourseReview>[2] }) =>
            updateCourseReview(courseId, reviewId, data),
        onSuccess: (_, { courseId }) => {
            queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY(courseId) });
            queryClient.invalidateQueries({ queryKey: COURSE_DETAILS_QUERY_KEY(courseId) });
        },
    });
}

export function useDeleteReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, reviewId }: { courseId: string; reviewId: string }) =>
            deleteCourseReview(courseId, reviewId),
        onSuccess: (_, { courseId }) => {
            queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY(courseId) });
            queryClient.invalidateQueries({ queryKey: COURSE_DETAILS_QUERY_KEY(courseId) });
        },
    });
}

export function useCourseSearchFeedback() {
    return useMutation({
        mutationFn: recordCourseSearchFeedback,
        retry: false,
    });
}
