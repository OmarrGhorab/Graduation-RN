import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
    useAnimatedStyle, 
    interpolate, 
    Extrapolation,
    SharedValue,
} from 'react-native-reanimated';
import { useAuthStore } from '@/libs/auth';
import { Fonts, grayColors } from '@/constants/theme';

interface HomeHeaderProps {
    onNotificationPress?: () => void;
    onSettingsPress?: () => void;
    notificationCount?: number;
    scrollY?: SharedValue<number>;
}

export default function HomeHeader({ onNotificationPress, onSettingsPress, notificationCount = 0, scrollY }: HomeHeaderProps) {
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    const displayName = user?.name || user?.username || 'User';
    const profileImage = user?.profileImg;

    const headerHeight = insets.top + 12 + 80; // top padding + content height

    const animatedStyle = useAnimatedStyle(() => {
        if (!scrollY) return {};
        
        const translateY = interpolate(
            scrollY.value,
            [0, headerHeight],
            [0, -headerHeight],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [0, headerHeight * 0.5],
            [1, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }],
            opacity,
        };
    });

    return (
        <Animated.View style={[styles.wrapper, { paddingTop: insets.top + 12 }, animatedStyle]}>
            <LinearGradient
                colors={['#0A8F51', '#097D46', '#075F36']}
                locations={[0.3908, 0.6689, 0.9122]}
                style={styles.container}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.content}>
                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.userName}>{displayName}</Text>
                            <Text style={styles.subtitle}>Ready To Learn Something Today?</Text>
                        </View>
                    </View>

                    {/* Actions Section */}
                    <View style={styles.actionsSection}>
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
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={onSettingsPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: 16,
    },
    container: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        shadowColor: grayColors[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatarText: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
    textContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    actionsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
});
