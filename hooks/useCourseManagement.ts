import { createCourse, CreateCourseRequest, updateCourse, UpdateCourseRequest } from '@/services/CourseService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCourseRequest) => createCourse(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });
}

export function useUpdateCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, data }: { courseId: string; data: UpdateCourseRequest }) =>
            updateCourse(courseId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });
}
