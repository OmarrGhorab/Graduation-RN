import { BASE_URL } from '@/constants/config';
import {
    ParentSearchResponse,
    ParentLinkRequest,
    ParentLinkResponse,
} from '@/types/auth';
import { getValidAccessToken } from './tokenService';

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
            const error: any = new Error(responseData.message || responseData.error || 'Parent search failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Parent search failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
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
            const error: any = new Error(responseData.message || responseData.error || 'Parent link request failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Parent link request failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}
