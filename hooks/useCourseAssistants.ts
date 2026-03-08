import { addCourseAssistant, getCourseAssistants, removeCourseAssistant } from '@/services/CourseService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCourseAssistants(courseId: string) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['course', courseId, 'assistants'],
        queryFn: () => getCourseAssistants(courseId),
        enabled: !!courseId,
    });

    const addAssistantMutation = useMutation({
        mutationFn: (assistantId: string) => addCourseAssistant(courseId, { assistantId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'assistants'] });
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
        },
    });

    const removeAssistantMutation = useMutation({
        mutationFn: (assistantId: string) => removeCourseAssistant(courseId, assistantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'assistants'] });
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
        },
    });

    return {
        assistants: data?.data || [],
        isLoading,
        error,
        addAssistant: addAssistantMutation.mutateAsync,
        removeAssistant: removeAssistantMutation.mutateAsync,
        isAddingAssistant: addAssistantMutation.isPending,
        isRemovingAssistant: removeAssistantMutation.isPending,
    };
}
