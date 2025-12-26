import React, { memo } from 'react';
import { View, Text, Pressable, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import { NotificationItemProps } from './types';
import { getNotificationIcon, formatTimeAgo } from './utils';
import { useNotificationStyles } from './useNotificationStyles';

const NotificationItem = memo(({ item, onPress, onDelete }: NotificationItemProps) => {
    const { styles, colors, isDark } = useNotificationStyles();
    const { t } = useTranslation();
    
    const icon = getNotificationIcon(item.type, isDark);
    const profileImg = item.data.child?.profileImg;
    const childName = item.data.child?.name || t('notifications.someone');
    const time = formatTimeAgo(item.createdAt, t);
    const isParentLinkRequest = item.type === 'parent_link_request';
    
    // Check if this request has been responded to
    const status = item.data.status;
    const isAccepted = status === 'ACCEPTED';
    const isDeclined = status === 'DECLINED';
    const hasResponded = isAccepted || isDeclined;

    // Dynamic title and body based on status
    let title = item.data.title || item.type.replace(/_/g, ' ');
    let body = item.data.body;
    
    if (isParentLinkRequest && hasResponded) {
        if (isAccepted) {
            title = t('notifications.linkRequestAccepted');
            body = t('notifications.acceptedRequest', { name: childName });
        } else {
            title = t('notifications.linkRequestDeclined');
            body = t('notifications.declinedRequest', { name: childName });
        }
    }

    return (
        <Pressable
            style={[styles.notificationItem, !item.read && styles.unreadItem]}
            onPress={() => onPress(item)}
        >
            {/* Profile Image or Icon */}
            <View style={styles.avatarContainer}>
                {profileImg ? (
                    <Image source={{ uri: profileImg }} style={styles.avatar} />
                ) : (
                    <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                        <Ionicons name={icon.name as any} size={24} color={icon.color} />
                    </View>
                )}
            </View>

            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                        {title}
                    </Text>
                    {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                    {body}
                </Text>
                
                {/* Status badges */}
                {isParentLinkRequest && hasResponded && (
                    <View style={[
                        styles.statusBadge,
                        isAccepted ? styles.statusAccepted : styles.statusDeclined
                    ]}>
                        <Ionicons 
                            name={isAccepted ? 'checkmark-circle' : 'close-circle'} 
                            size={14} 
                            color={isAccepted ? colors.statusAcceptedText : colors.statusDeclinedText} 
                        />
                        <Text style={[
                            styles.statusText,
                            isAccepted ? styles.statusTextAccepted : styles.statusTextDeclined
                        ]}>
                            {isAccepted ? t('notifications.accepted') : t('notifications.declined')}
                        </Text>
                    </View>
                )}
                
                {isParentLinkRequest && !hasResponded && (
                    <View style={[styles.statusBadge, styles.statusPending]}>
                        <Ionicons name="time-outline" size={14} color={colors.statusPendingText} />
                        <Text style={[styles.statusText, styles.statusTextPending]}>
                            {t('notifications.pending')}
                        </Text>
                    </View>
                )}

                <View style={styles.notificationFooter}>
                    <View style={styles.typeTag}>
                        <Text style={styles.typeText}>
                            {item.type.replace(/_/g, ' ')}
                        </Text>
                    </View>
                    <View style={styles.footerRight}>
                        <Text style={styles.notificationTime}>{time}</Text>
                        {onDelete && (
                            <TouchableOpacity
                                onPress={() => onDelete(item.id)}
                                style={styles.deleteButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="trash-outline" size={16} color={colors.gray[400]} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
    );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
