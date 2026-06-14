import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, cskColors } from '@/constants/theme';
import StatCard from './StatCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getTeacherPendingAbsences } from '@/services/CourseService';

export default function TeacherDashboardSummary() {
    const { t } = useTranslation();
    const { isDark, theme } = useTheme();
    const router = useRouter();
    const { data: coursesData, isLoading } = useTeacherCourses();
    const { width } = useWindowDimensions();

    const { data: absencesData } = useQuery({
        queryKey: ['teacher-absences', 'pending'],
        queryFn: getTeacherPendingAbsences,
        staleTime: 60_000,
    });
    const pendingAppealsCount = absencesData?.data?.length ?? 0;

    const isMobile = width < 600;
    const revenueCardStyle = isMobile ? styles.fullWidthCard : styles.thirdWidthCard;
    const secondaryCardStyle = isMobile ? styles.halfWidthCard : styles.thirdWidthCard;

    const stats = useMemo(() => {
        if (!coursesData) return { revenue: 0, students: 0, rating: 0 };

        if (coursesData.summary) {
            return {
                revenue: coursesData.summary.totalRevenue || 0,
                students: coursesData.summary.totalUniqueStudents || 0,
                rating: coursesData.summary.averageRating || 0,
            };
        }

        let revenue = 0;
        let students = 0;
        let ratingSum = 0;
        let ratedCourses = 0;

        (coursesData.data || []).forEach(course => {
            if (course.analytics) {
                revenue += course.analytics.totalRevenue || 0;
                students += course.analytics.totalStudents || 0;
                if (course.analytics.averageRating > 0) {
                    ratingSum += course.analytics.averageRating;
                    ratedCourses++;
                }
            } else {
                students += (course.enrolledStudents || 0);
            }
        });

        return {
            revenue,
            students,
            rating: ratedCourses > 0 ? ratingSum / ratedCourses : 0
        };
    }, [coursesData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: isDark ? theme.text : '#0d1b15' }]}>
                    {t('teacher.dashboardTitle') || 'Management Overview'}
                </Text>
            </View>
            <View style={styles.statsRow}>
                <StatCard
                    title={t('teacher.totalRevenue') || 'Revenue'}
                    value={formatCurrency(stats.revenue)}
                    icon="cash-outline"
                    color="#10b981"
                    delay={100}
                    compact
                    cardStyle={revenueCardStyle}
                />
                <StatCard
                    title={t('teacher.totalStudents') || 'Students'}
                    value={stats.students}
                    icon="people-outline"
                    color="#3b82f6"
                    delay={200}
                    compact
                    cardStyle={secondaryCardStyle}
                />
                <StatCard
                    title={t('teacher.avgRating') || 'Rating'}
                    value={stats.rating.toFixed(1)}
                    icon="star-outline"
                    color="#f59e0b"
                    delay={300}
                    compact
                    cardStyle={secondaryCardStyle}
                />
            </View>

            {/* Absence Appeals Banner */}
            <TouchableOpacity
                style={[styles.appealsBanner, {
                    backgroundColor: pendingAppealsCount > 0
                        ? (isDark ? '#2a1a0a' : '#fff7ed')
                        : (isDark ? '#1a332a' : '#f0fdf4'),
                    borderColor: pendingAppealsCount > 0 ? '#f97316' : cskColors[500],
                }]}
                onPress={() => router.push('/absence-appeals' as any)}
                activeOpacity={0.8}
            >
                <View style={[styles.appealsIcon, {
                    backgroundColor: pendingAppealsCount > 0 ? '#f9731620' : `${cskColors[500]}20`,
                }]}>
                    <Ionicons
                        name="document-text-outline"
                        size={20}
                        color={pendingAppealsCount > 0 ? '#f97316' : cskColors[500]}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.appealsTitle, {
                        color: pendingAppealsCount > 0 ? '#f97316' : cskColors[500],
                    }]}>
                        Absence Appeals
                    </Text>
                    <Text style={[styles.appealsSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        {pendingAppealsCount > 0
                            ? `${pendingAppealsCount} pending request${pendingAppealsCount !== 1 ? 's' : ''} to review`
                            : 'No pending absence requests'}
                    </Text>
                </View>
                {pendingAppealsCount > 0 && (
                    <View style={styles.badgeCircle}>
                        <Text style={styles.badgeText}>{pendingAppealsCount}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    thirdWidthCard: {
        minWidth: '30%',
        flexBasis: '30%',
        flexGrow: 1,
    },
    halfWidthCard: {
        minWidth: '45%',
        flexBasis: '45%',
        flexGrow: 1,
    },
    fullWidthCard: {
        minWidth: '100%',
        flexBasis: '100%',
    },
    loadingContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appealsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    appealsIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appealsTitle: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    appealsSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    badgeCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#f97316',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        color: '#fff',
    },
});
