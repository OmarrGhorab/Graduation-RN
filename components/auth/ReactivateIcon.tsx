import React from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

type Theme = typeof Colors.light | typeof Colors.dark;

interface ReactivateIconProps {
    theme: Theme;
    isDark?: boolean;
    fadeAnim: Animated.Value;
    scaleAnim: Animated.Value;
    rotation: Animated.AnimatedInterpolation<string>;
}

export const ReactivateIcon: React.FC<ReactivateIconProps> = ({
    theme,
    isDark = false,
    fadeAnim,
    scaleAnim,
    rotation,
}) => (
    <Animated.View
        style={[
            styles.iconSection,
            {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { rotate: rotation }],
            },
        ]}
    >
        <View style={[
            styles.iconOuterRing,
            { backgroundColor: isDark ? 'rgba(79, 191, 138, 0.15)' : 'rgba(255,255,255,0.12)' }
        ]}>
            <View style={[
                styles.iconMiddleRing,
                { backgroundColor: isDark ? 'rgba(79, 191, 138, 0.25)' : 'rgba(255,255,255,0.18)' }
            ]}>
                <View style={[
                    styles.iconInnerCircle,
                    { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }
                ]}>
                    <Ionicons name="person-circle" size={52} color={theme.primary} />
                </View>
            </View>
        </View>

        {/* Checkmark Badge */}
        <View style={[styles.checkBadge, { borderColor: isDark ? '#1E1E1E' : theme.primary }]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
    </Animated.View>
);

const styles = StyleSheet.create({
    iconSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconOuterRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconMiddleRing: {
        width: 115,
        height: 115,
        borderRadius: 57.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInnerCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    checkBadge: {
        position: 'absolute',
        bottom: 8,
        right: width * 0.5 - 70 - 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
