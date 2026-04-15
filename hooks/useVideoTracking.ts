import { videoTrackingService, type DeviceType } from '@/services/VideoTrackingService';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const HEARTBEAT_INTERVAL_MS = 5000; // Reduced to 5s for better responsiveness
const MIN_WATCH_DELTA_SECONDS = 1;

const getDeviceType = (): DeviceType => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return 'MOBILE';
    }

    return 'DESKTOP';
};

interface RecordHeartbeatArgs {
    currentPosition: number;
    duration: number;
    isPlaying: boolean;
    force?: boolean;
    completed?: boolean;
}

interface UseVideoTrackingOptions {
    entityId: string;
    enabled?: boolean;
    mode?: 'lesson' | 'preview';
}

export function useVideoTracking(
    lessonIdOrOptions?: string | UseVideoTrackingOptions,
    legacyEnabled: boolean = true
) {
    const options = !lessonIdOrOptions
        ? { entityId: '', enabled: false, mode: 'lesson' as const }
        : typeof lessonIdOrOptions === 'string'
            ? { entityId: lessonIdOrOptions, enabled: legacyEnabled, mode: 'lesson' as const }
            : {
                entityId: lessonIdOrOptions.entityId,
                enabled: lessonIdOrOptions.enabled ?? true,
                mode: lessonIdOrOptions.mode ?? 'lesson' as const,
            };

    const entityId = options.entityId;
    const enabled = options.enabled;
    const mode = options.mode;
    const [currentProgress, setCurrentProgress] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [initialPosition, setInitialPosition] = useState(0);
    const [hasLoadedInitialProgress, setHasLoadedInitialProgress] = useState(false);

    const lastHeartbeatAtRef = useRef(Date.now());
    const lastTrackedPositionRef = useRef(0);
    const hasRestoredPositionRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        if (!enabled || !entityId) {
            setHasLoadedInitialProgress(true);
            return;
        }

        const loadInitialProgress = async () => {
            try {
                const response = mode === 'preview'
                    ? await videoTrackingService.getPreviewProgress(entityId)
                    : await videoTrackingService.getLessonProgress(entityId);

                if (!isMounted) {
                    return;
                }

                const progressData = response.data;

                if (!progressData) {
                    setInitialPosition(0);
                    setCurrentProgress(0);
                    lastTrackedPositionRef.current = 0;
                    return;
                }

                const savedPosition = Math.max(0, Math.floor(progressData.lastPosition || 0));
                setInitialPosition(savedPosition);
                setCurrentProgress(progressData.progress || 0);
                lastTrackedPositionRef.current = savedPosition;
            } catch (error) {
                console.error('Failed to load lesson progress:', error);
            } finally {
                if (isMounted) {
                    setHasLoadedInitialProgress(true);
                    lastHeartbeatAtRef.current = Date.now();
                }
            }
        };

        loadInitialProgress();

        return () => {
            isMounted = false;
        };
    }, [enabled, entityId, mode]);

    const recordHeartbeat = useCallback(async ({
        currentPosition,
        duration,
        isPlaying,
        force = false,
        completed: explicitCompleted = false,
    }: RecordHeartbeatArgs) => {
        if (!enabled || !entityId || (!isPlaying && !force) || duration <= 0) {
            if (force) {
                console.log('[VideoTracking] Heartbeat skip (pre-checks)', { enabled, entityId, isPlaying, duration });
            }
            return;
        }

        const now = Date.now();
        const elapsedMs = now - lastHeartbeatAtRef.current;

        if (!force && elapsedMs < HEARTBEAT_INTERVAL_MS) {
            // No log here to avoid spamming
            return;
        }

        const safeCurrentPosition = Math.max(0, Math.floor(currentPosition));
        const previousTrackedPosition = lastTrackedPositionRef.current;
        const watchedSeconds = Math.max(0, safeCurrentPosition - previousTrackedPosition);
        const completed = explicitCompleted || (duration > 0 && (safeCurrentPosition / duration) >= 0.9);

        if (watchedSeconds < MIN_WATCH_DELTA_SECONDS && !completed) {
            return;
        }

        try {
            setIsTracking(true);
            
            // Update refs immediately to prevent race conditions from subsequent ticks
            lastHeartbeatAtRef.current = now;
            const positionToTrack = safeCurrentPosition;
            lastTrackedPositionRef.current = positionToTrack;

            console.log('[VideoTracking] Sending heartbeat', {
                entityId,
                mode,
                watchedSeconds,
                lastPosition: positionToTrack,
                completed,
                force,
            });

            const response = mode === 'preview'
                ? await videoTrackingService.recordPreviewHeartbeat({
                    courseId: entityId,
                    watchedSeconds,
                    lastPosition: positionToTrack,
                    completed,
                    deviceType: getDeviceType(),
                })
                : await videoTrackingService.recordHeartbeat({
                    lessonId: entityId,
                    watchedSeconds,
                    lastPosition: positionToTrack,
                    completed,
                    deviceType: getDeviceType(),
                });

            setCurrentProgress(response.data.progress ?? ((positionToTrack / duration) * 100));
            console.log('[VideoTracking] Heartbeat accepted', response.data);
        } catch (error) {
            console.error('Failed to record heartbeat:', error);
        } finally {
            setIsTracking(false);
        }
    }, [enabled, entityId, mode]);

    const markPositionRestored = useCallback(() => {
        hasRestoredPositionRef.current = true;
    }, []);

    const shouldRestorePosition = enabled && hasLoadedInitialProgress && !hasRestoredPositionRef.current && initialPosition > 0;

    return {
        currentProgress,
        hasLoadedInitialProgress,
        initialPosition,
        isTracking,
        heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
        recordHeartbeat,
        shouldRestorePosition,
        markPositionRestored,
    };
}
