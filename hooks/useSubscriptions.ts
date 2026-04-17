import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as CourseService from '../services/CourseService';
import { Alert } from 'react-native';

export function useSubscriptions() {
    const queryClient = useQueryClient();

    const subscriptionsQuery = useQuery({
        queryKey: ['subscriptions'],
        queryFn: CourseService.getSubscriptions,
        select: (response) => response.data || [],
    });

    const cancelMutation = useMutation({
        mutationFn: CourseService.cancelSubscription,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
                Alert.alert('Success', 'Subscription cancelled successfully');
            } else {
                Alert.alert('Error', data.message || 'Failed to cancel subscription');
            }
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Something went wrong');
        }
    });

    return {
        subscriptions: subscriptionsQuery.data,
        isLoading: subscriptionsQuery.isLoading,
        isError: subscriptionsQuery.isError,
        error: subscriptionsQuery.error,
        refetch: subscriptionsQuery.refetch,
        cancelSubscription: cancelMutation.mutate,
        isCancelling: cancelMutation.isPending,
    };
}

export function useSubscriptionDetails(id: string) {
    return useQuery({
        queryKey: ['subscription', id],
        queryFn: () => CourseService.getSubscriptionDetails(id),
        enabled: !!id,
        select: (response) => response.data,
    });
}
