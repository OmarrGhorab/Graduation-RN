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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/libs/auth';
import { useMyLocation, useMyLocationHistory, LocationData } from '@/hooks/useLocation';
import {
    SkeletonBox,
    SkeletonHistoryItem,
    SkeletonCurrentCard,
    CurrentLocationCard,
    HistoryItem,
} from '@/components/location';

export default function MyLocationHistoryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();
    const { theme, isDark } = useTheme();
    
    const [refreshing, setRefreshing] = useState(false);
    
    const { 
        data: currentLocation,
        isLoading: isLoadingCurrent,
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
            {currentLocation && <CurrentLocationCard location={currentLocation} />}
            
            <View style={styles.historyTitleRow}>
                <Text style={[styles.historyTitle, { 
                    color: theme.text, 
                    fontFamily: Fonts.semiBold 
                }]}>
                    My Location History
                </Text>
                {historyData?.pages?.[0]?.pagination && (
                    <Text style={[styles.historyCount, { 
                        color: theme.gray[500], 
                        fontFamily: Fonts.regular 
                    }]}>
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
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };
    
    const ListEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color={theme.gray[300]} />
            <Text style={[styles.emptyText, { 
                color: theme.gray[500], 
                fontFamily: Fonts.semiBold 
            }]}>
                No location history
            </Text>
            <Text style={[styles.emptySubtext, { 
                color: theme.gray[400], 
                fontFamily: Fonts.regular 
            }]}>
                Your location history will appear here
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { 
            paddingTop: insets.top, 
            backgroundColor: theme.background 
        }]}>
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />
            
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { 
                        color: theme.text, 
                        fontFamily: Fonts.semiBold 
                    }]}>
                        {user?.name || 'My Location'}
                    </Text>
                    <Text style={[styles.headerSubtitle, { 
                        color: theme.gray[500], 
                        fontFamily: Fonts.regular 
                    }]}>
                        Location History
                    </Text>
                </View>
                <View style={styles.placeholder} />
            </View>
            
            {isLoading && historyItems.length === 0 ? (
                <View style={styles.listContent}>
                    <SkeletonCurrentCard />
                    <View style={styles.historyTitleRow}>
                        <SkeletonBox width={140} height={16} />
                        <SkeletonBox width={80} height={12} />
                    </View>
                    <SkeletonHistoryItem />
                    <SkeletonHistoryItem />
                    <SkeletonHistoryItem />
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
        flex: 1 
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
        alignItems: 'center' 
    },
    headerCenter: { 
        flex: 1, 
        alignItems: 'center' 
    },
    headerTitle: { 
        fontSize: 18 
    },
    headerSubtitle: { 
        fontSize: 12 
    },
    placeholder: { 
        width: 40 
    },
    listContent: { 
        padding: 16, 
        paddingBottom: 32 
    },
    historyTitleRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    historyTitle: { 
        fontSize: 16 
    },
    historyCount: { 
        fontSize: 12 
    },
    footerLoader: { 
        paddingVertical: 20, 
        alignItems: 'center' 
    },
    emptyContainer: { 
        alignItems: 'center', 
        paddingVertical: 60 
    },
    emptyText: { 
        fontSize: 16, 
        marginTop: 12 
    },
    emptySubtext: { 
        fontSize: 14, 
        marginTop: 4, 
        textAlign: 'center' 
    },
});
