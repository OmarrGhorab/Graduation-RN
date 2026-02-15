
import { Fonts, cskColors } from '@/constants/theme';
import { useStudentAnalytics } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Mock Data
const DEFAULT_STUDENT = {
    name: 'Alice Smith',
    id: '89204',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWgRbdnYiutmO7Wa9h4nNW_LTkkKfgTTVJFIPef0CYhywJ9fasr-WoEdE0E8oTnjgrXYTWDcgL8p1ts_Unld7QXB9noJFVVg75jNdED0o1kBKTLOd3MK7JtO3gfLKalG9_RyAwKiQvSCm5O22J8rDRQwsaSAovge9MBehMfrNIlLAP_JT0cVnkkYqTY8CnWINgzqqWc3P3IrumLC8AAA5iBRojCi9Fys257EnAI2GoYVRuOb_q17YLqXOoxUOVUVRicnZRA1GiuR2O'
};

const WEEKLY_DATA = [
    { day: 'Mon', height: 80 },
    { day: 'Tue', height: 100, active: true },
    { day: 'Wed', height: 60 },
    { day: 'Thu', height: 45 },
    { day: 'Fri', height: 90, active: true },
];

export default function StudentAnalyticsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme, isDark } = useTheme();

    const studentId = params.id as string;
    const courseId = params.courseId as string;

    const { data: analyticsResponse, isLoading, error } = useStudentAnalytics(studentId, courseId);
    const analytics = analyticsResponse?.data;

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !analytics) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <MaterialIcons name="error-outline" size={48} color={theme.gray[400]} />
                <Text style={{ marginTop: 12, color: theme.gray[600], textAlign: 'center' }}>
                    Failed to load analytics data
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const studentName = analytics.studentName;
    const studentImage = analytics.studentProfileImg || DEFAULT_STUDENT.image;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? 'rgba(16, 34, 26, 0.9)' : 'rgba(246, 248, 247, 0.9)'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? 'rgba(16, 34, 26, 0.9)' : 'rgba(246, 248, 247, 0.9)', borderColor: isDark ? '#1f2937' : '#e5e7eb' }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <MaterialIcons name="arrow-back" size={24} color={isDark ? '#fff' : '#0d1b15'} />
                    </TouchableOpacity>
                    <View style={[styles.avatarContainer, { borderColor: cskColors[500] }]}>
                        <Image source={{ uri: studentImage }} style={styles.avatar} />
                        <View style={[styles.onlineIndicator, { borderColor: isDark ? '#10221a' : '#f6f8f7', backgroundColor: cskColors[500] }]} />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Analytics</Text>
                        <Text style={[styles.headerSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Student ID: {studentId}</Text>
                    </View>
                </View>
                <View style={[styles.secureBadge, { backgroundColor: 'rgba(18, 237, 135, 0.1)', borderColor: 'rgba(18, 237, 135, 0.2)' }]}>
                    <MaterialIcons name="lock" size={14} color={cskColors[500]} />
                    <Text style={[styles.secureText, { color: cskColors[500] }]}>SECURE</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Summary Cards */}
                <View style={styles.summaryRow}>
                    {/* Attendance Card */}
                    <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1c3026' : '#ffffff', borderColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(18, 237, 135, 0.1)' }]}>
                                <MaterialIcons name="calendar-today" size={20} color={cskColors[500]} />
                            </View>
                            <View style={[styles.trendBadge, { backgroundColor: analytics.attendanceChange >= 0 ? (isDark ? 'rgba(22, 163, 74, 0.2)' : '#ecfdf5') : (isDark ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2') }]}>
                                <MaterialIcons
                                    name={analytics.attendanceChange >= 0 ? "trending-up" : "trending-down"}
                                    size={14}
                                    color={analytics.attendanceChange >= 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626')}
                                />
                                <Text style={[styles.trendText, { color: analytics.attendanceChange >= 0 ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#f87171' : '#dc2626') }]}>
                                    {analytics.attendanceChange >= 0 ? '+' : ''}{analytics.attendanceChange}%
                                </Text>
                            </View>
                        </View>
                        <View>
                            <Text style={[styles.cardLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Attendance Rate</Text>
                            <Text style={[styles.cardValue, { color: isDark ? '#fff' : '#0d1b15' }]}>{Math.round(analytics.attendanceRate)}%</Text>
                        </View>
                        {/* Decorative Background Element */}
                        <View style={[styles.decorativeCircle, { backgroundColor: 'rgba(18, 237, 135, 0.05)' }]} />
                    </View>

                    {/* Completion Card */}
                    <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1c3026' : '#ffffff', borderColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(18, 237, 135, 0.1)' }]}>
                                <MaterialIcons name="donut-large" size={20} color={cskColors[500]} />
                            </View>
                        </View>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                                <Text style={[styles.cardLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Completion</Text>
                                <Text style={[styles.miniValue, { color: cskColors[500] }]}>{analytics.completedLessons}/{analytics.totalLessons}</Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <View style={[styles.progressBarFill, { width: `${analytics.completionRate}%`, backgroundColor: cskColors[500] }]} />
                            </View>
                            <Text style={[styles.cardValue, { color: isDark ? '#fff' : '#0d1b15', marginTop: 8 }]}>{Math.round(analytics.completionRate)}%</Text>
                        </View>
                        {/* Decorative Background Element */}
                        <View style={[styles.decorativeCircle, { backgroundColor: 'rgba(18, 237, 135, 0.05)' }]} />
                    </View>
                </View>

                {/* Weekly Attendance Chart */}
                <View style={[styles.chartCard, { backgroundColor: isDark ? '#1c3026' : '#ffffff', borderColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Weekly Attendance</Text>
                            <Text style={[styles.sectionSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {analytics.courseName}
                            </Text>
                        </View>
                        <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? '#374151' : '#f9fafb' }]}>
                            <MaterialIcons name="more-horiz" size={20} color={isDark ? '#9ca3af' : '#9ca3af'} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.chartContainer}>
                        {analytics.weeklyAttendance.map((item, index) => {
                            const maxHeight = Math.max(...analytics.weeklyAttendance.map(d => d.hours), 1);
                            const heightPercent = (item.hours / maxHeight) * 100;
                            const isActive = new Date().toLocaleDateString('en-US', { weekday: 'short' }) === item.day;

                            return (
                                <View key={index} style={styles.chartColumn}>
                                    <View style={[styles.barBg, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                {
                                                    height: `${Math.max(heightPercent, 5)}%`,
                                                    backgroundColor: isActive ? cskColors[500] : (isDark ? 'rgba(18, 237, 135, 0.3)' : 'rgba(18, 237, 135, 0.3)'),
                                                    borderTopLeftRadius: 6,
                                                    borderTopRightRadius: 6,
                                                },
                                                isActive && { shadowColor: cskColors[500], shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.dayText, { color: isActive ? (isDark ? '#fff' : '#0d1b15') : (isDark ? '#6b7280' : '#6b7280'), fontWeight: isActive ? 'bold' : 'normal' }]}>
                                        {item.day}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Leaderboard Banner */}
                <LinearGradient
                    colors={['#0d1b15', '#1c3026']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.leaderboardCard}
                >
                    <View style={styles.leaderboardContent}>
                        <View>
                            <View style={styles.topPerformerBadge}>
                                <View style={[styles.trophyIcon, { backgroundColor: 'rgba(18, 237, 135, 0.2)' }]}>
                                    <MaterialIcons name="emoji-events" size={14} color={cskColors[500]} />
                                </View>
                                <Text style={[styles.topPerformerText, { color: cskColors[500] }]}>
                                    {analytics.rank <= 3 ? 'TOP PERFORMER' : 'CLASS RANK'}
                                </Text>
                            </View>
                            <Text style={styles.rankText}>Rank #{analytics.rank}</Text>
                            <Text style={styles.rankDesc}>Out of {analytics.totalStudents} students in {analytics.courseName}.</Text>
                        </View>
                        <View style={styles.rankRight}>
                            <View style={styles.rankAvatarContainer}>
                                <Image source={{ uri: studentImage }} style={styles.rankAvatar} />
                            </View>
                            <View style={styles.pointsBadge}>
                                <Text style={styles.pointsText}>{analytics.points} pts</Text>
                            </View>
                        </View>
                    </View>
                    {/* Background Pattern Mock */}
                    <View style={styles.bgPattern} />
                </LinearGradient>

                {/* Recent Activity */}
                <View style={styles.activitySection}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Recent Activity</Text>
                        <TouchableOpacity>
                            <Text style={[styles.viewAllText, { color: cskColors[500] }]}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.activityList}>
                        {analytics.recentActivity.map((activity, index) => (
                            <View key={index} style={[styles.activityItem, { backgroundColor: isDark ? '#1c3026' : '#ffffff', borderColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                                <View style={styles.activityLeft}>
                                    <View style={[styles.activityIcon, {
                                        backgroundColor: activity.status === 'PRESENT'
                                            ? (isDark ? 'rgba(22, 163, 74, 0.2)' : '#ecfdf5')
                                            : activity.status === 'LATE'
                                                ? (isDark ? 'rgba(251, 191, 36, 0.2)' : '#fffbeb')
                                                : (isDark ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2')
                                    }]}>
                                        <MaterialIcons
                                            name={activity.status === 'PRESENT' ? 'check-circle' : activity.status === 'LATE' ? 'watch-later' : 'cancel'}
                                            size={20}
                                            color={activity.status === 'PRESENT' ? '#16a34a' : activity.status === 'LATE' ? '#d97706' : '#dc2626'}
                                        />
                                    </View>
                                    <View>
                                        <Text style={[styles.activityTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>{activity.lessonTitle}</Text>
                                        <Text style={[styles.activitySubtitle, { color: isDark ? '#6b7280' : '#6b7280' }]}>
                                            {new Date(activity.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} | {new Date(activity.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.activityValue, { color: isDark ? '#fff' : '#0d1b15' }]}>
                                    {Math.round(activity.durationMins / 60)}hrs
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

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
        paddingHorizontal: 24,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        paddingBottom: 24,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        lineHeight: 24,
    },
    headerSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        gap: 4,
    },
    secureText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
    },
    content: {
        padding: 24,
        gap: 24,
        paddingBottom: 40,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
    },
    summaryCard: {
        flex: 1,
        height: 160,
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconBox: {
        padding: 8,
        borderRadius: 8,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 2,
    },
    trendText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    cardLabel: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 28, // ~text-3xl
        fontFamily: Fonts.bold,
    },
    miniValue: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    progressBarBg: {
        width: '100%',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    decorativeCircle: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 64,
        height: 64,
        borderBottomLeftRadius: 32,
    },
    chartCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 160, // h-40/48
        alignItems: 'flex-end',
    },
    chartColumn: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    barBg: {
        width: '100%',
        height: 128, // h-32
        borderRadius: 8,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
    },
    dayText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    leaderboardCard: {
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    leaderboardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
    },
    topPerformerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    trophyIcon: {
        padding: 6,
        borderRadius: 8,
    },
    topPerformerText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
    },
    rankText: {
        color: '#fff',
        fontSize: 24,
        fontFamily: Fonts.bold,
    },
    rankDesc: {
        color: '#9ca3af',
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 4,
        maxWidth: 160,
    },
    rankRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    rankAvatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 4,
        borderColor: 'rgba(18, 237, 135, 0.3)',
        padding: 4,
    },
    rankAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    pointsBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pointsText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    bgPattern: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50%',
        height: '100%',
        backgroundColor: cskColors[500],
        opacity: 0.05,
        borderBottomLeftRadius: 100,
    },
    activitySection: {
        gap: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    activityList: {
        gap: 12,
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityTitle: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    activitySubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    activityValue: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    pendingBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    pendingText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
});
