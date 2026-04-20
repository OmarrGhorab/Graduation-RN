import { createCourse, CreateCourseRequest, updateCourse, UpdateCourseRequest } from '@/services/CourseService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCourseCreation() {
    const queryClient = useQueryClient();

    const createCourseMutation = useMutation({
        mutationFn: (data: CreateCourseRequest) => createCourse(data),
        onSuccess: () => {
            // Invalidate courses queries to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['myCourses'] });
            queryClient.invalidateQueries({ queryKey: ['teacherCourses'] });
        },
    });

    const updateCourseMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCourseRequest }) => updateCourse(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['myCourses'] });
            queryClient.invalidateQueries({ queryKey: ['teacherCourses'] });
            queryClient.invalidateQueries({ queryKey: ['course', variables.id] });
        },
    });

    return {
        createCourseMutation,
        updateCourseMutation,
    };
}
