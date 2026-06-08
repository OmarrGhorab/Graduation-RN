import { apiClient } from './apiClient';
import { logger } from '@/libs/logger';

export interface PaymentMethod {
    ID: string;
    UserID: string;
    PaymentType: string;
    Token: string;
    LastFour: string;
    CardBrand: string;
    ExpiryMonth: string;
    ExpiryYear: string;
    IsDefault: boolean;
    IsActive: boolean;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface PaymentHistoryItem {
    orderId: string;
    amountCents: number;
    currency: string;
    status: 'PAID' | 'FAILED' | 'PENDING';
    orderType: string;
    createdAt: string;
    items: Array<{
        courseId: string;
        title: string;
        courseImage?: string;
        teacherName?: string | null;
        teacherProfileImg?: string | null;
        subjectName?: string | null;
        priceCents: number;
    }>;
}

export interface DirectEnrollRequest {
    courseId: string;
    paymentMethod: 'CARD' | 'TOKEN' | 'WALLET';
    saveCard?: boolean;
    paymentMethodId?: string;
    idempotencyKey?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
}

export interface PaymentResponse {
    success: boolean;
    data: {
        paymentUrl?: string;
        orderId: string;
        status: 'PENDING' | 'SUCCESS' | 'FAILED';
    };
}

export const PaymentService = {
    /**
     * Buy a single course immediately
     */
    directEnroll: async (data: DirectEnrollRequest): Promise<PaymentResponse> => {
        logger.log('[Payment] Direct enrollment for course:', data.courseId);
        const headers: Record<string, string> = {};
        if (data.idempotencyKey) {
            headers['Idempotency-Key'] = data.idempotencyKey;
        }
        return apiClient.post<PaymentResponse>('/api/v1/payments/create', data, { headers });
    },

    /**
     * List tokenized cards for "One-Click" checkout
     */
    getSavedMethods: async (): Promise<{ success: boolean; data: PaymentMethod[] }> => {
        logger.log('[Payment] Fetching saved payment methods');
        return apiClient.get<{ success: boolean; data: PaymentMethod[] }>('/api/v1/payments/methods');
    },

    /**
     * Delete a saved payment method
     */
    deletePaymentMethod: async (id: string): Promise<{ success: boolean; message: string }> => {
        logger.log('[Payment] Deleting payment method:', id);
        return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/payments/methods/${id}`);
    },

    /**
     * View list of past successful payments
     */
    getPaymentHistory: async (): Promise<{ success: boolean; data: PaymentHistoryItem[] }> => {
        logger.log('[Payment] Fetching payment history');
        return apiClient.get<{ success: boolean; data: PaymentHistoryItem[] }>('/api/v1/payments/history');
    }
};
