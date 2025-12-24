import React, { useState, useCallback, useMemo } from 'react';
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
    Linking,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { cskColors, grayColors, Fonts } from '@/constants/theme';
import { GEOAPIFY_API_KEY } from '@/constants/config';
import { useAuthStore } from '@/libs/auth';
import { useMyLocation, useMyLocationHistory, LocationData } from '@/hooks/useLocation';

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
    return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=400&height=120&center=lonlat:${longitude},${latitude}&zoom=16&marker=lonlat:${longitude},${latitude};color:%2322c55e;size:medium&apiKey=${GEOAPIFY_API_KEY}`;
};

// Open in maps
const openInMaps = (latitude: number, longitude: number, label: string) => {
    const encodedLabel = encodeURIComponent(label);
    const googleMapsUrl = Platform.select({
        ios: `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=17`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    });
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    
    Linking.canOpenURL(googleMapsUrl || '').then((supported) => {
        if (supported) {
            Linking.openURL(googleMapsUrl || '');
        } else {
            Linking.openURL(webUrl);
        }
    }).catch(() => Linking.openURL(webUrl));
};

// History Item Component
const HistoryItem = ({ item, isFirst }: { item: LocationData; isFirst: boolean }) => {
    const { date, time } = formatDateTime(item.timestamp);
    
    return (
        <View style={styles.historyItem}>
            <View style={styles.timeline}>
                <View style={[styles.timelineDot, isFirst && styles.timelineDotActive]} />
                <View style={styles.timelineLine} />
            </View>
            
            <TouchableOpacity 
                style={styles.historyContent}
                onPress={() => openInMaps(item.latitude, item.longitude, item.address || 'Location')}
                activeOpacity={0.7}
            >
                <View style={styles.historyHeader}>
                    <Text style={styles.historyTime}>{time}</Text>
                    <Text style={styles.historyDate}>{date}</Text>
                </View>
                
                <Image 
                    source={{ uri: getMapUrl(item.latitude, item.longitude) }}
                    style={styles.historyMap}
                    resizeMode="cover"
                />
                
                <View style={styles.historyLocation}>
                    <Ionicons name="location" size={14} color={cskColors[500]} />
                    <Text style={styles.historyAddress} numberOfLines={2}>
                        {item.address || 'Address unavailable'}
                    </Text>
                </View>
                
                {item.accuracy && (
                    <View style={styles.historyAccuracy}>
                        <Ionicons name="radio-outline" size={12} color={grayColors[400]} />
                        <Text style={styles.historyAccuracyText}>
                            Within {Math.round(item.accuracy)}m
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default function MyLocationHistoryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();
    
    const [refreshing, setRefreshing] = useState(false);
    
    const { 
        data: currentLocation, 
        refetch: refetchCurrent,
    } = useMyLocation();
    
    const { 
        data: historyData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch: refetchHistory,
    } = useMyLocationHistory(10);
    
    const historyItems = useMemo(() => {
        if (!historyData?.pages) return [];
        return historyData.pages.flatMap(page => page.data);
    }, [historyData]);
    
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
    
    const renderItem = useCallback(({ item, index }: { item: LocationData; index: number }) => (
        <HistoryItem item={item} isFirst={index === 0} />
    ), []);
    
    const keyExtractor = useCallback((item: LocationData, index: number) => 
        `${item.id || item.timestamp}-${index}`, []);
    
    const ListHeader = () => (
        <>
            {/* Current Location */}
            {currentLocation && (
                <TouchableOpacity 
                    style={styles.currentCard}
                    onPress={() => openInMaps(currentLocation.latitude, currentLocation.longitude, currentLocation.address || 'My Location')}
                    activeOpacity={0.8}
                >
                    <View style={styles.currentHeader}>
                        <View style={styles.currentBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>Current Location</Text>
                        </View>
                        {currentLocation.accuracy && (
                            <Text style={styles.currentAccuracy}>
                                Within {Math.round(currentLocation.accuracy)}m
                            </Text>
                        )}
                    </View>
                    
                    <Image 
                        source={{ uri: getMapUrl(currentLocation.latitude, currentLocation.longitude) }}
                        style={styles.currentMap}
                        resizeMode="cover"
                    />
                    
                    <View style={styles.currentLocation}>
                        <Ionicons name="location" size={20} color={cskColors[500]} />
                        <Text style={styles.currentAddress} numberOfLines={2}>
                            {currentLocation.address || 'Address unavailable'}
                        </Text>
                    </View>
                    
                    <View style={styles.openInMapsRow}>
                        <Ionicons name="open-outline" size={14} color={cskColors[500]} />
                        <Text style={styles.openInMapsText}>Tap to open in Maps</Text>
                    </View>
                </TouchableOpacity>
            )}
            
            {/* History Header */}
            <View style={styles.historyTitleRow}>
                <Text style={styles.historyTitle}>My Location History</Text>
                {historyData?.pages?.[0]?.pagination && (
                    <Text style={styles.historyCount}>
                        {historyData.pages[0].pagination.total} locations
                    </Text>
                )}
            </View>
        </>
    );
    
    const ListFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={cskColors[500]} />
            </View>
        );
    };
    
    const ListEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={grayColors[300]} />
            <Text style={styles.emptyText}>No location history</Text>
            <Text style={styles.emptySubtext}>
                Your location history will appear here
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={grayColors[900]} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{user?.name || 'My Location'}</Text>
                    <Text style={styles.headerSubtitle}>Location History</Text>
                </View>
                <View style={styles.placeholder} />
            </View>
            
            {isLoading && historyItems.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={cskColors[500]} />
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
                            colors={[cskColors[500]]}
                            tintColor={cskColors[500]}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontFamily: Fonts.semiBold, color: grayColors[900] },
    headerSubtitle: { fontSize: 12, fontFamily: Fonts.regular, color: grayColors[500] },
    placeholder: { width: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 32 },
    currentCard: {
        backgroundColor: cskColors[50],
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: cskColors[200],
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
        backgroundColor: cskColors[500],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 6 },
    liveText: { fontSize: 12, fontFamily: Fonts.medium, color: '#FFFFFF' },
    currentAccuracy: { fontSize: 12, fontFamily: Fonts.medium, color: cskColors[600] },
    currentMap: { width: '100%', height: 150, borderRadius: 12, marginBottom: 12, backgroundColor: grayColors[200] },
    currentLocation: { flexDirection: 'row', alignItems: 'flex-start' },
    currentAddress: { flex: 1, fontSize: 15, fontFamily: Fonts.medium, color: grayColors[800], marginLeft: 8, lineHeight: 22 },
    openInMapsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: cskColors[200] },
    openInMapsText: { fontSize: 13, fontFamily: Fonts.medium, color: cskColors[500], marginLeft: 6 },
    historyTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    historyTitle: { fontSize: 16, fontFamily: Fonts.semiBold, color: grayColors[900] },
    historyCount: { fontSize: 12, fontFamily: Fonts.regular, color: grayColors[500] },
    historyItem: { flexDirection: 'row', marginBottom: 4 },
    timeline: { width: 24, alignItems: 'center' },
    timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: grayColors[300], marginTop: 4 },
    timelineDotActive: { backgroundColor: cskColors[500] },
    timelineLine: { flex: 1, width: 2, backgroundColor: grayColors[200], marginVertical: 4 },
    historyContent: { flex: 1, backgroundColor: grayColors[50], borderRadius: 12, padding: 12, marginLeft: 8, marginBottom: 8 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    historyTime: { fontSize: 14, fontFamily: Fonts.semiBold, color: grayColors[900] },
    historyDate: { fontSize: 12, fontFamily: Fonts.regular, color: grayColors[500] },
    historyMap: { width: '100%', height: 80, borderRadius: 8, marginBottom: 8, backgroundColor: grayColors[200] },
    historyLocation: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    historyAddress: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, color: grayColors[700], marginLeft: 6, lineHeight: 18 },
    historyAccuracy: { flexDirection: 'row', alignItems: 'center', marginLeft: 20 },
    historyAccuracyText: { fontSize: 11, fontFamily: Fonts.regular, color: grayColors[400], marginLeft: 4 },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
    emptyContainer: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, fontFamily: Fonts.semiBold, color: grayColors[500], marginTop: 12 },
    emptySubtext: { fontSize: 14, fontFamily: Fonts.regular, color: grayColors[400], marginTop: 4, textAlign: 'center' },
});
