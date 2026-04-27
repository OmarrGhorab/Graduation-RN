import { Fonts } from '@/constants/theme';
import { useStudentAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StudentAnalyticsScreen() {
    const { studentId, courseId } = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (user && user.role !== 'TEACHER') {
            router.replace('/home');
        }
    }, [user, router]);

    const { data, isLoading, error } = useStudentAnalytics(studentId as string, courseId as string);

    if (!user || user.role !== 'TEACHER') return null;

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.gray[400]} />
                <Text style={[styles.errorText, { color: theme.gray[600] }]}>
                    Failed to load analytics
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const analytics = data.data;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                    Student Analytics
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Attendance Rate Card */}
                <View style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
                    <Text style={[styles.cardTitle, { color: isDark ? theme.text : '#000' }]}>
                        Attendance Rate
                    </Text>
                    <View style={styles.rateContainer}>
                        <Text style={[styles.rateValue, { color: theme.primary }]}>
                            {analytics.attendanceRate.toFixed(1)}%
                        </Text>
                        {analytics.attendanceChange !== undefined && (
                            <View style={[styles.changeBadge, { backgroundColor: analytics.attendanceChange >= 0 ? '#4CAF5015' : '#FF444415' }]}>
                                <Ionicons
                                    name={analytics.attendanceChange >= 0 ? 'trending-up' : 'trending-down'}
                                    size={14}
                                    color={analytics.attendanceChange >= 0 ? '#4CAF50' : '#FF4444'}
                                />
                                <Text style={[styles.changeText, { color: analytics.attendanceChange >= 0 ? '#4CAF50' : '#FF4444' }]}>
                                    {Math.abs(analytics.attendanceChange).toFixed(1)}%
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Rank Card */}
                {analytics.rank && (
                    <View style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
                        <Text style={[styles.cardTitle, { color: isDark ? theme.text : '#000' }]}>
                            Class Rank
                        </Text>
                        <View style={styles.rankContainer}>
                            <Ionicons name="trophy" size={32} color={theme.primary} />
                            <Text style={[styles.rankValue, { color: theme.primary }]}>
                                #{analytics.rank}
                            </Text>
                            <Text style={[styles.rankLabel, { color: theme.gray[500] }]}>
                                out of {analytics.totalStudents || 'N/A'} students
                            </Text>
                        </View>
                    </View>
                )}

                {/* Weekly Attendance Chart */}
                {analytics.weeklyAttendance && analytics.weeklyAttendance.length > 0 && (
                    <View style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
                        <Text style={[styles.cardTitle, { color: isDark ? theme.text : '#000' }]}>
                            Weekly Attendance
                        </Text>
                        <View style={styles.chartContainer}>
                            {analytics.weeklyAttendance.map((item, index) => {
                                // Calculate attendance rate from hours (assuming 40 hours per week max)
                                const attendanceRate = Math.min((item.hours / 40) * 100, 100);
                                return (
                                    <View key={index} style={styles.chartBar}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: `${attendanceRate}%`,
                                                    backgroundColor: attendanceRate >= 80 ? theme.primary : attendanceRate >= 50 ? '#FFA500' : '#FF4444',
                                                },
                                            ]}
                                        />
                                        <Text style={[styles.chartLabel, { color: theme.gray[500] }]}>
                                            {item.day}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Recent Activity */}
                {analytics.recentActivity && analytics.recentActivity.length > 0 && (
                    <View style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
                        <Text style={[styles.cardTitle, { color: isDark ? theme.text : '#000' }]}>
                            Recent Activity
                        </Text>
                        {analytics.recentActivity.map((activity, index) => (
                            <View key={index} style={styles.activityItem}>
                                <Ionicons
                                    name={activity.status === 'PRESENT' ? 'checkmark-circle' : 'close-circle'}
                                    size={20}
                                    color={activity.status === 'PRESENT' ? theme.primary : '#FF4444'}
                                />
                                <View style={styles.activityInfo}>
                                    <Text style={[styles.activityTitle, { color: isDark ? theme.text : '#000' }]}>
                                        {activity.lessonTitle}
                                    </Text>
                                    <Text style={[styles.activityDate, { color: theme.gray[500] }]}>
                                        {new Date(activity.scheduledAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={[styles.activityStatus, { color: activity.status === 'PRESENT' ? theme.primary : '#FF4444' }]}>
                                    {activity.status}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    content: {
        padding: 16,
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    backButton: {
        marginTop: 20,
    },
    backText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 12,
    },
    rateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rateValue: {
        fontSize: 32,
        fontFamily: Fonts.bold,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    changeText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    rankContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    rankValue: {
        fontSize: 36,
        fontFamily: Fonts.bold,
        marginTop: 8,
    },
    rankLabel: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginTop: 4,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 150,
        paddingTop: 20,
    },
    chartBar: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: 30,
        borderRadius: 4,
        marginBottom: 8,
    },
    chartLabel: {
        fontSize: 11,
        fontFamily: Fonts.regular,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 2,
    },
    activityDate: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    activityStatus: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        textTransform: 'uppercase',
    },
});
