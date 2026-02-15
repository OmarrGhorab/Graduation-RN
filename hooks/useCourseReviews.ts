import {
    createCourseReview,
    deleteCourseReview,
    getCourseReviews,
    updateCourseReview
} from '@/services/CourseService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCourseReviews(courseId: string, page: number = 1, limit: number = 20) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['course', courseId, 'reviews', page, limit],
        queryFn: () => getCourseReviews(courseId, page, limit),
        enabled: !!courseId,
    });

    const createReviewMutation = useMutation({
        mutationFn: (reviewData: { rating: number; comment: string }) =>
            createCourseReview(courseId, reviewData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'reviews'] });
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
        },
    });

    const updateReviewMutation = useMutation({
        mutationFn: ({ reviewId, data }: { reviewId: string; data: { rating: number; comment: string } }) =>
            updateCourseReview(courseId, reviewId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'reviews'] });
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
        },
    });

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId: string) => deleteCourseReview(courseId, reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'reviews'] });
            queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
        },
    });

    return {
        reviews: data?.data.reviews || [],
        summary: data?.data.summary,
        pagination: data?.data.pagination,
        isLoading,
        error,
        createReview: createReviewMutation.mutateAsync,
        updateReview: updateReviewMutation.mutateAsync,
        deleteReview: deleteReviewMutation.mutateAsync,
        isCreating: createReviewMutation.isPending,
        isUpdating: updateReviewMutation.isPending,
        isDeleting: deleteReviewMutation.isPending,
    };
}
