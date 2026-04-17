import {
    createCourseReview,
    deleteCourseReview,
    getCourseReviews,
    updateCourseReview,
    CourseReview
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
        mutationFn: (reviewData: { rating: number; review: string }) =>
            createCourseReview(courseId, reviewData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
    });

    const updateReviewMutation = useMutation({
        mutationFn: ({ reviewId, data }: { reviewId: string; data: { rating: number; review: string } }) =>
            updateCourseReview(courseId, reviewId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
    });

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId: string) => deleteCourseReview(courseId, reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
    });

    return {
        reviews: data?.data?.reviews || [],
        summary: data?.data ? {
            averageRating: data.data.averageRating,
            totalReviews: data.data.totalRatings,
            ratingBreakdown: data.data.ratingBreakdown
        } : null,
        pagination: data?.data?.pagination,
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

