import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Pressable,
    Image,
    ActivityIndicator,
    Platform,
    ToastAndroid,
} from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, cskColors, grayColors } from '@/constants/theme';
import { ApiNotification, respondToParentLinkRequest } from '@/services/NotificationService';

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
    notifications: ApiNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    loading?: boolean;
    onRefresh?: () => void;
    onParentLinkRespond?: (notificationId: string, requestId: string, action: 'accept' | 'decline') => void;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'parent_link_request':
            return { name: 'people', color: cskColors[500] };
        case 'course':
            return { name: 'book', color: cskColors[500] };
        case 'assignment':
            return { name: 'document-text', color: '#FFB547' };
        case 'success':
            return { name: 'checkmark-circle', color: cskColors[500] };
        case 'warning':
            return { name: 'warning', color: '#FFB547' };
        default:
            return { name: 'notifications', color: '#3B82F6' };
    }
};

const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
};

export default function NotificationModal({
    visible,
    onClose,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    loading = false,
    onRefresh,
    onParentLinkRespond,
}: NotificationModalProps) {
    const insets = useSafeAreaInsets();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const [respondingIds, setRespondingIds] = useState<Set<string>>(new Set());
    
    // Toast state for iOS
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const toastOpacity = useSharedValue(0);
    const toastTranslateY = useSharedValue(-20);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            setToastMessage(message);
            setToastType(type);
            toastOpacity.value = withSequence(
                withTiming(1, { duration: 200 }),
                withTiming(1, { duration: 2000 }),
                withTiming(0, { duration: 200 })
            );
            toastTranslateY.value = withSequence(
                withTiming(0, { duration: 200 }),
                withTiming(0, { duration: 2000 }),
                withTiming(-20, { duration: 200 })
            );
        }
    }, []);

    const toastAnimatedStyle = useAnimatedStyle(() => ({
        opacity: toastOpacity.value,
        transform: [{ translateY: toastTranslateY.value }],
    }));

    const handleParentLinkAction = async (
        notificationId: string,
        requestId: string,
        action: 'accept' | 'decline'
    ) => {
        setRespondingIds((prev) => new Set(prev).add(notificationId));
        
        try {
            await respondToParentLinkRequest(requestId, action);
            showToast(
                action === 'accept' 
                    ? 'Parent link request accepted!' 
                    : 'Parent link request declined.',
                'success'
            );
            onMarkAsRead(notificationId);
            onParentLinkRespond?.(notificationId, requestId, action);
        } catch (error: any) {
            showToast(error.message || 'Failed to respond to request', 'error');
        } finally {
            setRespondingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        }
    };

    const renderNotification = ({ item }: { item: ApiNotification }) => {
        const icon = getNotificationIcon(item.type);
        const profileImg = item.data.child?.profileImg;
        const title = item.data.title || item.type.replace(/_/g, ' ');
        const body = item.data.body;
        const time = formatTimeAgo(item.createdAt);
        const isParentLinkRequest = item.type === 'parent_link_request';
        const requestId = item.data.requestId;
        const isResponding = respondingIds.has(item.id);

        return (
            <Pressable
                style={[
                    styles.notificationItem,
                    !item.read && styles.unreadItem,
                ]}
                onPress={() => !item.read && !isParentLinkRequest && onMarkAsRead(item.id)}
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
                    
                    {/* Accept/Decline buttons for parent_link_request */}
                    {isParentLinkRequest && requestId && !item.read && (
                        <View style={styles.actionButtonsContainer}>
                            {isResponding ? (
                                <ActivityIndicator size="small" color={cskColors[500]} />
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.acceptButton]}
                                        onPress={() => handleParentLinkAction(item.id, requestId, 'accept')}
                                    >
                                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        <Text style={styles.acceptButtonText}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.declineButton]}
                                        onPress={() => handleParentLinkAction(item.id, requestId, 'decline')}
                                    >
                                        <Ionicons name="close" size={16} color={grayColors[700]} />
                                        <Text style={styles.declineButtonText}>Decline</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}

                    <View style={styles.notificationFooter}>
                        <View style={styles.typeTag}>
                            <Text style={styles.typeText}>
                                {item.type.replace(/_/g, ' ')}
                            </Text>
                        </View>
                        <Text style={styles.notificationTime}>{time}</Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Toast for iOS */}
                    {Platform.OS === 'ios' && (
                        <Animated.View 
                            style={[
                                styles.toast, 
                                toastType === 'error' ? styles.toastError : styles.toastSuccess,
                                toastAnimatedStyle
                            ]}
                            pointerEvents="none"
                        >
                            <Ionicons 
                                name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                                size={18} 
                                color="#FFFFFF" 
                            />
                            <Text style={styles.toastText}>{toastMessage}</Text>
                        </Animated.View>
                    )}

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerTitle}>Notifications</Text>
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.headerRight}>
                            {unreadCount > 0 && (
                                <TouchableOpacity
                                    onPress={onMarkAllAsRead}
                                    style={styles.markAllButton}
                                >
                                    <Text style={styles.markAllText}>Mark all read</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={grayColors[700]} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Loading State */}
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="large" color={cskColors[500]} />
                            <Text style={styles.loadingText}>Loading notifications...</Text>
                        </View>
                    ) : notifications.length > 0 ? (
                        <FlatList
                            data={notifications}
                            renderItem={renderNotification}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            onRefresh={onRefresh}
                            refreshing={loading}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={64} color={grayColors[300]} />
                            <Text style={styles.emptyTitle}>No notifications</Text>
                            <Text style={styles.emptyMessage}>
                                You're all caught up! Check back later.
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        minHeight: '50%',
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: grayColors[300],
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: grayColors[900],
    },
    badge: {
        backgroundColor: cskColors[500],
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markAllButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: cskColors[50],
        borderRadius: 8,
    },
    markAllText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: cskColors[500],
    },
    closeButton: {
        padding: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        marginVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: grayColors[100],
    },
    unreadItem: {
        backgroundColor: cskColors[50],
        borderColor: cskColors[100],
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: cskColors[500],
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        marginBottom: 8,
        lineHeight: 20,
    },
    notificationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    typeTag: {
        backgroundColor: grayColors[100],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: grayColors[600],
        textTransform: 'capitalize',
    },
    notificationTime: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[400],
    },
    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 12,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: grayColors[700],
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        marginBottom: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 4,
    },
    acceptButton: {
        backgroundColor: cskColors[500],
    },
    declineButton: {
        backgroundColor: grayColors[100],
        borderWidth: 1,
        borderColor: grayColors[200],
    },
    acceptButtonText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    declineButtonText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: grayColors[700],
    },
    toast: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    toastSuccess: {
        backgroundColor: cskColors[500],
    },
    toastError: {
        backgroundColor: '#EF4444',
    },
    toastText: {
        flex: 1,
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: '#FFFFFF',
    },
});
