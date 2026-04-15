import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, review: string) => Promise<void>;
    initialRating?: number;
    initialReview?: string;
    isEdit?: boolean;
}

export function ReviewModal({
    visible,
    onClose,
    onSubmit,
    initialRating = 0,
    initialReview = '',
    isEdit = false,
}: ReviewModalProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const [rating, setRating] = useState(initialRating);
    const [review, setReview] = useState(initialReview);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            return;
        }

        if (review.trim().length < 10) {
            Alert.alert(t('common.error'), t('courseDetails.reviewTooShort'));
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(rating, review);
            onClose();
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setRating(initialRating);
            setReview(initialReview);
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: isDark ? theme.surface : '#FFFFFF' }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                            {isEdit ? 'Edit Review' : 'Write a Review'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                            <Ionicons name="close" size={24} color={theme.gray[400]} />
                        </TouchableOpacity>
                    </View>

                    {/* Rating Stars */}
                    <View style={styles.ratingSection}>
                        <Text style={[styles.label, { color: isDark ? theme.text : '#000' }]}>
                            Your Rating
                        </Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    disabled={isSubmitting}
                                    style={styles.starButton}
                                >
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={40}
                                        color={star <= rating ? '#FFC107' : theme.gray[300]}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        {rating > 0 && (
                            <Text style={[styles.ratingText, { color: theme.gray[500] }]}>
                                {rating === 1 && 'Poor'}
                                {rating === 2 && 'Fair'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent'}
                            </Text>
                        )}
                    </View>

                    {/* Comment */}
                    <View style={styles.commentSection}>
                        <Text style={[styles.label, { color: isDark ? theme.text : '#000' }]}>
                            {t('courseDetails.reviewLabel')}
                        </Text>
                        <TextInput
                            style={[
                                styles.textArea,
                                {
                                    backgroundColor: isDark ? theme.background : '#F6F8F7',
                                    color: isDark ? theme.text : '#000',
                                    borderColor: isDark ? theme.border : theme.gray[200],
                                },
                            ]}
                            placeholder={t('courseDetails.reviewPlaceholder')}
                            placeholderTextColor={theme.gray[400]}
                            value={review}
                            onChangeText={setReview}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { backgroundColor: theme.gray[200] }]}
                            onPress={handleClose}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.buttonText, { color: theme.gray[700] }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.submitButton,
                                {
                                    backgroundColor: rating > 0 && review.trim().length >= 10 ? theme.primary : theme.gray[300],
                                },
                            ]}
                            onPress={handleSubmit}
                            disabled={rating === 0 || review.trim().length < 10 || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isEdit ? 'Update Review' : 'Submit Review'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 24,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        marginBottom: 12,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    commentSection: {
        marginBottom: 24,
    },
    textArea: {
        minHeight: 120,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {},
    submitButton: {},
    buttonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
});
