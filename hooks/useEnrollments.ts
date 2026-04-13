import { getCourseEnrollments } from '@/services/CourseService';
import { useQuery } from '@tanstack/react-query';

export function useCourseEnrollments(courseId: string) {
    return useQuery({
        queryKey: ['enrollments', courseId],
        queryFn: () => getCourseEnrollments(courseId),
        enabled: !!courseId,
    });
}
