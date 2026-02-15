import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { CourseReview } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ReviewsSectionProps {
    reviews: CourseReview[];
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
    canReview: boolean;
    userReview?: CourseReview;
    onAddReview: () => void;
    onEditReview: (review: CourseReview) => void;
    onDeleteReview: (reviewId: string) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

export function ReviewsSection({
    reviews,
    averageRating,
    totalReviews,
    ratingBreakdown,
    canReview,
    userReview,
    onAddReview,
    onEditReview,
    onDeleteReview,
    onLoadMore,
    hasMore,
}: ReviewsSectionProps) {
    const { theme, isDark } = useTheme();
    const [expanded, setExpanded] = useState(false);

    const renderStars = (rating: number, size: number = 16) => {
        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={size}
                        color="#FFC107"
                    />
                ))}
            </View>
        );
    };

    const renderRatingBar = (stars: number, count: number) => {
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return (
            <View style={styles.ratingBarRow}>
                <Text style={[styles.ratingBarLabel, { color: theme.gray[600] }]}>{stars}</Text>
                <Ionicons name="star" size={12} color="#FFC107" />
                <View style={[styles.ratingBarTrack, { backgroundColor: isDark ? theme.gray[700] : theme.gray[200] }]}>
                    <View
                        style={[
                            styles.ratingBarFill,
                            { width: `${percentage}%`, backgroundColor: '#FFC107' },
                        ]}
                    />
                </View>
                <Text style={[styles.ratingBarCount, { color: theme.gray[500] }]}>{count}</Text>
            </View>
        );
    };

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>
                    Reviews & Ratings
                </Text>
                {canReview && !userReview && (
                    <TouchableOpacity onPress={onAddReview}>
                        <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Rating Summary */}
            <View style={[styles.summaryCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF' }]}>
                <View style={styles.summaryLeft}>
                    <Text style={[styles.averageRating, { color: isDark ? theme.text : '#000' }]}>
                        {averageRating.toFixed(1)}
                    </Text>
                    {renderStars(Math.round(averageRating), 20)}
                    <Text style={[styles.totalReviews, { color: theme.gray[500] }]}>
                        {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </Text>
                </View>
                <View style={styles.summaryRight}>
                    {[5, 4, 3, 2, 1].map((stars) => renderRatingBar(stars, ratingBreakdown[stars as keyof typeof ratingBreakdown] || 0))}
                </View>
            </View>

            {/* User's Review */}
            {userReview && (
                <View style={[styles.userReviewCard, { backgroundColor: `${theme.primary}10`, borderColor: theme.primary }]}>
                    <View style={styles.reviewHeader}>
                        <Text style={[styles.userReviewLabel, { color: theme.primary }]}>Your Review</Text>
                        <View style={styles.reviewActions}>
                            <TouchableOpacity onPress={() => onEditReview(userReview)} style={styles.actionButton}>
                                <Ionicons name="create-outline" size={20} color={theme.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onDeleteReview(userReview.id)} style={styles.actionButton}>
                                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {renderStars(userReview.rating, 16)}
                    <Text style={[styles.reviewComment, { color: isDark ? theme.text : '#000', marginTop: 8 }]}>
                        {userReview.comment}
                    </Text>
                </View>
            )}

            {/* Reviews List */}
            {reviews.length > 0 && (
                <View style={styles.reviewsList}>
                    <Text style={[styles.reviewsListTitle, { color: isDark ? theme.text : '#000' }]}>
                        Student Reviews
                    </Text>
                    {reviews.slice(0, expanded ? reviews.length : 3).map((review) => (
                        <View
                            key={review.id}
                            style={[
                                styles.reviewCard,
                                {
                                    backgroundColor: isDark ? theme.surface : '#FFFFFF',
                                    borderColor: isDark ? theme.border : theme.gray[100],
                                },
                            ]}
                        >
                            <View style={styles.reviewHeader}>
                                <Image
                                    source={{ uri: review.studentProfileImg || 'https://i.pravatar.cc/300' }}
                                    style={styles.reviewerAvatar}
                                />
                                <View style={styles.reviewerInfo}>
                                    <Text style={[styles.reviewerName, { color: isDark ? theme.text : '#000' }]}>
                                        {review.studentName}
                                    </Text>
                                    {renderStars(review.rating, 14)}
                                </View>
                                <Text style={[styles.reviewDate, { color: theme.gray[400] }]}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={[styles.reviewComment, { color: theme.gray[600] }]}>
                                {review.comment}
                            </Text>
                        </View>
                    ))}

                    {reviews.length > 3 && (
                        <TouchableOpacity
                            style={[styles.showMoreButton, { backgroundColor: isDark ? theme.surface : '#F6F8F7' }]}
                            onPress={() => setExpanded(!expanded)}
                        >
                            <Text style={[styles.showMoreText, { color: theme.primary }]}>
                                {expanded ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                            </Text>
                            <Ionicons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={theme.primary}
                            />
                        </TouchableOpacity>
                    )}

                    {hasMore && expanded && (
                        <TouchableOpacity
                            style={[styles.loadMoreButton, { backgroundColor: theme.primary }]}
                            onPress={onLoadMore}
                        >
                            <Text style={styles.loadMoreText}>Load More Reviews</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {reviews.length === 0 && !userReview && (
                <View style={[styles.emptyState, { backgroundColor: isDark ? theme.surface : '#F6F8F7' }]}>
                    <Ionicons name="chatbubbles-outline" size={32} color={theme.gray[400]} />
                    <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                        No reviews yet. Be the first to review!
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    summaryCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    summaryLeft: {
        alignItems: 'center',
        paddingRight: 20,
        borderRightWidth: 1,
        borderRightColor: 'rgba(0,0,0,0.1)',
    },
    averageRating: {
        fontSize: 48,
        fontFamily: Fonts.bold,
        marginBottom: 8,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 4,
    },
    totalReviews: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    summaryRight: {
        flex: 1,
        paddingLeft: 20,
        justifyContent: 'center',
        gap: 4,
    },
    ratingBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingBarLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        width: 12,
    },
    ratingBarTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    ratingBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    ratingBarCount: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        width: 24,
        textAlign: 'right',
    },
    userReviewCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 16,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    userReviewLabel: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    reviewActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        padding: 4,
    },
    reviewsList: {
        gap: 12,
    },
    reviewsListTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 8,
    },
    reviewCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    reviewerName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        marginBottom: 4,
    },
    reviewDate: {
        fontSize: 11,
        fontFamily: Fonts.regular,
    },
    reviewComment: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 20,
        marginTop: 12,
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 6,
        marginTop: 8,
    },
    showMoreText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    loadMoreButton: {
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    loadMoreText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    emptyState: {
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 8,
        textAlign: 'center',
    },
});
