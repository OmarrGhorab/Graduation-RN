import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationItemProps } from './types';
import { useNotificationStyles } from './useNotificationStyles';
import { formatTimeAgo, getNotificationIcon } from './utils';

const getParentLinkRequestId = (item: NotificationItemProps['item']): string | null => {
    return (
        item.data?.requestId ||
        item.data?.request_id ||
        item.data?.linkRequestId ||
        item.data?.link_request_id ||
        item.data?.request?.id ||
        item.action?.params?.requestId ||
        item.action?.params?.request_id ||
        null
    );
};

const NotificationItem = memo(({ item, onPress, onDelete, onRespondToParentLink, isResponding }: NotificationItemProps) => {
    const { styles, colors, isDark } = useNotificationStyles();
    const { t } = useTranslation();

    const icon = getNotificationIcon(item.type, isDark);
    const time = formatTimeAgo(item.createdAt, t);
    const isParentLinkRequest = item.type === 'parent_link_request';
    const isChatMessage = item.type === 'chat.message' || item.type === 'message' || item.type === 'CHAT_MESSAGE' || item.type === 'chat_message';

    // Check if this request has been responded to
    const status = item.data?.status;
    const isAccepted = status === 'ACCEPTED';
    const isDeclined = status === 'DECLINED';
    const hasResponded = isAccepted || isDeclined;
    const requestId = isParentLinkRequest ? getParentLinkRequestId(item) : null;
    const canRespond = !!requestId && !!onRespondToParentLink && !isResponding;

    const handleRespond = (action: 'accept' | 'decline') => {
        if (!requestId || !onRespondToParentLink || isResponding) return;
        onRespondToParentLink(requestId, action);
    };

    // Get icon background color based on type
    const getIconBgColor = () => {
        const t = item.type;
        if (isChatMessage) return isDark ? 'rgba(79, 191, 138, 0.15)' : 'rgba(9, 125, 70, 0.1)';
        if (isParentLinkRequest || t.startsWith('unlink')) return isDark ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.1)';
        if (t.includes('security') || t.includes('FRAUD') || t === 'SUBSCRIPTION_PAYMENT_FAILED') return isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
        if (t === 'LESSON_CANCELED' || t === 'VIDEO_FAILED') return isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
        if (t === 'LESSON_RESCHEDULED' || t === 'LESSON_REMINDER' || t === 'reminder' || t === 'SUBSCRIPTION_RENEWAL_SOON') return isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)';
        if (t.startsWith('LESSON') || t.startsWith('CHILD_LESSON') || t === 'COURSE_ENROLLMENT' || t === 'COURSE_REVIEW' || t === 'VIDEO_READY' || t.startsWith('ATTENDANCE') || t.startsWith('ABSENCE') || t === 'PROGRESS_UPDATED' || t === 'parent_report_ready') return isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
        return isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(156, 163, 175, 0.1)';
    };

    return (
        <Pressable
            style={[
                localStyles.card,
                {
                    backgroundColor: isDark ? '#1E2A24' : '#FFFFFF',
                    borderColor: !item.read
                        ? (isDark ? 'rgba(79, 191, 138, 0.3)' : 'rgba(9, 125, 70, 0.2)')
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                }
            ]}
            onPress={() => onPress(item)}
        >
            {/* Unread Indicator Dot */}
            {!item.read && (
                <View style={[localStyles.unreadDot, { backgroundColor: '#48BB78' }]} />
            )}

            {/* Avatar / Icon */}
            <View style={localStyles.avatarContainer}>
                {item.image ? (
                    <View style={localStyles.avatarWrapper}>
                        <Image source={{ uri: item.image }} style={localStyles.avatar} />
                        {isChatMessage && (
                            <View style={[localStyles.iconBadge, { backgroundColor: isDark ? '#1E2A24' : '#FFFFFF' }]}>
                                <Ionicons name="chatbubble" size={12} color="#48BB78" />
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={[localStyles.iconCircle, { backgroundColor: getIconBgColor() }]}>
                        <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    </View>
                )}
            </View>

            {/* Content */}
            <View style={localStyles.content}>
                <View style={localStyles.headerRow}>
                    <Text
                        style={[localStyles.title, { color: isDark ? '#FFFFFF' : '#0D1B15' }]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text style={[localStyles.time, { color: !item.read ? '#48BB78' : (isDark ? '#6B7280' : '#9CA3AF') }]}>
                        {time}
                    </Text>
                </View>

                <Text
                    style={[localStyles.body, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
                    numberOfLines={2}
                >
                    {item.body}
                </Text>

                {/* Action Buttons for Parent Link Request */}
                {isParentLinkRequest && !hasResponded && (
                    <View style={localStyles.actionButtons}>
                        <TouchableOpacity
                            style={[localStyles.acceptButton, !canRespond && localStyles.disabledButton]}
                            onPress={() => handleRespond('accept')}
                            disabled={!canRespond}
                        >
                            {isResponding ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={localStyles.acceptButtonText} numberOfLines={1}>{t('notifications.accept')}</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[localStyles.declineButton, { borderColor: isDark ? '#374151' : '#E5E7EB' }, !canRespond && localStyles.disabledButton]}
                            onPress={() => handleRespond('decline')}
                            disabled={!canRespond}
                        >
                            <Text style={[localStyles.declineButtonText, { color: isDark ? '#FFFFFF' : '#0D1B15' }]}>
                                {t('notifications.decline')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Status Badge for responded requests */}
                {isParentLinkRequest && hasResponded && (
                    <View style={[
                        localStyles.statusBadge,
                        {
                            backgroundColor: isAccepted
                                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
                                : (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)')
                        }
                    ]}>
                        <Ionicons
                            name={isAccepted ? 'checkmark-circle' : 'close-circle'}
                            size={14}
                            color={isAccepted ? '#22C55E' : '#EF4444'}
                        />
                        <Text style={[localStyles.statusText, { color: isAccepted ? '#22C55E' : '#EF4444' }]}>
                            {isAccepted ? t('notifications.accepted') : t('notifications.declined')}
                        </Text>
                    </View>
                )}
            </View>

            {/* Delete Button (on long press or swipe) */}
            {onDelete && (
                <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    style={localStyles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
                </TouchableOpacity>
            )}
        </Pressable>
    );
});

const localStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    unreadDot: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    iconBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        minWidth: 0,
        paddingRight: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
        minWidth: 0,
    },
    title: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        flex: 1,
        minWidth: 0,
        marginRight: 8,
    },
    time: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        flexShrink: 0,
    },
    body: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        flexWrap: 'wrap',
    },
    acceptButton: {
        flex: 1,
        minWidth: 112,
        height: 36,
        backgroundColor: '#48BB78',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    declineButton: {
        flex: 1,
        minWidth: 112,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.65,
    },
    declineButtonText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        gap: 4,
        marginTop: 8,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
    deleteButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        padding: 4,
    },
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
