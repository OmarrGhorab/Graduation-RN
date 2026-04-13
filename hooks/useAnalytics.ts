import { getStudentAnalytics } from '@/services/CourseService';
import { useQuery } from '@tanstack/react-query';

export function useStudentAnalytics(studentId: string, courseId: string) {
    return useQuery({
        queryKey: ['analytics', 'student', studentId, courseId],
        queryFn: () => getStudentAnalytics(studentId, courseId),
        enabled: !!studentId && !!courseId,
    });
}
