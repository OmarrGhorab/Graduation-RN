import { apiClient } from './apiClient';
import { logger } from '@/libs/logger';

export interface CartItem {
    id: string;
    courseId: string;
    title: string;
    courseImage?: string;
    teacherName?: string;
    teacherProfileImg?: string;
    priceCents: number;
    currency: string;
    billingType: 'ONE_TIME' | 'MONTHLY';
}

export interface CartResponse {
    success: boolean;
    data: {
        id: string;
        items: CartItem[];
        totalCents: number;
        currency: string;
    };
}

export interface AddToCartRequest {
    courseId: string;
    billingType: 'ONE_TIME' | 'MONTHLY';
}

export interface CheckoutRequest {
    paymentMethod: 'CARD' | 'TOKEN';
    saveCard?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    paymentMethodId?: string; // For saved cards
}

export interface CheckoutResponse {
    success: boolean;
    data: {
        paymentUrl?: string;
        orderId: string;
        status: 'PENDING' | 'SUCCESS' | 'FAILED';
    };
}

export const CartService = {
    /**
     * Get current cart items
     */
    getCart: async (): Promise<CartResponse> => {
        logger.log('[Cart] Fetching cart');
        try {
            return await apiClient.get<CartResponse>('/api/v1/cart', { silent: true });
        } catch (error: any) {
            // If cart doesn't exist (404), return an empty cart instead of crashing
            if (error?.status === 404) {
                logger.log('[Cart] Cart not found, returning empty state');
                return {
                    success: true,
                    data: {
                        items: [],
                        totalPrice: 0,
                        currency: 'EGP'
                    }
                };
            }
            throw error;
        }
    },

    /**
     * Add a course to cart
     */
    addToCart: async (data: AddToCartRequest): Promise<{ success: boolean; message: string }> => {
        logger.log('[Cart] Adding to cart:', data.courseId);
        return apiClient.post<{ success: boolean; message: string }>('/api/v1/cart/add', data);
    },

    /**
     * Remove a course from cart
     */
    removeFromCart: async (courseId: string): Promise<{ success: boolean; message: string }> => {
        logger.log('[Cart] Removing from cart:', courseId);
        return apiClient.post<{ success: boolean; message: string }>('/api/v1/cart/remove', { courseId });
    },

    /**
     * Checkout items in the cart
     */
    checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
        logger.log('[Cart] Checking out cart');
        return apiClient.post<CheckoutResponse>('/api/v1/cart/checkout', data);
    }
};
