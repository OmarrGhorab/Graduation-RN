import { getStudentAnalytics, getLessonAnalytics } from '@/services/CourseService';
import { useQuery } from '@tanstack/react-query';

export function useStudentAnalytics(studentId: string, courseId: string) {
    return useQuery({
        queryKey: ['analytics', 'student', studentId, courseId],
        queryFn: () => getStudentAnalytics(studentId, courseId),
        enabled: !!studentId && !!courseId,
    });
}

export function useLessonAnalytics(lessonId: string) {
    return useQuery({
        queryKey: ['analytics', 'lesson', lessonId],
        queryFn: () => getLessonAnalytics(lessonId),
        enabled: !!lessonId,
    });
}
