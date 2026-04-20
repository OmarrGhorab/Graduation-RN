import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ApiAbsenceRequest } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AbsenceRequestCardProps {
    request: ApiAbsenceRequest;
    onRespond?: (approve: boolean) => void;
    showActions?: boolean;
}

export function AbsenceRequestCard({ request, onRespond, showActions = false }: AbsenceRequestCardProps) {
    const { theme, isDark } = useTheme();

    const getStatusColor = () => {
        switch (request.status) {
            case 'APPROVED': return theme.primary;
            case 'REJECTED': return '#FF4444';
            case 'PENDING': return '#FFA500';
            default: return theme.gray[400];
        }
    };

    const getReasonIcon = () => {
        switch (request.reasonType) {
            case 'MEDICAL': return 'medical';
            case 'EMERGENCY': return 'alert-circle';
            case 'TECHNICAL': return 'build-circle';
            case 'PERSONAL': return 'people-circle';
            default: return 'document-text';
        }
    };

    const statusColor = getStatusColor();

    return (
        <View style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name={getReasonIcon() as any} size={20} color={theme.primary} />
                    <View>
                        <Text style={[styles.reasonType, { color: isDark ? theme.text : '#000' }]}>
                            {request.reasonType.replace('_', ' ')}
                        </Text>
                        {request.studentName && (
                            <Text style={[styles.studentName, { color: theme.gray[500] }]}>
                                Child: {request.studentName}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {request.status}
                    </Text>
                </View>
            </View>

            {(request.lessonTitle || request.courseTitle || request.lesson?.title || request.course?.title) && (
                <View style={styles.lessonInfo}>
                    <Ionicons name="book-outline" size={14} color={theme.gray[400]} />
                    <Text style={[styles.lessonTitle, { color: theme.gray[500] }]}>
                        {(() => {
                            const c = request.courseTitle || request.courseName || request.course?.title || request.course?.name || request.course_title;
                            const l = request.lessonTitle || request.lessonName || request.lesson?.title || request.lesson?.name || request.lesson_title || 'Untitled Lesson';
                            return c ? `${c}: ${l}` : l;
                        })()}
                    </Text>
                </View>
            )}

            <Text style={[styles.reasonText, { color: isDark ? theme.gray[400] : theme.gray[600] }]}>
                {request.reasonText}
            </Text>

            {request.attachmentUrl && (
                <View style={styles.attachmentInfo}>
                    <Ionicons name="image-outline" size={14} color={theme.primary} />
                    <Text style={[styles.attachmentText, { color: theme.primary }]}>
                        Attachment Included
                    </Text>
                </View>
            )}

            <View style={styles.meta}>
                <Text style={[styles.metaText, { color: theme.gray[400] }]}>
                    Submitted: {(() => {
                        const d = request.requestedAt || request.createdAt;
                        const dateObj = new Date(d);
                        return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
                    })()}
                </Text>
            </View>

            {request.responseNote && (
                <View style={[styles.responseNote, { backgroundColor: `${statusColor}10` }]}>
                    <Text style={[styles.responseLabel, { color: theme.gray[500] }]}>Response:</Text>
                    <Text style={[styles.responseText, { color: theme.gray[700] }]}>
                        {request.responseNote}
                    </Text>
                </View>
            )}

            {showActions && request.status === 'PENDING' && onRespond && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF444415' }]}
                        onPress={() => onRespond(false)}
                    >
                        <Ionicons name="close-circle" size={18} color="#FF4444" />
                        <Text style={[styles.actionText, { color: '#FF4444' }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: `${theme.primary}15` }]}
                        onPress={() => onRespond(true)}
                    >
                        <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                        <Text style={[styles.actionText, { color: theme.primary }]}>Approve</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reasonType: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        textTransform: 'capitalize',
    },
    studentName: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginTop: -2,
    },
    lessonInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    lessonTitle: {
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    attachmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        backgroundColor: 'rgba(18, 237, 135, 0.05)',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    attachmentText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'uppercase',
    },
    reasonText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 20,
        marginBottom: 8,
    },
    meta: {
        marginTop: 4,
    },
    metaText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    responseNote: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
    },
    responseLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    responseText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
});
