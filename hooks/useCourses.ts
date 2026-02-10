import { STALE_TIMES } from '@/constants/queryConfig';
import { getCourseDetails, getMyCourses, getMySubjects, getSubjectDetails } from '@/services/CourseService';
import { useQuery } from '@tanstack/react-query';

export const COURSES_QUERY_KEY = ['courses', 'my'];
export const SUBJECTS_QUERY_KEY = ['courses', 'subjects'];
export const COURSE_DETAILS_QUERY_KEY = (id: string, studentId?: string) => ['course', id, 'details', studentId];
export const SUBJECT_DETAILS_QUERY_KEY = (id: string) => ['subject', id, 'details'];

export function useMyCourses() {
    return useQuery({
        queryKey: COURSES_QUERY_KEY,
        queryFn: getMyCourses,
        staleTime: STALE_TIMES.STANDARD,
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
