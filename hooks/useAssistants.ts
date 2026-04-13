import { addCourseAssistant, getCourseAssistants, removeCourseAssistant } from '@/services/CourseService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCourseAssistants(courseId: string) {
    return useQuery({
        queryKey: ['assistants', courseId],
        queryFn: () => getCourseAssistants(courseId),
        enabled: !!courseId,
    });
}

export function useAddAssistant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, assistantId }: { courseId: string; assistantId: string }) =>
            addCourseAssistant(courseId, { assistantId }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['assistants', variables.courseId] });
            queryClient.invalidateQueries({ queryKey: ['course', variables.courseId, 'details'] });
        },
    });
}

export function useRemoveAssistant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, assistantId }: { courseId: string; assistantId: string }) =>
            removeCourseAssistant(courseId, assistantId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['assistants', variables.courseId] });
            queryClient.invalidateQueries({ queryKey: ['course', variables.courseId, 'details'] });
        },
    });
}
