import { Fonts, cskColors } from '@/constants/theme';
import { useLessonAnalytics } from '@/hooks/useAnalytics';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const STATUS_COLORS = {
    PRESENT: '#12ed87',
    LATE: '#fbbf24',
    ABSENT: '#ef4444',
    EXCUSED: '#3b82f6',
};

const STATUS_BG = {
    PRESENT: 'rgba(18, 237, 135, 0.1)',
    LATE: 'rgba(251, 191, 36, 0.1)',
    ABSENT: 'rgba(239, 68, 68, 0.1)',
    EXCUSED: 'rgba(59, 130, 246, 0.1)',
};

export default function LessonAnalyticsScreen() {
    const { lessonId } = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const { data, isLoading, error } = useLessonAnalytics(lessonId as string);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={cskColors[500]} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="analytics-outline" size={64} color={isDark ? '#2a4d3d' : '#e2e8f0'} />
                <Text style={[styles.errorText, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                    {t('errors.somethingWentWrong') || 'Analytics unavailable for this lesson'}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={[styles.retryBtn, { backgroundColor: cskColors[500] }]}>
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const analytics = data.data;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={[styles.backBtn, { backgroundColor: isDark ? '#1f3b2e' : '#ffffff' }]}
                >
                    <Ionicons name="chevron-back" size={24} color={isDark ? '#ffffff' : '#0d1b15'} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.title, { color: isDark ? '#ffffff' : '#0d1b15' }]} numberOfLines={1}>
                        {analytics.lessonTitle || t('teacher.lessonAnalytics')}
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#88cba8' : '#4c9a75' }]}>
                        {t('teacher.analyticsOverview')}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Attendance Summary Card */}
                <LinearGradient
                    colors={isDark ? ['#183327', '#10221a'] : ['#ffffff', '#f1f5f9']}
                    style={[styles.summaryCard, { borderColor: isDark ? '#2a4d3d' : '#e2e8f0' }]}
                >
                    <View style={styles.rateHeader}>
                        <View>
                            <Text style={[styles.rateLabel, { color: isDark ? '#88cba8' : '#64748b' }]}>
                                {t('course.attendance') || 'Attendance Rate'}
                            </Text>
                            <Text style={[styles.rateValue, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                {analytics.attendanceRate.toFixed(1)}%
                            </Text>
                        </View>
                        <View style={[styles.rateIconContainer, { backgroundColor: `${cskColors[500]}20` }]}>
                            <MaterialIcons name="trending-up" size={32} color={cskColors[500]} />
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: STATUS_COLORS.PRESENT }]} />
                            <Text style={[styles.statCount, { color: isDark ? '#ffffff' : '#0d1b15' }]}>{analytics.presentCount}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#88cba8' : '#64748b' }]}>{t('home.live') || 'Present'}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: STATUS_COLORS.LATE }]} />
                            <Text style={[styles.statCount, { color: isDark ? '#ffffff' : '#0d1b15' }]}>{analytics.lateCount}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#88cba8' : '#64748b' }]}>Late</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statDot, { backgroundColor: STATUS_COLORS.ABSENT }]} />
                            <Text style={[styles.statCount, { color: isDark ? '#ffffff' : '#0d1b15' }]}>{analytics.absentCount}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#88cba8' : '#64748b' }]}>Absent</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Distribution Chart */}
                <View style={[styles.sectionCard, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: isDark ? '#2a4d3d' : '#e2e8f0' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>Distribution</Text>
                    <View style={styles.chartContainer}>
                        {[
                            { label: 'Present', count: analytics.presentCount, color: STATUS_COLORS.PRESENT },
                            { label: 'Late', count: analytics.lateCount, color: STATUS_COLORS.LATE },
                            { label: 'Absent', count: analytics.absentCount, color: STATUS_COLORS.ABSENT },
                            { label: 'Excused', count: analytics.excusedCount, color: STATUS_COLORS.EXCUSED },
                        ].map((item, index) => {
                            const barWidth = analytics.totalStudents > 0 ? (item.count / analytics.totalStudents) * 100 : 0;
                            return (
                                <View key={index} style={styles.chartRow}>
                                    <View style={styles.chartRowLabelContainer}>
                                        <Text style={[styles.chartRowLabel, { color: isDark ? '#e1e5e9' : '#334155' }]}>{item.label}</Text>
                                        <Text style={[styles.chartRowValue, { color: item.color }]}>{item.count}</Text>
                                    </View>
                                    <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#10221a' : '#f1f5f9' }]}>
                                        <View 
                                            style={[
                                                styles.progressBarFill, 
                                                { 
                                                    width: `${Math.max(barWidth, 2)}%`, 
                                                    backgroundColor: item.color 
                                                }
                                            ]} 
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Recent Activity List */}
                <View style={[styles.sectionCard, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: isDark ? '#2a4d3d' : '#e2e8f0' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>{t('teacher.recentActivity') || 'Recent Activity'}</Text>
                    {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
                        analytics.recentActivity.map((activity, index) => (
                            <View 
                                key={index} 
                                style={[
                                    styles.activityItem, 
                                    { borderBottomColor: isDark ? '#2a4d3d' : '#f1f5f9' },
                                    index === analytics.recentActivity.length - 1 && { borderBottomWidth: 0 }
                                ]}
                            >
                                <View style={[styles.activityIcon, { backgroundColor: STATUS_BG[activity.status] }]}>
                                    <Ionicons 
                                        name={activity.status === 'PRESENT' || activity.status === 'LATE' ? 'checkmark-circle' : 'close-circle'} 
                                        size={20} 
                                        color={STATUS_COLORS[activity.status]} 
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.studentName, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                        {activity.studentName}
                                    </Text>
                                    <Text style={[styles.activityTime, { color: isDark ? '#88cba8' : '#64748b' }]}>
                                        {activity.scannedAt ? new Date(activity.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not scanned'}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[activity.status] }]}>
                                    <Text style={[styles.statusText, { color: STATUS_COLORS[activity.status] }]}>
                                        {activity.status}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyActivity}>
                            <Text style={{ color: isDark ? '#6b737c' : '#949da5' }}>No activity recorded yet</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        gap: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginTop: 2,
    },
    scrollContent: {
        padding: 20,
    },
    summaryCard: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 24,
    },
    rateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    rateLabel: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    rateValue: {
        fontSize: 40,
        fontFamily: Fonts.bold,
        marginTop: 4,
    },
    rateIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    statItem: {
        alignItems: 'center',
    },
    statDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    statCount: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginTop: 2,
    },
    sectionCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 20,
    },
    chartContainer: {
        gap: 20,
    },
    chartRow: {
        gap: 8,
    },
    chartRowLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chartRowLabel: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    chartRowValue: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityContent: {
        flex: 1,
    },
    studentName: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    activityTime: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
    },
    emptyActivity: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginTop: 16,
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#0d1b15',
        fontFamily: Fonts.bold,
        fontSize: 16,
    },
});
