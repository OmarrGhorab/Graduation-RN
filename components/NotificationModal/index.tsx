import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiNotification } from '@/services/NotificationService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationItem from './NotificationItem';
import { NotificationModalProps } from './types';
import { useNotificationStyles } from './useNotificationStyles';

// Match backend categories
type FilterType = 'all' | 'chat' | 'security' | 'parent_link' | 'unlink';

const FILTER_OPTIONS: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'chat', label: 'Chats', icon: 'chatbubble' },
    { key: 'parent_link', label: 'Requests', icon: 'person-add' },
    { key: 'security', label: 'Security', icon: 'shield-checkmark' },
    { key: 'unlink', label: 'Unlink', icon: 'person-remove' },
];

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
    const { styles, colors, isDark } = useNotificationStyles();
    const { t } = useTranslation();
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Filter notifications based on active filter (matching backend categories)
    // Also ensures uniqueness by ID to prevent duplicate keys in FlatList
    const filteredNotifications = useMemo(() => {
        // Enforce uniqueness by ID
        const uniqueNotifications = Array.from(
            new Map(notifications.map(n => [n.id, n])).values()
        );

        if (activeFilter === 'all') return uniqueNotifications;

        return uniqueNotifications.filter((n) => {
            const type = n.type.toLowerCase();
            switch (activeFilter) {
                case 'chat':
                    return type.includes('chat') || type.includes('message');
                case 'security':
                    return type.includes('security');
                case 'parent_link':
                    return type.includes('parent_link');
                case 'unlink':
                    return type.includes('unlink');
                default:
                    return true;
            }
        });
    }, [notifications, activeFilter]);

    // Group notifications by read status
    const groupedNotifications = useMemo(() => {
        const newItems: ApiNotification[] = [];
        const earlierItems: ApiNotification[] = [];

        filteredNotifications.forEach((n) => {
            if (!n.read) {
                newItems.push(n);
            } else {
                earlierItems.push(n);
            }
        });

        return { newItems, earlierItems };
    }, [filteredNotifications]);

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
            <View style={localStyles.footerLoader}>
                <ActivityIndicator size="small" color="#48BB78" />
            </View>
        );
    }, [isFetchingNextPage]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage && onLoadMore) {
            onLoadMore();
        }
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    const keyExtractor = useCallback((item: ApiNotification) => item.id, []);

    const renderSectionHeader = (title: string, count?: number) => (
        <View style={localStyles.sectionHeader}>
            <Text style={[localStyles.sectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {title}
            </Text>
            {count !== undefined && count > 0 && (
                <View style={[localStyles.sectionBadge, { backgroundColor: isDark ? 'rgba(72, 187, 120, 0.2)' : 'rgba(72, 187, 120, 0.15)' }]}>
                    <Text style={localStyles.sectionBadgeText}>{count}</Text>
                </View>
            )}
        </View>
    );

    // Get category-specific info for empty state
    const getCategoryInfo = () => {
        switch (activeFilter) {
            case 'chat':
                return { icon: 'chatbubble-outline', title: 'No chat notifications', message: 'When you receive new messages, they will appear here.', buttonText: 'Go to Chats' };
            case 'security':
                return { icon: 'shield-checkmark-outline', title: 'No security alerts', message: 'Your account is secure. Security notifications will appear here.', buttonText: 'View Security' };
            case 'parent_link':
                return { icon: 'people-outline', title: 'No link requests', message: 'Parent and student link requests will appear here.', buttonText: 'View Requests' };
            case 'unlink':
                return { icon: 'person-remove-outline', title: 'No unlink requests', message: 'Unlink requests from parents or students will appear here.', buttonText: 'View Unlink' };
            default:
                return { icon: 'notifications-off-outline', title: 'No notifications yet', message: 'Stay tuned! Updates, grades, and class announcements will appear here.', buttonText: 'Go to Home' };
        }
    };

    const categoryInfo = getCategoryInfo();

    // Skeleton loading component
    const renderSkeletonItem = (delay: number = 0) => (
        <View style={[
            localStyles.skeletonCard,
            { backgroundColor: isDark ? '#1E2A24' : '#FFFFFF' }
        ]}>
            <View style={[localStyles.skeletonAvatar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
            <View style={localStyles.skeletonContent}>
                <View style={localStyles.skeletonHeader}>
                    <View style={[localStyles.skeletonTitle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
                    <View style={[localStyles.skeletonTime, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
                </View>
                <View style={[localStyles.skeletonLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
                <View style={[localStyles.skeletonLineShort, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
            </View>
        </View>
    );

    const renderListContent = () => {
        if (loading) {
            return (
                <View style={localStyles.skeletonContainer}>
                    {renderSkeletonItem(0)}
                    {renderSkeletonItem(75)}
                    {renderSkeletonItem(150)}
                    {renderSkeletonItem(225)}
                </View>
            );
        }

        if (filteredNotifications.length === 0) {
            return (
                <View style={localStyles.emptyState}>
                    {/* Decorative glow circle */}
                    <View style={localStyles.emptyIconWrapper}>
                        <View style={[localStyles.emptyGlow, { backgroundColor: 'rgba(72, 187, 120, 0.2)' }]} />
                        <View style={[localStyles.emptyIconCircle, { backgroundColor: 'rgba(72, 187, 120, 0.3)', borderColor: 'rgba(72, 187, 120, 0.4)' }]}>
                            <Ionicons name={categoryInfo.icon as any} size={48} color={isDark ? '#48BB78' : '#0D1B15'} />
                        </View>
                    </View>

                    <Text style={[localStyles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0D1B15' }]}>
                        {categoryInfo.title}
                    </Text>
                    <Text style={[localStyles.emptyMessage, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        {categoryInfo.message}
                    </Text>

                    <TouchableOpacity
                        style={localStyles.emptyButton}
                        onPress={onClose}
                    >
                        <Text style={localStyles.emptyButtonText}>{categoryInfo.buttonText}</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Combine new and earlier items with section headers
        const listData: { type: 'header' | 'item'; data: ApiNotification | string; count?: number }[] = [];

        // Only add "New" section if there are unread items
        if (groupedNotifications.newItems.length > 0) {
            listData.push({ type: 'header', data: 'New', count: groupedNotifications.newItems.length });
            groupedNotifications.newItems.forEach(item => {
                listData.push({ type: 'item', data: item });
            });
        }

        // Only add "Earlier" section if there are read items
        if (groupedNotifications.earlierItems.length > 0) {
            // Only add header if we also have "New" items, otherwise it's the only section
            if (groupedNotifications.newItems.length > 0) {
                listData.push({ type: 'header', data: 'Earlier' });
            }
            groupedNotifications.earlierItems.forEach(item => {
                listData.push({ type: 'item', data: item });
            });
        }

        return (
            <FlatList
                data={listData}
                renderItem={({ item }) => {
                    if (item.type === 'header') {
                        return renderSectionHeader(item.data as string, item.count);
                    }
                    return (
                        <NotificationItem
                            item={item.data as ApiNotification}
                            onPress={handleNotificationPress}
                            onDelete={onDeleteNotification}
                        />
                    );
                }}
                keyExtractor={(item, index) =>
                    item.type === 'header' ? `header-${item.data}` : (item.data as ApiNotification).id
                }
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20, flexGrow: 0 }}
                showsVerticalScrollIndicator={false}
                onRefresh={onRefresh}
                refreshing={loading}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.3}
                ListFooterComponent={renderFooter}
            />
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={[
                localStyles.container,
                {
                    backgroundColor: isDark ? '#10221A' : '#F6F8F7',
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                }
            ]}>
                {/* Toast for iOS */}
                {Platform.OS === 'ios' && (
                    <Animated.View
                        style={[
                            styles.toast,
                            toastType === 'error' ? styles.toastError : styles.toastSuccess,
                            toastAnimatedStyle,
                            { zIndex: 1000 }
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
                <View style={[localStyles.header, { zIndex: 10, backgroundColor: isDark ? '#10221A' : '#F6F8F7' }]}>
                    <Text style={[localStyles.headerTitle, { color: isDark ? '#FFFFFF' : '#0D1B15' }]}>
                        Notifications
                    </Text>
                    <View style={localStyles.headerRight}>
                        {unreadCount > 0 && (
                            <TouchableOpacity onPress={onMarkAllAsRead} style={localStyles.markAllButton}>
                                <Text style={localStyles.markAllText}>Mark all as read</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={onClose} style={localStyles.closeButton}>
                            <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#0D1B15'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Chips */}
                <View style={[localStyles.filterWrapper, { zIndex: 10, backgroundColor: isDark ? '#10221A' : '#F6F8F7' }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={localStyles.filterContainer}
                    >
                        {FILTER_OPTIONS.map((filter) => (
                            <TouchableOpacity
                                key={filter.key}
                                style={[
                                    localStyles.filterChip,
                                    activeFilter === filter.key
                                        ? localStyles.filterChipActive
                                        : { backgroundColor: isDark ? '#23362F' : '#E9EBED' }
                                ]}
                                onPress={() => setActiveFilter(filter.key)}
                            >
                                <Text style={[
                                    localStyles.filterChipText,
                                    activeFilter === filter.key
                                        ? localStyles.filterChipTextActive
                                        : { color: isDark ? '#9CA3AF' : '#6B7280' }
                                ]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content - FlatList directly */}
                {renderListContent()}
            </View>
        </Modal>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        letterSpacing: -0.5,
    },
    headerBadge: {
        backgroundColor: '#48BB78',
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: Fonts.bold,
        textAlign: 'center',
    },
    markAllButton: {
        paddingVertical: 6,
        paddingHorizontal: 2,
    },
    markAllText: {
        color: '#48BB78',
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterWrapper: {
        // Wrapper for filter chips
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
    filterChip: {
        height: 36,
        paddingHorizontal: 18,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#48BB78',
    },
    filterChipText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    sectionBadgeText: {
        color: '#48BB78',
        fontSize: 11,
        fontFamily: Fonts.bold,
    },
    loadingState: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingVertical: 60,
        paddingTop: 80,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 12,
    },
    // Skeleton styles
    skeletonContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 16,
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    skeletonAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    skeletonContent: {
        flex: 1,
        gap: 12,
        paddingVertical: 4,
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    },
    skeletonTitle: {
        height: 16,
        borderRadius: 4,
        width: '70%',
    },
    skeletonTime: {
        height: 12,
        borderRadius: 4,
        width: 48,
    },
    skeletonLine: {
        height: 12,
        borderRadius: 4,
        width: '100%',
    },
    skeletonLineShort: {
        height: 12,
        borderRadius: 4,
        width: '65%',
    },
    // Empty state styles  
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 80,
    },
    emptyIconWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    emptyGlow: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    emptyTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyMessage: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
        marginBottom: 32,
    },
    emptyButton: {
        width: '100%',
        maxWidth: 240,
        height: 48,
        backgroundColor: '#48BB78',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#48BB78',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});

// Re-export types for convenience
export type { NotificationModalProps } from './types';

