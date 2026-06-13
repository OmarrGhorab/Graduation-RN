import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import StatCard from './StatCard';

export default function TeacherDashboardSummary() {
    const { t } = useTranslation();
    const { isDark, theme } = useTheme();
    const { data: coursesData, isLoading } = useTeacherCourses();
    const { width } = useWindowDimensions();

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

        // Fallback calculation
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
});
