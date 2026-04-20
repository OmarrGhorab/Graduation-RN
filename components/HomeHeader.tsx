import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HomeHeaderProps {
    onNotificationPress?: () => void;
    onCalendarPress?: () => void;
    onRefreshPress?: () => void;
    onSearchSubmit?: (query: string) => void;
    onReschedulePress?: () => Promise<void>;
    notificationCount?: number;
    scrollY?: SharedValue<number>;
    isRefreshing?: boolean;
}

export default function HomeHeader({ onNotificationPress, onCalendarPress, onRefreshPress, onReschedulePress, notificationCount = 0, scrollY, isRefreshing }: HomeHeaderProps) {
    const user = useAuthStore((state) => state.user);
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const displayName = user?.name || user?.username || 'Student';
    // Use a high-res placeholder if no image
    const profileImage = user?.profileImg;

    const headerHeight = insets.top + 80;

    const rotation = useSharedValue(0);

    React.useEffect(() => {
        if (isRefreshing) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 1000, easing: Easing.linear }),
                -1,
                false
            );
        } else {
            rotation.value = 0;
        }
    }, [isRefreshing]);

    const refreshIconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const animatedStyle = useAnimatedStyle(() => {
        if (!scrollY) return {};

        const translateY = interpolate(
            scrollY.value,
            [0, 100],
            [0, -20],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }],
        };
    });

    return (
        <Animated.View style={[styles.wrapper, { paddingTop: insets.top }, animatedStyle]}>
            <LinearGradient
                colors={['#0A8F51', '#097D46', '#075F36']}
                locations={[0.1, 0.5, 0.9]}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.contentRow}>
                    {/* Greeting Section (Left) */}
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greetingSub}>{t('home.welcomeBack') || 'Welcome back,'}</Text>
                        <Text numberOfLines={1} style={styles.greetingMain}>
                            {displayName}
                        </Text>
                    </View>


                    {/* Actions Section (Right) */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onCalendarPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onRefreshPress}
                            activeOpacity={0.7}
                            disabled={isRefreshing}
                        >
                            <Animated.View style={refreshIconStyle}>
                                <Ionicons name="sync-outline" size={24} color="#FFFFFF" />
                            </Animated.View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={async () => {
                                // Background fetch as requested
                                if (onReschedulePress) {
                                    onReschedulePress().catch(err => console.error('Reschedule error:', err));
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onNotificationPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                            {notificationCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.9} style={styles.avatarContainer}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View >
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 12,
    },
    contentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingContainer: {
        flex: 1,
        paddingRight: 16,
    },
    greetingSub: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: 'rgba(255, 255, 255, 0.85)',
        marginBottom: 4,
    },
    greetingMain: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#05512F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        minWidth: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF453A', // High contrast red for badge
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        display: 'none', // Small dot style often looks cleaner, or font 0
    },
});
