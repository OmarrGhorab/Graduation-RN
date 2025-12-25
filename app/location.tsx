import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    Image,
    Linking,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { cskColors, grayColors, Fonts } from '@/constants/theme';
import { GEOAPIFY_API_KEY } from '@/constants/config';
import { useAuthStore } from '@/libs/auth';
import { useToast } from '@/components/toast';
import {
    useMyLocation,
    useChildrenLocations,
    useUpdateLocation,
    useRequestChildLocation,
    ChildLocation,
} from '@/hooks/useLocation';
import { DeviceService } from '@/services/DeviceService';

// Skeleton shimmer component
const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;
    
    React.useEffect(() => {
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
                { width, height, backgroundColor: grayColors[200], borderRadius: 8, opacity },
                style
            ]} 
        />
    );
};

// Skeleton Location Card
const SkeletonLocationCard = () => (
    <View style={styles.locationCard}>
        <View style={styles.cardHeader}>
            <SkeletonBox width={44} height={44} style={{ borderRadius: 22 }} />
            <View style={styles.cardInfo}>
                <SkeletonBox width={120} height={16} style={{ marginBottom: 6 }} />
                <SkeletonBox width={80} height={12} />
            </View>
            <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
        </View>
        <View style={styles.locationDetails}>
            <SkeletonBox width="100%" height={120} style={{ borderRadius: 0 }} />
            <View style={styles.addressContainer}>
                <SkeletonBox width={16} height={16} style={{ borderRadius: 4 }} />
                <SkeletonBox width="80%" height={14} style={{ marginLeft: 8 }} />
            </View>
            <View style={styles.accuracyContainer}>
                <SkeletonBox width={14} height={14} style={{ borderRadius: 4 }} />
                <SkeletonBox width={150} height={12} style={{ marginLeft: 6 }} />
            </View>
        </View>
    </View>
);

// Format timestamp to readable string
const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
};

// Check if location is recent (within 10 minutes = likely online)
const isRecentLocation = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 10;
};

// Generate static map URL - memoized outside component
const getMapUrl = (latitude: number, longitude: number) => {
    return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=400&height=150&center=lonlat:${longitude},${latitude}&zoom=16&marker=lonlat:${longitude},${latitude};color:%2322c55e;size:medium&apiKey=${GEOAPIFY_API_KEY}`;
};

// Open location in maps app
const openInMaps = (latitude: number, longitude: number, label: string) => {
    const encodedLabel = encodeURIComponent(label);
    
    const googleMapsUrl = Platform.select({
        ios: `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=17`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    });
    
    const appleMapsUrl = `maps://app?daddr=${latitude},${longitude}&ll=${latitude},${longitude}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    
    Linking.canOpenURL(googleMapsUrl || '').then((supported) => {
        if (supported) {
            Linking.openURL(googleMapsUrl || '');
        } else if (Platform.OS === 'ios') {
            Linking.openURL(appleMapsUrl);
        } else {
            Linking.openURL(webUrl);
        }
    }).catch(() => {
        Linking.openURL(webUrl);
    });
};

// Memoized Map Image Component
const MapPreview = memo(({ latitude, longitude, label }: { 
    latitude: number; 
    longitude: number; 
    label: string;
}) => {
    const mapUrl = useMemo(() => getMapUrl(latitude, longitude), [latitude, longitude]);
    const handlePress = useCallback(() => openInMaps(latitude, longitude, label), [latitude, longitude, label]);
    
    return (
        <TouchableOpacity 
            style={styles.mapContainer}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <Image 
                source={{ uri: mapUrl }}
                style={styles.mapImage}
                resizeMode="cover"
            />
            <View style={styles.openMapBadge}>
                <Ionicons name="open-outline" size={12} color="#FFFFFF" />
                <Text style={styles.openMapText}>Open in Maps</Text>
            </View>
        </TouchableOpacity>
    );
});

// Memoized Location Card Component
const LocationCard = memo(({ 
    name, 
    location, 
    isCurrentUser = false,
    onPress,
    onRequestLocation,
    isRequestingLocation = false,
}: {
    name: string;
    location: any;
    isCurrentUser?: boolean;
    onPress?: () => void;
    onRequestLocation?: () => void;
    isRequestingLocation?: boolean;
}) => {
    const hasLocation = location && location.latitude && location.longitude;
    const isPrecise = location?.accuracy && location.accuracy < 50;
    const isOnline = hasLocation && isRecentLocation(location.timestamp);
    
    return (
        <TouchableOpacity 
            style={styles.locationCard} 
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Ionicons 
                        name={isCurrentUser ? "person" : "person-outline"} 
                        size={24} 
                        color={cskColors[500]} 
                    />
                    {/* Online/Offline indicator for children */}
                    {!isCurrentUser && hasLocation && (
                        <View style={[
                            styles.onlineIndicator,
                            { backgroundColor: isOnline ? '#22c55e' : grayColors[400] }
                        ]} />
                    )}
                </View>
                <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.cardName}>{name}</Text>
                        {!isCurrentUser && hasLocation && (
                            <Text style={[
                                styles.onlineStatus,
                                { color: isOnline ? '#22c55e' : grayColors[500] }
                            ]}>
                                {isOnline ? 'Online' : 'Offline'}
                            </Text>
                        )}
                    </View>
                    {hasLocation && (
                        <Text style={styles.cardTime}>
                            {formatTime(location.timestamp)}
                        </Text>
                    )}
                </View>
                {hasLocation && (
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: isPrecise ? cskColors[100] : grayColors[100] }
                    ]}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: isPrecise ? cskColors[500] : grayColors[400] }
                        ]} />
                        <Text style={[
                            styles.statusText,
                            { color: isPrecise ? cskColors[600] : grayColors[600] }
                        ]}>
                            {isPrecise ? 'Precise' : 'Approximate'}
                        </Text>
                    </View>
                )}
            </View>
            
            {hasLocation ? (
                <View style={styles.locationDetails}>
                    <MapPreview 
                        latitude={location.latitude}
                        longitude={location.longitude}
                        label={location.address || name}
                    />
                    
                    <View style={styles.addressContainer}>
                        <Ionicons name="location" size={16} color={cskColors[500]} />
                        <Text style={styles.addressText} numberOfLines={2}>
                            {location.address || 'Address unavailable'}
                        </Text>
                    </View>
                    
                    {location.accuracy && (
                        <View style={styles.accuracyContainer}>
                            <Ionicons name="radio-outline" size={14} color={grayColors[400]} />
                            <Text style={styles.accuracyText}>
                                Accurate within {Math.round(location.accuracy)} meters
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.noLocationContainer}>
                    <Ionicons name="location-outline" size={24} color={grayColors[400]} />
                    <Text style={styles.noLocationText}>Location unavailable</Text>
                </View>
            )}
            
            {onPress && (
                <View style={styles.cardActions}>
                    {/* Request Location Button */}
                    {onRequestLocation && (
                        <TouchableOpacity 
                            style={styles.requestLocationButton}
                            onPress={onRequestLocation}
                            disabled={isRequestingLocation}
                        >
                            {isRequestingLocation ? (
                                <ActivityIndicator size="small" color={cskColors[500]} />
                            ) : (
                                <>
                                    <Ionicons name="locate-outline" size={16} color={cskColors[500]} />
                                    <Text style={styles.requestLocationText}>
                                        {isOnline ? 'Refresh Location' : 'Request Location'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    {/* View History */}
                    <TouchableOpacity style={styles.viewHistoryRow} onPress={onPress}>
                        <Text style={styles.viewHistoryText}>View history</Text>
                        <Ionicons name="chevron-forward" size={16} color={cskColors[500]} />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
});

export default function LocationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const toast = useToast();
    const { user } = useAuthStore();
    const isParent = user?.role === 'PARENT';
    
    const [refreshing, setRefreshing] = useState(false);
    const [localLocation, setLocalLocation] = useState<any>(null);
    const [requestingChildId, setRequestingChildId] = useState<string | null>(null);
    
    // Queries with optimized settings
    const { 
        data: serverLocation, 
        isLoading: isLoadingMyLocation,
        refetch: refetchMyLocation,
    } = useMyLocation();
    
    const { 
        data: childrenLocations, 
        isLoading: isLoadingChildren,
        refetch: refetchChildren,
    } = useChildrenLocations(isParent);
    
    const updateLocationMutation = useUpdateLocation();
    const requestLocationMutation = useRequestChildLocation();
    
    // Get local device location on mount (use balanced for faster initial load)
    useEffect(() => {
        const fetchLocalLocation = async () => {
            const loc = await DeviceService.getPreciseLocation({ accuracy: 'balanced' });
            if (loc) {
                setLocalLocation({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    accuracy: loc.accuracy,
                    address: loc.formattedAddress,
                    timestamp: new Date(loc.timestamp).toISOString(),
                });
            }
        };
        fetchLocalLocation();
    }, []);
    
    // Memoized refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Refetch server data first (fast) - don't wait for GPS
            const refetchPromises = [
                refetchMyLocation(),
                isParent ? refetchChildren() : Promise.resolve(),
            ];
            
            // Start GPS fetch in parallel but don't block on it
            DeviceService.getPreciseLocation({ accuracy: 'high', forceRefresh: true })
                .then(loc => {
                    if (loc) {
                        setLocalLocation({
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                            accuracy: loc.accuracy,
                            address: loc.formattedAddress,
                            timestamp: new Date(loc.timestamp).toISOString(),
                        });
                        // Update server in background
                        updateLocationMutation.mutate();
                    }
                })
                .catch(() => {});
            
            await Promise.all(refetchPromises);
            toast.success('Updated', 'Location refreshed');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to refresh');
        } finally {
            setRefreshing(false);
        }
    }, [isParent, refetchMyLocation, refetchChildren, toast, updateLocationMutation]);
    
    // Memoized values
    const myLocation = useMemo(() => serverLocation || localLocation, [serverLocation, localLocation]);
    
    // Memoized navigation handler
    const handleChildPress = useCallback((childId: string) => {
        router.push(`/location-history/${childId}` as any);
    }, [router]);

    // Request location from offline child
    const handleRequestLocation = useCallback(async (childId: string) => {
        setRequestingChildId(childId);
        try {
            await requestLocationMutation.mutateAsync(childId);
            toast.success('Request Sent', 'Location request sent. Waiting for response...');
            
            // Poll for updated location after a few seconds
            setTimeout(async () => {
                await refetchChildren();
                setRequestingChildId(null);
            }, 5000);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to request location');
            setRequestingChildId(null);
        }
    }, [requestLocationMutation, refetchChildren, toast]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={grayColors[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Location</Text>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={onRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <ActivityIndicator size="small" color={cskColors[500]} />
                    ) : (
                        <Ionicons name="refresh" size={24} color={cskColors[500]} />
                    )}
                </TouchableOpacity>
            </View>
            
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[cskColors[500]]}
                        tintColor={cskColors[500]}
                    />
                }
            >
                {/* My Location Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Location</Text>
                    {isLoadingMyLocation && !myLocation ? (
                        <SkeletonLocationCard />
                    ) : (
                        <LocationCard
                            name={user?.name || 'You'}
                            location={myLocation}
                            isCurrentUser
                            onPress={() => router.push('/my-location-history' as any)}
                        />
                    )}
                </View>
                
                {/* Children Locations (Parent Only) */}
                {isParent && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Children ({childrenLocations?.length || 0})
                        </Text>
                        
                        {isLoadingChildren ? (
                            <>
                                <SkeletonLocationCard />
                                <SkeletonLocationCard />
                            </>
                        ) : childrenLocations && childrenLocations.length > 0 ? (
                            childrenLocations.map((item: ChildLocation) => (
                                <LocationCard
                                    key={item.child.id}
                                    name={item.child.name || item.child.username}
                                    location={item.location}
                                    onPress={() => handleChildPress(item.child.id)}
                                    onRequestLocation={() => handleRequestLocation(item.child.id)}
                                    isRequestingLocation={requestingChildId === item.child.id}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons 
                                    name="people-outline" 
                                    size={48} 
                                    color={grayColors[300]} 
                                />
                                <Text style={styles.emptyText}>
                                    No linked children
                                </Text>
                                <Text style={styles.emptySubtext}>
                                    Link with your children to track their location
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    refreshButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
        marginBottom: 12,
    },
    locationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: grayColors[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: cskColors[50],
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardName: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    onlineStatus: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    cardTime: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    locationDetails: {
        backgroundColor: grayColors[50],
        borderRadius: 12,
        overflow: 'hidden',
    },
    mapContainer: {
        height: 120,
        backgroundColor: grayColors[200],
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    openMapBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    openMapText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: '#FFFFFF',
        marginLeft: 4,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        paddingBottom: 8,
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[700],
        marginLeft: 8,
        lineHeight: 20,
    },
    accuracyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    accuracyText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginLeft: 6,
    },
    noLocationContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: grayColors[50],
        borderRadius: 12,
    },
    noLocationText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[500],
        marginTop: 8,
    },
    cardActions: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: grayColors[100],
    },
    requestLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: cskColors[50],
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    requestLocationText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: cskColors[500],
        marginLeft: 6,
    },
    viewHistoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: grayColors[100],
    },
    viewHistoryText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: cskColors[500],
        marginRight: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: grayColors[50],
        borderRadius: 16,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: grayColors[500],
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[400],
        marginTop: 4,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
