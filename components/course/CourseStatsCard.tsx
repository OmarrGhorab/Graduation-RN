
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

interface CourseStatsCardProps {
    attendance: number;
    classesAttended: number;
    totalClasses: number;
    targetPercentage: number;
    style?: ViewStyle;
}

export default memo(function CourseStatsCard({
    attendance,
    classesAttended,
    totalClasses,
    targetPercentage,
    style,
}: CourseStatsCardProps) {
    const { theme, isDark } = useTheme();

    const radius = 36;
    const strokeWidth = 7;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (attendance / 100) * circumference;

    return (
        <Animated.View
            entering={FadeInUp.delay(100).duration(500)}
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? theme.surface : '#FFFFFF',
                    borderColor: isDark ? theme.border : theme.gray[200],
                },
                style
            ]}
        >
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: isDark ? theme.text : theme.gray[900] }]}>Attendance</Text>
                    <Text style={[styles.subtitle, { color: theme.gray[500] }]}>Based on last {totalClasses} classes</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(9, 125, 70, 0.2)' : '#E0F2F1' }]}>
                    <Ionicons name="trending-up" size={14} color={cskColors[600]} />
                    <Text style={[styles.badgeText, { color: cskColors[700] }]}>Good Standing</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.chartContainer}>
                    <Svg width={80} height={80} viewBox="0 0 80 80" style={{ transform: [{ rotate: '-90deg' }] }}>
                        <Circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke={isDark ? theme.gray[800] : theme.gray[200]}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <Circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke={theme.primary}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </Svg>
                    <View style={styles.percentageContainer}>
                        <Text style={[styles.percentageText, { color: isDark ? theme.text : theme.gray[900] }]}>
                            {Math.round(attendance)}%
                        </Text>
                    </View>
                </View>

                <View style={styles.statsInfo}>
                    <View>
                        <Text style={[styles.statsValue, { color: isDark ? theme.text : theme.gray[900] }]}>
                            {classesAttended}/{totalClasses}
                        </Text>
                        <Text style={[styles.statsLabel, { color: theme.gray[500] }]}>Classes Attended</Text>
                    </View>
                    <Text style={[styles.targetText, { color: theme.gray[500] }]}>
                        You need <Text style={{ fontFamily: Fonts.bold, color: theme.gray[700] }}>3 more classes</Text> to reach <Text style={{ fontFamily: Fonts.bold, color: theme.primary }}>{Math.round(targetPercentage)}%</Text> target.
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 2,
        flex: 1,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
    },
    chartContainer: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    statsInfo: {
        flex: 1,
        minWidth: 140,
        justifyContent: 'center',
        gap: 4,
    },
    statsValue: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        lineHeight: 26,
    },
    statsLabel: {
        fontSize: 11,
        fontFamily: Fonts.medium,
    },
    targetText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        lineHeight: 16,
    },
});
