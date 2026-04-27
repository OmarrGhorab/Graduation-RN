import { getCourseProgress, getStudentProgress, recomputeProgress } from '@/services/CourseService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useStudentProgress(courseId: string, studentId: string) {
    return useQuery({
        queryKey: ['progress', 'student', courseId, studentId],
        queryFn: () => getStudentProgress(courseId, studentId),
        enabled: !!courseId && !!studentId,
    });
}

export function useCourseProgress(courseId: string) {
    return useQuery({
        queryKey: ['progress', 'course', courseId],
        queryFn: () => getCourseProgress(courseId),
        enabled: !!courseId,
    });
}

export function useRecomputeProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
            recomputeProgress(courseId, studentId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['progress', 'student', variables.courseId, variables.studentId] });
            queryClient.invalidateQueries({ queryKey: ['progress', 'course', variables.courseId] });
        },
    });
}
