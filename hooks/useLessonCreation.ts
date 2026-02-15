import { createLesson, CreateLessonRequest } from '@/services/CourseService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useLessonCreation() {
    const queryClient = useQueryClient();

    const createLessonMutation = useMutation({
        mutationFn: (data: CreateLessonRequest) => createLesson(data),
        onSuccess: () => {
            // Invalidate lessons and calendar queries to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['lessons'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['courseLessons'] });
        },
    });

    return {
        createLessonMutation,
    };
}
