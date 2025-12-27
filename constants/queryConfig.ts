/**
 * Centralized React Query configuration
 * Standardizes stale times and cache settings across the app
 */

// Stale times - how long data is considered fresh
export const STALE_TIMES = {
  /** 30 seconds - for frequently changing data (location, notifications) */
  REALTIME: 1000 * 30,
  /** 5 minutes - for standard data (profile, preferences) */
  STANDARD: 1000 * 60 * 5,
  /** 30 minutes - for rarely changing data */
  STATIC: 1000 * 60 * 30,
} as const;

// Garbage collection times - how long inactive data stays in cache
export const GC_TIMES = {
  /** 5 minutes - for realtime data */
  REALTIME: 1000 * 60 * 5,
  /** 30 minutes - for standard data */
  STANDARD: 1000 * 60 * 30,
  /** 1 hour - for static data */
  STATIC: 1000 * 60 * 60,
} as const;

// Default query options for QueryClient
export const defaultQueryOptions = {
  queries: {
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    retry: 2,
  },
} as const;
