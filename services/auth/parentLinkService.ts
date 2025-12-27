import { BASE_URL } from '@/constants/config';
import {
    ParentSearchResponse,
    ParentLinkRequest,
    ParentLinkResponse,
} from '@/types/auth';
import { getValidAccessToken } from './tokenService';
import { ApiError, NetworkError } from '@/types/errors';

/**
 * Search for parents to link
 * @param query - Search query string
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 10)
 */
export async function searchParents(query: string, page: number = 1, limit: number = 10): Promise<ParentSearchResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const url = `${BASE_URL}/api/v1/parent-link/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        console.log('[Auth] Searching parents with URL:', url);

        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new ApiError(
                responseData.message || responseData.error || 'Parent search failed',
                response.status,
                responseData
            );
        }

        return responseData;
    } catch (error) {
        console.error('[Auth] Parent search failed:', error);

        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof Error && error.message === 'Network request failed') {
            throw new NetworkError(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Request parent link
 * @param data - Parent link request data
 */
export async function requestParentLink(data: ParentLinkRequest): Promise<ParentLinkResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Auth] Requesting parent link with URL:', `${BASE_URL}/api/v1/parent-link/request`);

        const response = await fetch(
            `${BASE_URL}/api/v1/parent-link/request`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            }
        );

        const responseData = await response.json();
        console.log('[Auth] Parent link response:', responseData);

        if (!response.ok) {
            throw new ApiError(
                responseData.message || responseData.error || 'Parent link request failed',
                response.status,
                responseData
            );
        }

        return responseData;
    } catch (error) {
        console.error('[Auth] Parent link request failed:', error);

        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof Error && error.message === 'Network request failed') {
            throw new NetworkError(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}
