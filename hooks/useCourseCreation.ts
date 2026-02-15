import { createCourse, CreateCourseRequest } from '@/services/CourseService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCourseCreation() {
    const queryClient = useQueryClient();

    const createCourseMutation = useMutation({
        mutationFn: (data: CreateCourseRequest) => createCourse(data),
        onSuccess: () => {
            // Invalidate courses queries to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            queryClient.invalidateQueries({ queryKey: ['myCourses'] });
        },
    });

    return {
        createCourseMutation,
    };
}
