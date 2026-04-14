import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CartService, AddToCartRequest, CheckoutRequest } from '@/services/CartService';
import { logger } from '@/libs/logger';

export function useCart() {
    const queryClient = useQueryClient();

    const cartQuery = useQuery({
        queryKey: ['cart'],
        queryFn: () => CartService.getCart(),
    });

    const addToCartMutation = useMutation({
        mutationFn: (data: AddToCartRequest) => CartService.addToCart(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const removeFromCartMutation = useMutation({
        mutationFn: (courseId: string) => CartService.removeFromCart(courseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const checkoutMutation = useMutation({
        mutationFn: (data: CheckoutRequest) => CartService.checkout(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    return {
        cart: cartQuery.data?.data,
        isLoading: cartQuery.isLoading,
        error: cartQuery.error,
        refetch: cartQuery.refetch,
        addToCart: addToCartMutation.mutateAsync,
        isAdding: addToCartMutation.isPending,
        removeFromCart: removeFromCartMutation.mutateAsync,
        isRemoving: removeFromCartMutation.isPending,
        checkout: checkoutMutation.mutateAsync,
        isCheckingOut: checkoutMutation.isPending,
    };
}
