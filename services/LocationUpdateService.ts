import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/libs/auth';
import { User } from '@/types/auth';
import { LocationService } from './LocationService';
import { DeviceService } from './DeviceService';
import { logger } from '@/libs/logger';

// Location update interval (5 minutes)
const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000;

// Roles that should have location updates enabled
const LOCATION_TRACKING_ROLES = ['child', 'student'];

/**
 * Singleton service to manage periodic location updates.
 * Ensures only ONE interval runs at a time and properly cleans up.
 * 
 * Features:
 * - Singleton pattern prevents duplicate intervals
 * - Role-based filtering (only tracks location for specific user roles)
 * - App state awareness (pauses in background to save battery)
 * - Automatic cleanup on stop
 */
class LocationUpdateServiceClass {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
    private isRunning = false;
    private currentAppState: AppStateStatus = AppState.currentState;

    /**
     * Start periodic location updates.
     * Safe to call multiple times - will not create duplicate intervals.
     * Only starts if user role requires location tracking.
     */
    start(): void {
        // Prevent duplicate starts
        if (this.isRunning) {
            logger.log('[LocationUpdateService] Already running, skipping start');
            return;
        }

        // Check if user role requires location tracking
        if (!this.shouldTrackLocation()) {
            logger.log('[LocationUpdateService] User role does not require location tracking');
            return;
        }

        logger.log('[LocationUpdateService] Starting location updates');
        this.isRunning = true;

        // Do an immediate update on start
        this.updateNow();

        // Start the periodic interval
        this.startInterval();

        // Listen for app state changes to pause/resume updates
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }

    /**
     * Stop all location updates and clean up resources.
     * Safe to call multiple times.
     */
    stop(): void {
        if (!this.isRunning) {
            logger.log('[LocationUpdateService] Not running, skipping stop');
            return;
        }

        logger.log('[LocationUpdateService] Stopping location updates');
        this.isRunning = false;
        this.clearInterval();

        // Remove app state listener
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
    }

    /**
     * Check if the service is currently running.
     */
    isActive(): boolean {
        return this.isRunning;
    }

    /**
     * Force an immediate location update.
     * Useful when app comes to foreground or user requests refresh.
     */
    async updateNow(): Promise<void> {
        const { accessToken, user } = useAuthStore.getState();
        
        if (!accessToken) {
            logger.log('[LocationUpdateService] No auth token, skipping update');
            return;
        }

        // Double-check role in case it changed
        if (!this.shouldTrackLocationForUser(user)) {
            logger.log('[LocationUpdateService] User role changed, stopping service');
            this.stop();
            return;
        }

        try {
            // Get fresh location with high accuracy
            await DeviceService.getPreciseLocation({ accuracy: 'highest', forceRefresh: true });
            await LocationService.updateLocation();
            logger.log('[LocationUpdateService] Immediate update sent');
        } catch (error) {
            logger.log('[LocationUpdateService] Immediate update failed:', error);
        }
    }

    /**
     * Check if current user's role requires location tracking.
     */
    private shouldTrackLocation(): boolean {
        const { user } = useAuthStore.getState();
        return this.shouldTrackLocationForUser(user);
    }

    /**
     * Check if a specific user's role requires location tracking.
     */
    private shouldTrackLocationForUser(user: User | null): boolean {
        if (!user?.role) {
            // If no role, default to tracking (safer for child safety apps)
            return true;
        }
        return LOCATION_TRACKING_ROLES.includes(user.role.toLowerCase());
    }

    /**
     * Start the periodic update interval.
     * Clears any existing interval first to prevent duplicates.
     */
    private startInterval(): void {
        // Always clear first to prevent duplicates
        this.clearInterval();

        this.intervalId = setInterval(async () => {
            const { accessToken, user } = useAuthStore.getState();
            
            if (!accessToken) {
                logger.log('[LocationUpdateService] Lost auth token, stopping');
                this.stop();
                return;
            }

            // Check role hasn't changed
            if (!this.shouldTrackLocationForUser(user)) {
                logger.log('[LocationUpdateService] User role no longer requires tracking');
                this.stop();
                return;
            }

            try {
                await LocationService.updateLocation();
                logger.log('[LocationUpdateService] Periodic update sent');
            } catch (error) {
                // Silent fail - location updates are best-effort
                logger.log('[LocationUpdateService] Periodic update failed:', error);
            }
        }, LOCATION_UPDATE_INTERVAL);

        logger.log('[LocationUpdateService] Interval started');
    }

    /**
     * Clear the update interval if it exists.
     */
    private clearInterval(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.log('[LocationUpdateService] Interval cleared');
        }
    }

    /**
     * Handle app state changes (foreground/background).
     * Pauses updates in background to save battery.
     */
    private handleAppStateChange = (nextAppState: AppStateStatus): void => {
        if (!this.isRunning) return;

        const wasBackground = this.currentAppState.match(/inactive|background/);
        const isNowActive = nextAppState === 'active';
        const isNowBackground = nextAppState.match(/inactive|background/);

        if (wasBackground && isNowActive) {
            // App came to foreground - refresh location and restart interval
            logger.log('[LocationUpdateService] App foregrounded, refreshing location');
            this.updateNow();
            this.startInterval();
        } else if (isNowBackground) {
            // App went to background - stop interval to save battery
            // Note: For true background tracking, use expo-task-manager
            logger.log('[LocationUpdateService] App backgrounded, pausing updates');
            this.clearInterval();
        }

        this.currentAppState = nextAppState;
    };
}

// Export singleton instance
export const LocationUpdateService = new LocationUpdateServiceClass();
