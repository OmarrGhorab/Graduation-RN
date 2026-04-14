import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Platform,
    StatusBar,
    Text,
} from 'react-native';
import { Video, ResizeMode, Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
// @ts-ignore
import * as ScreenOrientation from 'expo-screen-orientation';
// @ts-ignore
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider'; // You have this in package.json
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { markLessonCompleted } from '@/services/CourseService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    videoUrl: string;
    lessonId: string;
    onComplete?: () => void;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

export default function LessonVideoPlayer({ videoUrl, lessonId, onComplete }: Props) {
    useKeepAwake('LessonPlayer');
    const videoRef = useRef<Video>(null);
    
    // State
    const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    const controlsOpacity = useSharedValue(1);

    // Auto-hide controls
    const controlsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        controlsOpacity.value = withTiming(1, { duration: 200 });
        if (controlsTimer.current) clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => {
            if (status?.isPlaying) {
                controlsOpacity.value = withTiming(0, { duration: 300 });
                setShowControls(false);
                setShowSpeedMenu(false);
            }
        }, 3500);
    }, [status?.isPlaying]);

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

    const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
        if (!playbackStatus.isLoaded) {
            if (playbackStatus.error) {
                console.error(`Encountered a fatal error during playback: ${playbackStatus.error}`);
            }
            return;
        }

        setStatus(playbackStatus);
        setIsLoading(playbackStatus.isBuffering);

        // Completion logic (90%)
        if (!isCompleted && playbackStatus.durationMillis) {
            const progress = (playbackStatus.positionMillis / playbackStatus.durationMillis) * 100;
            if (progress >= 90) {
                setIsCompleted(true);
                markLessonCompleted(lessonId).then(onComplete).catch(console.error);
            }
        }
    };

    const togglePlay = async () => {
        if (!status) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (status.isPlaying) {
            await videoRef.current?.pauseAsync();
        } else {
            await videoRef.current?.playAsync();
        }
        resetControlsTimer();
    };

    const skipForward = async () => {
        if (!status) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await videoRef.current?.setPositionAsync(Math.min(status.positionMillis + 10000, status.durationMillis || 0));
        resetControlsTimer();
    };

    const skipBackward = async () => {
        if (!status) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await videoRef.current?.setPositionAsync(Math.max(status.positionMillis - 10000, 0));
        resetControlsTimer();
    };

    const changeSpeed = async (speed: number) => {
        setPlaybackSpeed(speed);
        await videoRef.current?.setRateAsync(speed, true);
        setShowSpeedMenu(false);
        resetControlsTimer();
    };

    const formatTime = (millis: number) => {
        const totalSeconds = millis / 1000;
        const seconds = Math.floor(totalSeconds % 60);
        const minutes = Math.floor(totalSeconds / 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                <Video
                    ref={videoRef}
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    resizeMode={ResizeMode.CONTAIN}
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                    rate={playbackSpeed}
                    shouldPlay
                    useNativeControls={false}
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
                            <Ionicons name={status?.isPlaying ? "pause" : "play"} size={48} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={skipForward} style={styles.mainControlBtn}>
                            <Ionicons name="refresh-outline" style={{ transform: [{ scaleX: -1 }] }} size={32} color="#FFF" />
                            <Text style={styles.skipLabel}>10</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Bar */}
                    <View style={styles.bottomBar}>
                        <Text style={styles.timeLabel}>
                            {formatTime(status?.positionMillis || 0)}
                        </Text>
                        
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={status?.durationMillis || 1}
                            value={status?.positionMillis || 0}
                            onSlidingComplete={val => videoRef.current?.setPositionAsync(val)}
                            minimumTrackTintColor="#34D399"
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor="#34D399"
                        />

                        <Text style={styles.timeLabel}>
                            {formatTime(status?.durationMillis || 0)}
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
