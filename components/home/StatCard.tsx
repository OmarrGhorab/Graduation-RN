import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    delay?: number;
}

export default function StatCard({ title, value, icon, color, delay = 0 }: StatCardProps) {
    const { isDark, theme } = useTheme();

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(600)}
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#183327' : '#ffffff',
                    borderColor: isDark ? '#2a4d3d' : '#e9ebed',
                }
            ]}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                    {value}
                </Text>
                <Text style={[styles.statTitle, { color: isDark ? '#a8b0b8' : '#696f77' }]} numberOfLines={1}>
                    {title}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    statTitle: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        marginTop: 2,
    },
});
