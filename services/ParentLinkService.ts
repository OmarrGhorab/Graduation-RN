import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';

// Types
export interface ParentUser {
    id: string;
    username: string;
    name: string;
    email?: string;
    profileImg: string | null;
}

export interface ChildUser {
    id: string;
    username: string;
    name: string;
    profileImg: string | null;
}

export interface SearchParentsResponse {
    data: ParentUser[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export interface LinkRequest {
    id: string;
    parent?: ParentUser;
    child?: ChildUser;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    createdAt: string;
    respondedAt?: string;
}

export interface LinkedAccount {
    id: string;
    parent?: ParentUser;
    child?: ChildUser;
    linkedAt: string;
}

export interface SendLinkRequestResponse {
    message: string;
    request: LinkRequest;
}

export interface RespondRequestResponse {
    message: string;
    request: LinkRequest;
}

// Helper to check response and parse JSON
async function parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error (${response.status})`);
    }
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }
    return data;
}

/**
 * Search for parents to link
 */
export async function searchParents(query: string, page = 1, limit = 10): Promise<SearchParentsResponse> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(
        `${BASE_URL}/api/v1/parent-link/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    return parseResponse<SearchParentsResponse>(response);
}


/**
 * Send a parent link request
 */
export async function sendLinkRequest(parentId: string): Promise<SendLinkRequestResponse> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/parent-link/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ parentId }),
    });

    return parseResponse<SendLinkRequestResponse>(response);
}

/**
 * Get link requests (sent or received based on role)
 * Parents see incoming requests from children
 * Children see their outgoing requests to parents
 */
export async function getLinkRequests(): Promise<{ data: LinkRequest[] }> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/parent-link/requests`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const result = await parseResponse<{ data: LinkRequest[] }>(response);
    console.log('[ParentLinkService] getLinkRequests response:', JSON.stringify(result, null, 2));
    return result;
}

/**
 * Respond to a link request (parent only)
 */
export async function respondToLinkRequest(requestId: string, action: 'accept' | 'decline'): Promise<RespondRequestResponse> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/parent-link/respond`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
    });

    return parseResponse<RespondRequestResponse>(response);
}

/**
 * Get linked accounts
 */
export async function getLinkedAccounts(): Promise<{ data: LinkedAccount[] }> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/parent-link/linked`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    return parseResponse<{ data: LinkedAccount[] }>(response);
}

/**
 * Send unlink request (child only)
 */
export async function sendUnlinkRequest(parentId: string): Promise<SendLinkRequestResponse> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/parent-link/unlink/request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ parentId }),
    });

    return parseResponse<SendLinkRequestResponse>(response);
}

/**
 * Get pending unlink requests
 */
export async function getUnlinkRequests(): Promise<{ data: LinkRequest[] }> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/parent-link/unlink/requests`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    return parseResponse<{ data: LinkRequest[] }>(response);
}

/**
 * Respond to unlink request (parent only)
 */
export async function respondToUnlinkRequest(requestId: string, action: 'accept' | 'decline'): Promise<RespondRequestResponse> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/parent-link/unlink/respond`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
    });

    return parseResponse<RespondRequestResponse>(response);
}
