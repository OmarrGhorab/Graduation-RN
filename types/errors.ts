/**
 * Custom error class for API errors with status code and response data
 */
export class ApiError extends Error {
    public readonly status: number;
    public readonly responseData: any;

    constructor(message: string, status: number, responseData?: any) {
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
