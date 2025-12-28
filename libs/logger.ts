/**
 * Logger utility for development/production environments
 * 
 * In development: All logs pass through to console
 * In production: Only errors are logged, others are silenced
 * 
 * Usage:
 * import { logger } from '@/libs/logger';
 * logger.log('[Auth] Token refreshed');
 * logger.error('[Auth] Failed:', error);
 */

interface Logger {
    log: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
}

const noop = () => {};

const createLogger = (tag?: string): Logger => {
    const prefix = tag ? `[${tag}]` : '';
    
    const formatArgs = (args: any[]): any[] => {
        if (!prefix) return args;
        // If first arg is already a tag like "[Auth]", don't add prefix
        if (typeof args[0] === 'string' && args[0].startsWith('[')) {
            return args;
        }
        return [prefix, ...args];
    };

    if (__DEV__) {
        // Development: all logs enabled
        return {
            log: (...args) => console.log(...formatArgs(args)),
            info: (...args) => console.info(...formatArgs(args)),
            warn: (...args) => console.warn(...formatArgs(args)),
            error: (...args) => console.error(...formatArgs(args)),
            debug: (...args) => console.debug(...formatArgs(args)),
        };
    }

    // Production: only errors
    return {
        log: noop,
        info: noop,
        warn: noop,
        error: (...args) => console.error(...formatArgs(args)),
        debug: noop,
    };
};

// Default logger (no prefix)
export const logger = createLogger();

// Factory for tagged loggers
export const createTaggedLogger = (tag: string): Logger => createLogger(tag);
