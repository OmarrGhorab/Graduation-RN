import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    Pressable,
    ActivityIndicator,
    Platform,
    ToastAndroid,
} from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiNotification } from '@/services/NotificationService';
import { NotificationModalProps } from './types';
import { useNotificationStyles } from './useNotificationStyles';
import NotificationItem from './NotificationItem';

export default function NotificationModal({
    visible,
    onClose,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    loading = false,
    onRefresh,
    onNotificationPress,
    onLoadMore,
    hasNextPage,
    isFetchingNextPage,
    onDeleteNotification,
}: NotificationModalProps) {
    const insets = useSafeAreaInsets();
    const { styles, colors } = useNotificationStyles();
    const unreadCount = notifications.filter((n) => !n.read).length;
    
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
    }, [toastOpacity, toastTranslateY]);

    const toastAnimatedStyle = useAnimatedStyle(() => ({
        opacity: toastOpacity.value,
        transform: [{ translateY: toastTranslateY.value }],
    }));

    const handleNotificationPress = useCallback((item: ApiNotification) => {
        if (!item.read) {
            onMarkAsRead(item.id);
        }
        if (onNotificationPress) {
            onNotificationPress(item);
            onClose();
        }
    }, [onMarkAsRead, onNotificationPress, onClose]);

    const renderNotification = useCallback(({ item }: { item: ApiNotification }) => (
        <NotificationItem
            item={item}
            onPress={handleNotificationPress}
            onDelete={onDeleteNotification}
        />
    ), [handleNotificationPress, onDeleteNotification]);

    const renderFooter = useCallback(() => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.csk[500]} />
            </View>
        );
    }, [isFetchingNextPage, styles.footerLoader, colors.csk]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && onLoadMore) {
            onLoadMore();
        }
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    const keyExtractor = useCallback((item: ApiNotification) => item.id, []);

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
                                <Ionicons name="close" size={24} color={colors.gray[700]} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator size="large" color={colors.csk[500]} />
                            <Text style={styles.loadingText}>Loading notifications...</Text>
                        </View>
                    ) : notifications.length > 0 ? (
                        <FlatList
                            data={notifications}
                            renderItem={renderNotification}
                            keyExtractor={keyExtractor}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            onRefresh={onRefresh}
                            refreshing={loading}
                            onEndReached={handleEndReached}
                            onEndReachedThreshold={0.3}
                            ListFooterComponent={renderFooter}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={64} color={colors.gray[300]} />
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

// Re-export types for convenience
export type { NotificationModalProps } from './types';
