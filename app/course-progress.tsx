import { Fonts } from '@/constants/theme';
import { useCourseProgress } from '@/hooks/useProgress';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CourseProgressScreen() {
    const { id: courseId } = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (user && user.role !== 'TEACHER') {
            router.replace('/home');
        }
    }, [user, router]);

    const { data, isLoading, error } = useCourseProgress(courseId as string);

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
                    Failed to load course progress
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'GOOD_STANDING': return theme.primary;
            case 'NEEDS_IMPROVEMENT': return '#FFA500';
            case 'AT_RISK': return '#FF4444';
            default: return theme.gray[400];
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                    Course Progress
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {data.data.map((progress) => {
                    const statusColor = getStatusColor(progress.status);

                    return (
                        <TouchableOpacity
                            key={progress.studentId}
                            style={[styles.progressCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}
                            onPress={() => router.push({ pathname: '/student-analytics', params: { studentId: progress.studentId, courseId } })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={[styles.studentId, { color: isDark ? theme.text : '#000' }]}>
                                    Student ID: {progress.studentId.slice(0, 8)}...
                                </Text>
                                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                                    <Text style={[styles.statusText, { color: statusColor }]}>
                                        {progress.status.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.stat}>
                                    <Text style={[styles.statValue, { color: theme.primary }]}>
                                        {Math.round(progress.attendanceRate)}%
                                    </Text>
                                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>
                                        Attendance
                                    </Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={[styles.statValue, { color: theme.primary }]}>
                                        {Math.round(progress.completionRate)}%
                                    </Text>
                                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>
                                        Completion
                                    </Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={[styles.statValue, { color: theme.primary }]}>
                                        {progress.attendedLessons}/{progress.totalLessons}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>
                                        Lessons
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <Ionicons name="chevron-forward" size={20} color={theme.gray[400]} />
                            </View>
                        </TouchableOpacity>
                    );
                })}
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
    progressCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    studentId: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'capitalize',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    footer: {
        alignItems: 'flex-end',
    },
});
