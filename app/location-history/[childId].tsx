import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Image,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { geoapifyApiKey } from '@/constants/config';
import { useChildLocation, useChildLocationHistory, LocationData } from '@/hooks/useLocation';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';

// Skeleton shimmer component
const SkeletonBox = ({ width, height, style, theme }: { width: number | string; height: number; style?: any; theme: any }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);
    
    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });
    
    return (
        <Animated.View 
            style={[
                { width, height, backgroundColor: theme.gray[200], borderRadius: 8, opacity },
                style
            ]} 
        />
    );
};

// Skeleton Current Location Card
const SkeletonCurrentCard = ({ theme }: { theme: any }) => (
    <View style={[styles.currentCard, { backgroundColor: theme.csk[50], borderColor: theme.csk[200] }]}>
        <View style={styles.currentHeader}>
            <SkeletonBox width={120} height={24} style={{ borderRadius: 12 }} theme={theme} />
            <SkeletonBox width={80} height={16} theme={theme} />
        </View>
        <SkeletonBox width="100%" height={120} style={{ borderRadius: 12, marginBottom: 12 }} theme={theme} />
        <View style={styles.currentLocation}>
            <SkeletonBox width={20} height={20} style={{ borderRadius: 4 }} theme={theme} />
            <SkeletonBox width="80%" height={16} style={{ marginLeft: 8 }} theme={theme} />
        </View>
    </View>
);

// Skeleton History Item
const SkeletonHistoryItem = ({ theme }: { theme: any }) => (
    <View style={styles.historyItem}>
        <View style={styles.timeline}>
            <SkeletonBox width={10} height={10} style={{ borderRadius: 5, marginTop: 4 }} theme={theme} />
            <View style={[styles.timelineLine, { backgroundColor: theme.gray[200] }]} />
        </View>
        <View style={[styles.historyContent, { backgroundColor: theme.surface }]}>
            <View style={styles.historyHeader}>
                <SkeletonBox width={60} height={14} theme={theme} />
                <SkeletonBox width={80} height={12} theme={theme} />
            </View>
            <SkeletonBox width="100%" height={80} style={{ borderRadius: 8, marginBottom: 8 }} theme={theme} />
            <View style={styles.historyLocation}>
                <SkeletonBox width={14} height={14} style={{ borderRadius: 4 }} theme={theme} />
                <SkeletonBox width="70%" height={13} style={{ marginLeft: 6 }} theme={theme} />
            </View>
        </View>
    </View>
);

// Format timestamp
const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
        date: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
    };
};

// Generate static map URL
const getMapUrl = (latitude: number, longitude: number) => {
    const url = `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=400&height=120&center=lonlat:${longitude},${latitude}&zoom=16&marker=lonlat:${longitude},${latitude};color:%2322c55e;size:medium&apiKey=${geoapifyApiKey}`;
    return url;
};

// Location History Item
const HistoryItem = ({ item, isFirst, t, theme }: { item: LocationData; isFirst: boolean; t: (key: string, params?: any) => string; theme: any }) => {
    const { date, time } = formatDateTime(item.timestamp);
    
    return (
        <View style={styles.historyItem}>
            {/* Timeline */}
            <View style={styles.timeline}>
                <View style={[
                    styles.timelineDot,
                    { backgroundColor: isFirst ? theme.primary : theme.gray[300] }
                ]} />
                <View style={[styles.timelineLine, { backgroundColor: theme.gray[200] }]} />
            </View>
            
            {/* Content */}
            <View style={[styles.historyContent, { backgroundColor: theme.surface }]}>
                <View style={styles.historyHeader}>
                    <Text style={[styles.historyTime, { color: theme.text }]}>{time}</Text>
                    <Text style={[styles.historyDate, { color: theme.gray[500] }]}>{date}</Text>
                </View>
                
                {/* Mini Map */}
                <Image 
                    source={{ uri: getMapUrl(item.latitude, item.longitude) }}
                    style={[styles.historyMap, { backgroundColor: theme.gray[200] }]}
                    resizeMode="cover"
                />
                
                <View style={styles.historyLocation}>
                    <Ionicons name="location" size={14} color={theme.primary} />
                    <Text style={[styles.historyAddress, { color: theme.gray[700] }]} numberOfLines={2}>
                        {item.address || t('location.addressUnavailable')}
                    </Text>
                </View>
                
                {item.accuracy && (
                    <View style={styles.historyAccuracy}>
                        <Ionicons name="radio-outline" size={12} color={theme.gray[400]} />
                        <Text style={[styles.historyAccuracyText, { color: theme.gray[400] }]}>
                            {t('location.withinMeters', { meters: Math.round(item.accuracy) })}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default function LocationHistoryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { childId } = useLocalSearchParams<{ childId: string }>();
    const { t } = useTranslation();
    const { theme, isDark } = useTheme();
    
    const [refreshing, setRefreshing] = useState(false);
    
    // Queries
    const { 
        data: childData, 
        isLoading: isLoadingCurrent,
        refetch: refetchCurrent,
    } = useChildLocation(childId || '');
    
    const { 
        data: historyData,
        isLoading: isLoadingHistory,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch: refetchHistory,
    } = useChildLocationHistory(childId || '', 10);
    
    // Flatten paginated data
    const historyItems = useMemo(() => {
        if (!historyData?.pages) return [];
        return historyData.pages.flatMap(page => page.data);
    }, [historyData]);
    
    const childInfo = childData?.child || historyData?.pages?.[0]?.child;
    const currentLocation = childData?.location;
    
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchCurrent(), refetchHistory()]);
        setRefreshing(false);
    }, [refetchCurrent, refetchHistory]);
    
    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    
    const isLoading = isLoadingCurrent || isLoadingHistory;
    
    const renderItem = useCallback(({ item, index }: { item: LocationData; index: number }) => (
        <HistoryItem item={item} isFirst={index === 0} t={t} theme={theme} />
    ), [t, theme]);
    
    const keyExtractor = useCallback((item: LocationData, index: number) => 
        `${item.id || item.timestamp}-${index}`, []);
    
    const ListHeader = () => (
        <>
            {/* Current Location Card */}
            {currentLocation && (
                <View style={[styles.currentCard, { backgroundColor: theme.csk[50], borderColor: theme.csk[200] }]}>
                    <View style={styles.currentHeader}>
                        <View style={[styles.currentBadge, { backgroundColor: theme.primary }]}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>{t('location.currentLocation')}</Text>
                        </View>
                        {currentLocation.accuracy && (
                            <Text style={[styles.currentAccuracy, { color: theme.csk[600] }]}>
                                {t('location.withinMeters', { meters: Math.round(currentLocation.accuracy) })}
                            </Text>
                        )}
                    </View>
                    
                    {/* Map Preview */}
                    <Image 
                        source={{ uri: getMapUrl(currentLocation.latitude, currentLocation.longitude) }}
                        style={[styles.currentMap, { backgroundColor: theme.gray[200] }]}
                        resizeMode="cover"
                    />
                    
                    <View style={styles.currentLocation}>
                        <Ionicons name="location" size={20} color={theme.primary} />
                        <Text style={[styles.currentAddress, { color: isDark ? theme.gray[100] : theme.gray[800] }]} numberOfLines={2}>
                            {currentLocation.address || t('location.addressUnavailable')}
                        </Text>
                    </View>
                </View>
            )}
            
            {/* History Header */}
            <View style={styles.historyTitleRow}>
                <Text style={[styles.historyTitle, { color: theme.text }]}>{t('location.locationHistory')}</Text>
                {historyData?.pages?.[0]?.pagination && (
                    <Text style={[styles.historyCount, { color: theme.gray[500] }]}>
                        {t('location.locationsCount', { count: historyData.pages[0].pagination.total })}
                    </Text>
                )}
            </View>
        </>
    );
    
    const ListFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };
    
    const ListEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={theme.gray[300]} />
            <Text style={[styles.emptyText, { color: theme.gray[500] }]}>{t('location.noLocationHistory')}</Text>
            <Text style={[styles.emptySubtext, { color: theme.gray[400] }]}>
                {t('location.childHistoryWillAppear')}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {childInfo?.name || childInfo?.username || t('location.locationHistory')}
                    </Text>
                    {childInfo && (
                        <Text style={[styles.headerSubtitle, { color: theme.gray[500] }]}>@{childInfo.username}</Text>
                    )}
                </View>
                <View style={styles.placeholder} />
            </View>
            
            {isLoading && historyItems.length === 0 ? (
                <View style={styles.listContent}>
                    <SkeletonCurrentCard theme={theme} />
                    <View style={styles.historyTitleRow}>
                        <SkeletonBox width={120} height={16} theme={theme} />
                        <SkeletonBox width={80} height={12} theme={theme} />
                    </View>
                    <SkeletonHistoryItem theme={theme} />
                    <SkeletonHistoryItem theme={theme} />
                    <SkeletonHistoryItem theme={theme} />
                </View>
            ) : (
                <FlatList
                    data={historyItems}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    ListHeaderComponent={ListHeader}
                    ListFooterComponent={ListFooter}
                    ListEmptyComponent={ListEmpty}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
    },
    headerSubtitle: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    placeholder: {
        width: 40,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    currentCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    currentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        marginRight: 6,
    },
    liveText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#FFFFFF',
    },
    currentAccuracy: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    currentMap: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
    },
    currentLocation: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    currentAddress: {
        flex: 1,
        fontSize: 15,
        fontFamily: Fonts.medium,
        marginLeft: 8,
        lineHeight: 22,
    },
    historyTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    historyTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    historyCount: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    historyItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    timeline: {
        width: 24,
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        marginVertical: 4,
    },
    historyContent: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
        marginLeft: 8,
        marginBottom: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyTime: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    historyDate: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    historyMap: {
        width: '100%',
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
    },
    historyLocation: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    historyAddress: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginLeft: 6,
        lineHeight: 18,
    },
    historyAccuracy: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    historyAccuracyText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        marginLeft: 4,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 4,
        textAlign: 'center',
    },
});
