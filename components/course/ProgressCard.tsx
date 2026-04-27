import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressCardProps {
    attendanceRate: number;
    completionRate: number;
    status: 'GOOD_STANDING' | 'NEEDS_IMPROVEMENT' | 'AT_RISK';
    totalLessons: number;
    attendedLessons: number;
}

export function ProgressCard({ attendanceRate, completionRate, status, totalLessons, attendedLessons }: ProgressCardProps) {
    const { theme, isDark } = useTheme();

    const getStatusColor = () => {
        switch (status) {
            case 'GOOD_STANDING': return theme.primary;
            case 'NEEDS_IMPROVEMENT': return '#FFA500';
            case 'AT_RISK': return '#FF4444';
            default: return theme.gray[400];
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'GOOD_STANDING': return 'checkmark-circle';
            case 'NEEDS_IMPROVEMENT': return 'warning';
            case 'AT_RISK': return 'alert-circle';
            default: return 'help-circle';
        }
    };

    const statusColor = getStatusColor();

    return (
        <View style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>Progress Overview</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                    <Ionicons name={getStatusIcon() as any} size={14} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {status.replace('_', ' ')}
                    </Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <View style={styles.circularProgress}>
                        <Text style={[styles.progressValue, { color: theme.primary }]}>
                            {Math.round(attendanceRate)}%
                        </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: theme.gray[600] }]}>Attendance</Text>
                </View>

                <View style={styles.statItem}>
                    <View style={styles.circularProgress}>
                        <Text style={[styles.progressValue, { color: theme.primary }]}>
                            {Math.round(completionRate)}%
                        </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: theme.gray[600] }]}>Completion</Text>
                </View>

                <View style={styles.statItem}>
                    <View style={styles.circularProgress}>
                        <Text style={[styles.progressValue, { color: theme.primary }]}>
                            {attendedLessons}/{totalLessons}
                        </Text>
                    </View>
                    <Text style={[styles.statLabel, { color: theme.gray[600] }]}>Lessons</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'capitalize',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    circularProgress: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#097D4615',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressValue: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
});
