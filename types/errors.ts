/**
 * Custom error class for API errors with status code and response data
 */
export class ApiError extends Error {
    public readonly status: number;
    public readonly responseData?: unknown;

    constructor(message: string, status: number, responseData?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.responseData = responseData;
        
        // Maintains proper stack trace for where error was thrown (only in V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

/**
 * Custom error class for network/connection failures
 */
export class NetworkError extends Error {
    public readonly originalError?: Error;

    constructor(message: string, originalError?: Error) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NetworkError);
        }
    }
}

/**
 * Custom error class for authentication failures
 */
export class AuthError extends Error {
    public readonly code: 'NO_TOKEN' | 'EXPIRED' | 'INVALID' | 'REFRESH_FAILED';

    constructor(message: string, code: AuthError['code']) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AuthError);
        }
    }
}

/**
 * Custom error class for request timeout failures
 */
export class TimeoutError extends Error {
    public readonly timeoutMs: number;

    constructor(message: string, timeoutMs: number) {
        super(message);
        this.name = 'TimeoutError';
        this.timeoutMs = timeoutMs;
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TimeoutError);
        }
    }
}

// Type guards
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
}

export function isAuthError(error: unknown): error is AuthError {
    return error instanceof AuthError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
    return error instanceof TimeoutError;
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
}
