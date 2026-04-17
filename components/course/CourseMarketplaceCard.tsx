import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ApiCourse } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';

interface CourseMarketplaceCardProps {
    course: ApiCourse;
    onPress: (courseId: string) => void;
}

export default memo(function CourseMarketplaceCard({ course, onPress }: CourseMarketplaceCardProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? theme.surface : '#FFFFFF',
                    borderColor: isDark ? theme.border : 'transparent',
                    borderWidth: isDark ? 1 : 0,
                    shadowColor: isDark ? '#000' : theme.gray[300],
                }
            ]}
            onPress={() => onPress(course.id)}
            activeOpacity={0.9}
        >
            {/* Banner Image */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: course.courseImage || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800' }}
                    style={styles.image}
                    resizeMode="cover"
                />
                <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: course.deliveryType === 'ONLINE' ? '#3b82f6' : theme.primary }]}>
                        <Text style={styles.badgeText}>{course.deliveryType === 'ONLINE' ? t('course.online') : t('course.offline')}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.badgeText}>
                            {course.billingType === 'MONTHLY' ? t('courses.monthly') : t('courses.oneTime')}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                {/* Subject & Rating */}
                <View style={styles.metaRow}>
                    <Text style={[styles.subjectText, { color: theme.primary }]}>
                        {course.subjectName?.toUpperCase()}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={[styles.ratingText, { color: isDark ? theme.gray[400] : theme.gray[600] }]}>
                            {course.courseRating || t('course.new')} <Text style={{ fontSize: 10, color: theme.gray[400] }}>({course.totalRatings || 0})</Text>
                        </Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: isDark ? theme.text : '#1F2937' }]} numberOfLines={2}>
                    {course.title}
                </Text>

                {/* Teacher Info */}
                <View style={styles.teacherRow}>
                    <Image
                        source={{ uri: course.teacherProfileImg || 'https://ui-avatars.com/api/?name=' + course.teacherName }}
                        style={styles.avatar}
                    />
                    <Text style={[styles.teacherName, { color: theme.gray[500] }]}>
                        {course.teacherName}
                    </Text>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: isDark ? theme.border : theme.gray[100] }]} />

                {/* Footer: Details & Price */}
                <View style={styles.footer}>
                    <View style={styles.detailsColumn}>
                        <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={14} color={theme.gray[400]} />
                            <Text style={[styles.detailText, { color: theme.gray[500] }]} numberOfLines={1}>
                                {course.deliveryType === 'ONLINE' ? t('course.online') : (course.locationName || t('home.classroom'))}
                            </Text>
                        </View>
                        <View style={[styles.detailItem, { marginTop: 4 }]}>
                            <Ionicons name="book-outline" size={14} color={theme.gray[400]} />
                            <Text style={[styles.detailText, { color: theme.gray[500] }]}>
                                {course.totalLessons} {t('courseDetails.lessons')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.priceColumn}>
                        <Text style={[styles.price, { color: theme.primary }]}>
                            {course.price === 0 ? t('course.free') : `${course.price} ${course.currency || 'EGP'}`}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    imageContainer: {
        height: 140,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
    },
    content: {
        padding: 16,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    title: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        marginBottom: 12,
        lineHeight: 22,
    },
    teacherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    teacherName: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    detailsColumn: {
        flex: 1,
        marginRight: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    priceColumn: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
});
