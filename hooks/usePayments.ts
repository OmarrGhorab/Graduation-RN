import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PaymentService, DirectEnrollRequest } from '@/services/PaymentService';

export function usePayments() {
    const queryClient = useQueryClient();

    const savedMethodsQuery = useQuery({
        queryKey: ['payment-methods'],
        queryFn: () => PaymentService.getSavedMethods(),
    });

    const paymentHistoryQuery = useQuery({
        queryKey: ['payment-history'],
        queryFn: () => PaymentService.getPaymentHistory(),
    });

    const directEnrollMutation = useMutation({
        mutationFn: (data: DirectEnrollRequest) => PaymentService.directEnroll(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-history'] });
            queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
        },
    });

    return {
        savedMethods: savedMethodsQuery.data?.data || [],
        isLoadingMethods: savedMethodsQuery.isLoading,
        paymentHistory: paymentHistoryQuery.data?.data || [],
        isLoadingHistory: paymentHistoryQuery.isLoading,
        directEnroll: directEnrollMutation.mutateAsync,
        isEnrolling: directEnrollMutation.isPending,
        deleteMethod: useMutation({
            mutationFn: (id: string) => PaymentService.deletePaymentMethod(id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
            },
        }).mutateAsync,
        refetchMethods: savedMethodsQuery.refetch,
        refetchHistory: paymentHistoryQuery.refetch,
    };
}
