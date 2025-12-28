import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
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
import { useToast } from '@/components/toast';
import { useTranslation } from '@/hooks/useTranslation';
import {
    useMyLocation,
    useChildrenLocations,
    useUpdateLocation,
    useRequestChildLocation,
    ChildLocation,
} from '@/hooks/useLocation';
import { DeviceService } from '@/services/DeviceService';
import { 
    LocationCard, 
    SkeletonLocationCard, 
    EmptyChildrenState 
} from '@/components/location';

export default function LocationScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const toast = useToast();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    
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
    
    // Get local device location on mount
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
            const refetchPromises = [
                refetchMyLocation(),
                isParent ? refetchChildren() : Promise.resolve(),
            ];
            
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
                        updateLocationMutation.mutate();
                    }
                })
                .catch(() => {});
            
            await Promise.all(refetchPromises);
            toast.success(t('location.updated'), t('location.locationRefreshed'));
        } catch (error: any) {
            toast.error(t('common.error'), error.message || t('location.failedToRefresh'));
        } finally {
            setRefreshing(false);
        }
    }, [isParent, refetchMyLocation, refetchChildren, toast, updateLocationMutation]);
    
    const myLocation = useMemo(() => serverLocation || localLocation, [serverLocation, localLocation]);
    
    const handleChildPress = useCallback((childId: string) => {
        router.push(`/location-history/${childId}` as any);
    }, [router]);

    const handleRequestLocation = useCallback(async (childId: string) => {
        setRequestingChildId(childId);
        try {
            const result = await requestLocationMutation.mutateAsync(childId);
            toast.success(
                t('location.requestSent'), 
                result.message || t('location.locationRequestSent')
            );
            
            // Keep loading state for 8 seconds while polling happens
            setTimeout(() => {
                setRequestingChildId(null);
            }, 8000);
        } catch (error: any) {
            toast.error(t('common.error'), error.message || t('location.failedToRequestLocation'));
            setRequestingChildId(null);
        }
    }, [requestLocationMutation, toast, t]);

    return (
        <View style={[styles.container, { 
            paddingTop: insets.top,
            backgroundColor: theme.background 
        }]}>
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { 
                    color: theme.text,
                    fontFamily: Fonts?.semiBold 
                }]}>
                    {t('location.title')}
                </Text>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={onRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <Ionicons name="refresh" size={24} color={theme.primary} />
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
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* My Location Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { 
                        color: theme.text,
                        fontFamily: Fonts?.semiBold 
                    }]}>
                        {t('location.myLocation')}
                    </Text>
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
                        <Text style={[styles.sectionTitle, { 
                            color: theme.text,
                            fontFamily: Fonts?.semiBold 
                        }]}>
                            {t('location.children')} ({childrenLocations?.length || 0})
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
                            <EmptyChildrenState />
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
    headerTitle: {
        fontSize: 18,
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
        marginBottom: 12,
    },
});
