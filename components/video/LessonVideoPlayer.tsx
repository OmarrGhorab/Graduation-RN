import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    AppState,
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Text,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
// @ts-ignore
import * as ScreenOrientation from 'expo-screen-orientation';
// @ts-ignore
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider'; // You have this in package.json
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { markLessonCompleted } from '@/services/CourseService';
import * as Haptics from 'expo-haptics';
import { useVideoTracking } from '@/hooks/useVideoTracking';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    videoUrl: string;
    lessonId: string;
    onComplete?: () => void;
    trackingEnabled?: boolean;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

export default function LessonVideoPlayer({
    videoUrl,
    lessonId,
    onComplete,
    trackingEnabled = true,
}: Props) {
    useKeepAwake('LessonPlayer');
    
    // State for UI updates
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const hasMarkedCompletionRef = useRef(false);

    const {
        recordHeartbeat,
        shouldRestorePosition,
        initialPosition,
        markPositionRestored,
    } = useVideoTracking(lessonId, trackingEnabled);

    const player = useVideoPlayer(videoUrl, player => {
        player.loop = false;
        player.play();
    });

    useEffect(() => {
        const subscriptions = [
            player.addListener('playingChange', (event) => setIsPlaying(event.isPlaying)),
            player.addListener('timeUpdate', (event) => {
                setCurrentTime(event.currentTime);
                const duration = player.duration;
                // Completion logic (90%)
                if (!isCompleted && duration > 0) {
                    const progress = (event.currentTime / duration) * 100;
                    if (progress >= 90) {
                        setIsCompleted(true);
                        markLessonCompleted(lessonId).then(onComplete).catch(console.error);
                    }
                }
            }),
            player.addListener('statusChange', (event) => {
                if (event.status === 'readyToPlay') {
                    setIsLoading(false);
                    setDuration(player.duration);
                }
            })
        ];
        return () => subscriptions.forEach(s => s.remove());
    }, [player, lessonId, isCompleted, onComplete]);

    useEffect(() => {
        if (!shouldRestorePosition) {
            return;
        }

        player.currentTime = initialPosition;
        setCurrentTime(initialPosition);
        markPositionRestored();
    }, [initialPosition, markPositionRestored, player, shouldRestorePosition]);

    useEffect(() => {
        if (!trackingEnabled || !lessonId) {
            return;
        }

        const interval = setInterval(() => {
            recordHeartbeat({
                currentPosition: player.currentTime,
                duration: player.duration || duration,
                isPlaying: player.playing,
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [duration, lessonId, player, recordHeartbeat, trackingEnabled]);

    useEffect(() => {
        if (!trackingEnabled || !lessonId) {
            return;
        }

        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState !== 'active') {
                recordHeartbeat({
                    currentPosition: player.currentTime,
                    duration: player.duration || duration,
                    isPlaying: player.playing,
                    force: true,
                });
            }
        });

        return () => subscription.remove();
    }, [duration, lessonId, player, recordHeartbeat, trackingEnabled]);

    useEffect(() => {
        return () => {
            if (!trackingEnabled || !lessonId || !player.playing) {
                return;
            }

            recordHeartbeat({
                currentPosition: player.currentTime,
                duration: player.duration || duration,
                isPlaying: player.playing,
                force: true,
            });
        };
    }, [duration, lessonId, player, recordHeartbeat, trackingEnabled]);

    useEffect(() => {
        if (hasMarkedCompletionRef.current || !trackingEnabled || duration <= 0) {
            return;
        }

        if ((currentTime / duration) >= 0.9) {
            hasMarkedCompletionRef.current = true;
            recordHeartbeat({
                currentPosition: currentTime,
                duration,
                isPlaying: true,
                force: true,
            });
        }
    }, [currentTime, duration, recordHeartbeat, trackingEnabled]);

    const controlsOpacity = useSharedValue(1);
    const controlsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        controlsOpacity.value = withTiming(1, { duration: 200 });
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
            if (isPlaying) {
                controlsOpacity.value = withTiming(0, { duration: 300 });
                setShowControls(false);
                setShowSpeedMenu(false);
            }
        }, 3500);
    }, [controlsOpacity, isPlaying]);

    useEffect(() => {
        resetControlsTimer();
        return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
    }, [resetControlsTimer]);

    const handleFullscreen = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isFullscreen) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            setIsFullscreen(false);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setIsFullscreen(true);
        }
    };

    const togglePlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
        resetControlsTimer();
    };

    const skipForward = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        player.currentTime = Math.min(player.currentTime + 10, player.duration);
        resetControlsTimer();
    };

    const skipBackward = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        player.currentTime = Math.max(player.currentTime - 10, 0);
        resetControlsTimer();
    };

    const changeSpeed = (speed: number) => {
        setPlaybackSpeed(speed);
        player.playbackRate = speed;
        setShowSpeedMenu(false);
        resetControlsTimer();
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const animatedControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }));

    return (
        <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
            <TouchableOpacity 
                activeOpacity={1} 
                onPress={resetControlsTimer}
                style={styles.videoWrapper}
            >
                <VideoView
                    player={player}
                    style={styles.video}
                    allowsFullscreen={false} // We have custom controls
                    allowsPictureInPicture={true}
                    startsPictureInPictureAutomatically={true}
                    contentFit="contain"
                />

                {isLoading && (
                    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#FFF" />
                        </View>
                    </View>
                )}

                <Animated.View style={[styles.controlsOverlay, animatedControlsStyle]} pointerEvents={showControls ? 'auto' : 'none'}>
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={handleFullscreen} style={styles.controlBtn}>
                            <Ionicons name={isFullscreen ? "contract" : "expand"} size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity onPress={() => setShowSpeedMenu(!showSpeedMenu)} style={styles.speedBtn}>
                            <Text style={styles.speedText}>{playbackSpeed}x</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Speed Menu */}
                    {showSpeedMenu && (
                        <View style={styles.speedMenu}>
                            {PLAYBACK_SPEEDS.map(speed => (
                                <TouchableOpacity key={speed} onPress={() => changeSpeed(speed)} style={styles.speedMenuItem}>
                                    <Text style={[styles.speedMenuText, playbackSpeed === speed && { color: '#34D399' }]}>{speed}x</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Middle Controls */}
                    <View style={styles.midRow}>
                        <TouchableOpacity onPress={skipBackward} style={styles.mainControlBtn}>
                            <Ionicons name="refresh-outline" size={32} color="#FFF" />
                            <Text style={styles.skipLabel}>10</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
                            <Ionicons name={isPlaying ? "pause" : "play"} size={48} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={skipForward} style={styles.mainControlBtn}>
                            <Ionicons name="refresh-outline" style={{ transform: [{ scaleX: -1 }] }} size={32} color="#FFF" />
                            <Text style={styles.skipLabel}>10</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Bar */}
                    <View style={styles.bottomBar}>
                        <Text style={styles.timeLabel}>
                            {formatTime(currentTime)}
                        </Text>
                        
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={duration > 0 ? duration : 1}
                            value={currentTime}
                            onSlidingComplete={val => player.currentTime = val}
                            minimumTrackTintColor="#34D399"
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor="#34D399"
                        />

                        <Text style={styles.timeLabel}>
                            {formatTime(duration)}
                        </Text>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
    },
    fullscreenContainer: {
        width: SCREEN_HEIGHT, // Because it's landscape
        height: SCREEN_WIDTH,
        borderRadius: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
    },
    videoWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    video: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
        padding: 16,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    midRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    controlBtn: {
        padding: 8,
    },
    playBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainControlBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipLabel: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        position: 'absolute',
    },
    speedBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    speedText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    speedMenu: {
        position: 'absolute',
        top: 60,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 12,
        padding: 8,
        zIndex: 100,
    },
    speedMenuItem: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    speedMenuText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    slider: {
        flex: 1,
        height: 40,
    },
    timeLabel: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
        minWidth: 40,
    },
});
