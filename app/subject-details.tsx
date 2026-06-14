import { Fonts } from '@/constants/theme';
import { useSubjectDetails } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiSubjectCourse } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getSubjectIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const name = (iconName || '').toLowerCase();
    if (name.includes('calculator')) return 'calculator';
    if (name.includes('magnet')) return 'magnet';
    if (name.includes('flask')) return 'flask';
    if (name.includes('leaf')) return 'leaf';
    if (name.includes('code') || name.includes('laptop')) return 'code-slash';
    if (name.includes('book')) return 'book';
    if (name.includes('megaphone')) return 'megaphone';
    return 'school';
};

export default function SubjectDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const contentWidth = width > 640 ? 600 : width - 40;

    const { data: detailsData, isLoading, error } = useSubjectDetails(id as string);

    const handleCoursePress = useCallback((courseId: string) => {
        router.push({ pathname: '/course-details', params: { id: courseId } });
    }, [router]);

    const renderCourseItem = ({ item, index }: { item: ApiSubjectCourse; index: number }) => {
        const teacherDisplayName = item.teacherName?.trim() || t('course.instructor') || 'Instructor';
        const teacherAvatarUri = item.teacherProfileImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherDisplayName)}`;

        return (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
                <TouchableOpacity
                    style={[
                        styles.courseCard,
                        {
                            width: contentWidth,
                            alignSelf: 'center',
                            backgroundColor: isDark ? theme.surface : '#FFFFFF',
                            borderColor: isDark ? theme.border : theme.gray[200],
                        },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleCoursePress(item.id)}
                >
                    <View style={styles.courseHeader}>
                        <View style={[styles.courseIcon, { backgroundColor: isDark ? theme.surfaceVariant : theme.primaryContainer }]}>
                            <Ionicons name="book" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.courseTitleContainer}>
                            <Text style={[styles.courseTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <View style={styles.badgeRow}>
                                <View style={[styles.deliveryBadge, { backgroundColor: item.deliveryType === 'ONLINE' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Text style={[styles.deliveryBadgeText, { color: item.deliveryType === 'ONLINE' ? '#3b82f6' : '#10b981' }]}>
                                        {item.deliveryType}
                                    </Text>
                                </View>
                                {item.progress && (
                                    <View style={[styles.progressBadge, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                        <Text style={[styles.progressBadgeText, { color: '#f59e0b' }]}>
                                            {item.progress.attendancePercentage}% {t('course.attendance')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: isDark ? theme.border : theme.gray[100] }]} />

                    <View style={styles.courseFooter}>
                        <View style={styles.teacherInfo}>
                            <Image
                                source={{ uri: teacherAvatarUri }}
                                style={styles.teacherAvatar}
                            />
                            <Text 
                                style={[styles.teacherName, { color: theme.gray[600] }]} 
                                numberOfLines={1} 
                                ellipsizeMode="tail"
                            >
                                {teacherDisplayName}
                            </Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={[styles.price, { color: theme.primary }]}>
                                {item.price === 0 ? t('course.free') : `${item.price} ${item.currency}`}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !detailsData) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.gray[400]} />
                <Text style={{ marginTop: 12, color: theme.gray[600], textAlign: 'center' }}>
                    {t('subjects.failedToLoad')}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary, fontFamily: Fonts.bold }}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { subject, courses } = detailsData.data;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            <FlatList
                data={courses}
                renderItem={renderCourseItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={[styles.listHeader, { paddingTop: insets.top + 16 }]}>
                        <LinearGradient
                            colors={isDark ? ['rgba(18, 237, 135, 0.15)', 'transparent'] : ['rgba(18, 237, 135, 0.1)', 'transparent']}
                            style={styles.gradientHeader}
                        />

                        <View style={[styles.navBar, { width: contentWidth, alignSelf: 'center' }]}>
                            <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <Ionicons name="arrow-back" size={22} color={isDark ? theme.text : '#000'} />
                            </TouchableOpacity>
                            <Text style={[styles.navTitle, { color: isDark ? theme.text : '#000' }]}>{t('subjectDetails.title')}</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <Animated.View entering={FadeInUp.duration(600)} style={[styles.subjectHero, { width: contentWidth, alignSelf: 'center' }]}>
                            <View style={[styles.heroIconContainer, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[200] }]}>
                                <Ionicons name={getSubjectIcon(subject.icon)} size={48} color={theme.primary} />
                            </View>
                            <Text style={[styles.subjectName, { color: isDark ? theme.text : '#0d1b15' }]}>
                                {subject.name}
                            </Text>
                            <Text style={[styles.subjectDescription, { color: theme.gray[500] }]}>
                                {subject.description}
                            </Text>

                            <View style={styles.statsRow}>
                                <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                    <Ionicons name="book-outline" size={14} color={theme.primary} />
                                    <Text style={[styles.statBadgeText, { color: isDark ? theme.text : theme.gray[600] }]}>
                                        {t('subjectDetails.coursesCount', { count: subject.totalCourses })}
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000', width: contentWidth, alignSelf: 'center' }]}>
                            {t('subjectDetails.availableCourses')}
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.emptyContainer, { width: contentWidth, alignSelf: 'center' }]}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? theme.surface : 'rgba(0,0,0,0.02)' }]}>
                            <Ionicons name="journal-outline" size={48} color={theme.gray[300]} />
                        </View>
                        <Text style={[styles.emptyText, { color: theme.gray[400] }]}>
                            {t('subjectDetails.noCourses')}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 40,
    },
    listHeader: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    gradientHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
    subjectHero: {
        alignItems: 'center',
        marginBottom: 32,
    },
    heroIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    subjectName: {
        fontSize: 28,
        fontFamily: Fonts.extraBold,
        marginBottom: 8,
        textAlign: 'center',
    },
    subjectDescription: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statBadgeText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 16,
    },
    courseCard: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    courseIcon: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    courseTitleContainer: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 17,
        fontFamily: Fonts.bold,
        marginBottom: 6,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    deliveryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    deliveryBadgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    progressBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    progressBadgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 16,
    },
    courseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginRight: 12,
    },
    teacherAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(18, 237, 135, 0.2)',
    },
    teacherName: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        flex: 1,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: Fonts.medium,
        textAlign: 'center',
        lineHeight: 22,
    },
});
