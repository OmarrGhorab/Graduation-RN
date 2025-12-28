import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';
import { DeviceService } from './DeviceService';
import { ApiError, NetworkError, AuthError, TimeoutError } from '@/types/errors';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 30000;

/** In-flight request tracking */
const inFlightRequests = new Map<string, Promise<unknown>>();

interface RequestOptions {
    /** Skip automatic token injection (for public endpoints) */
    skipAuth?: boolean;
    /** Skip device headers injection */
    skipDeviceHeaders?: boolean;
    /** Additional headers to include */
    headers?: Record<string, string>;
    /** Request body (will be JSON stringified) */
    body?: unknown;
    /** Query parameters */
    params?: Record<string, string | number | boolean | undefined>;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Skip request deduplication */
    skipDeduplication?: boolean;
}

/**
 * Generate a hash key for request deduplication
 */
function generateRequestKey(method: HttpMethod, url: string, body?: unknown): string {
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyStr}`;
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    const url = `${BASE_URL}${endpoint}`;
    
    if (!params) return url;
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            queryParams.append(key, String(value));
        }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
}

/**
 * Core request function that handles all HTTP methods
 */
async function request<T = unknown>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { 
        skipAuth = false, 
        skipDeviceHeaders = false, 
        headers = {}, 
        body, 
        params,
        timeout = DEFAULT_TIMEOUT_MS,
        skipDeduplication = false,
    } = options;

    const url = buildUrl(endpoint, params);
    const requestKey = generateRequestKey(method, url, body);

    // Check for in-flight duplicate request
    if (!skipDeduplication) {
        const existingRequest = inFlightRequests.get(requestKey);
        if (existingRequest) {
            return existingRequest as Promise<T>;
        }
    }

    const executeRequest = async (): Promise<T> => {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeout);

        try {
            // Build headers
            const requestHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                ...headers,
            };

            // Inject auth token if not skipped
            if (!skipAuth) {
                const token = await getValidAccessToken();
                if (!token) {
                    throw new AuthError('No authentication token found', 'NO_TOKEN');
                }
                requestHeaders['Authorization'] = `Bearer ${token}`;
            }

            // Inject device headers if not skipped
            if (!skipDeviceHeaders) {
                const deviceHeaders = await DeviceService.getDeviceHeaders();
                Object.assign(requestHeaders, deviceHeaders);
            }

            // Build request config
            const config: RequestInit = {
                method,
                headers: requestHeaders,
                signal: abortController.signal,
            };

            // Add body for non-GET requests
            if (body && method !== 'GET') {
                config.body = JSON.stringify(body);
            }

            // Make request
            const response = await fetch(url, config);

            // Check content type for JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new ApiError(
                        `Server error (${response.status}): Invalid response format`,
                        response.status
                    );
                }
                // For successful non-JSON responses, return empty object
                return {} as T;
            }

            // Parse response
            const data: unknown = await response.json();

            // Handle error responses
            if (!response.ok) {
                const responseObj = data as Record<string, unknown>;
                const message = (responseObj.message || responseObj.error || `Request failed with status ${response.status}`) as string;
                throw new ApiError(message, response.status, data);
            }

            return data as T;
        } catch (error: unknown) {
            // Handle abort/timeout errors
            if (error instanceof Error && error.name === 'AbortError') {
                throw new TimeoutError(`Request timed out after ${timeout}ms`, timeout);
            }

            // Re-throw our custom errors
            if (error instanceof ApiError || error instanceof NetworkError || error instanceof AuthError || error instanceof TimeoutError) {
                throw error;
            }

            // Handle network errors
            if (error instanceof Error) {
                if (error.message === 'Network request failed') {
                    throw new NetworkError(
                        `Cannot connect to server at ${BASE_URL}. Please check your connection.`,
                        error
                    );
                }

                // Handle other fetch errors as network errors
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    throw new NetworkError('Network request failed', error);
                }
            }

            // Re-throw unknown errors
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // Create and track the request promise
    const requestPromise = executeRequest().finally(() => {
        // Clean up completed request from tracking Map
        inFlightRequests.delete(requestKey);
    });

    // Store in tracking Map for deduplication
    if (!skipDeduplication) {
        inFlightRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
}

/**
 * Centralized API client with automatic token and device header injection
 */
export const apiClient = {
    /**
     * GET request
     */
    get: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('GET', endpoint, options),

    /**
     * POST request
     */
    post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('POST', endpoint, { ...options, body }),

    /**
     * PUT request
     */
    put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('PUT', endpoint, { ...options, body }),

    /**
     * PATCH request
     */
    patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('PATCH', endpoint, { ...options, body }),

    /**
     * DELETE request
     */
    delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
        request<T>('DELETE', endpoint, options),
};
