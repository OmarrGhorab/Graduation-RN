import React, { memo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { MapPreview } from './MapPreview';

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

interface LocationData {
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
    address?: string | null;
    timestamp: string;
}

interface LocationCardProps {
    name: string;
    location: LocationData | null;
    isCurrentUser?: boolean;
    onPress?: () => void;
    onRequestLocation?: () => void;
    isRequestingLocation?: boolean;
}

export const LocationCard = memo(({ 
    name, 
    location, 
    isCurrentUser = false,
    onPress,
    onRequestLocation,
    isRequestingLocation = false,
}: LocationCardProps) => {
    const { theme } = useTheme();
    const { t, isRTL } = useTranslation();
    
    const hasLocation = location && location.latitude && location.longitude;
    const isPrecise = location?.accuracy && location.accuracy < 50;
    const isOnline = hasLocation && isRecentLocation(location.timestamp);
    
    return (
        <TouchableOpacity 
            style={[styles.locationCard, { 
                backgroundColor: theme.background,
                borderColor: theme.border,
            }]} 
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.avatarContainer, { backgroundColor: theme.csk[50] }]}>
                    <Ionicons 
                        name={isCurrentUser ? "person" : "person-outline"} 
                        size={24} 
                        color={theme.primary} 
                    />
                    {!isCurrentUser && hasLocation && (
                        <View style={[
                            styles.onlineIndicator,
                            { backgroundColor: isOnline ? '#22c55e' : theme.gray[400] }
                        ]} />
                    )}
                </View>
                <View style={styles.cardInfo}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.cardName, { 
                            color: theme.text,
                            fontFamily: Fonts?.semiBold 
                        }]}>
                            {name}
                        </Text>
                        {!isCurrentUser && hasLocation && (
                            <Text style={[
                                styles.onlineStatus,
                                { 
                                    color: isOnline ? '#22c55e' : theme.gray[500],
                                    fontFamily: Fonts?.medium 
                                }
                            ]}>
                                {isOnline ? t('location.online') : t('location.offline')}
                            </Text>
                        )}
                    </View>
                    {hasLocation && (
                        <Text style={[styles.cardTime, { 
                            color: theme.gray[500],
                            fontFamily: Fonts?.regular 
                        }]}>
                            {formatTime(location.timestamp)}
                        </Text>
                    )}
                </View>
                {hasLocation && (
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: isPrecise ? theme.csk[100] : theme.gray[100] }
                    ]}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: isPrecise ? theme.csk[500] : theme.gray[400] }
                        ]} />
                        <Text style={[
                            styles.statusText,
                            { 
                                color: isPrecise ? theme.csk[600] : theme.gray[600],
                                fontFamily: Fonts?.medium 
                            }
                        ]}>
                            {isPrecise ? t('location.precise') : t('location.approximate')}
                        </Text>
                    </View>
                )}
            </View>
            
            {hasLocation ? (
                <View style={[styles.locationDetails, { backgroundColor: theme.surface }]}>
                    <MapPreview 
                        latitude={location.latitude!}
                        longitude={location.longitude!}
                        label={location.address || name}
                    />
                    
                    <View style={styles.addressContainer}>
                        <Ionicons name="location" size={16} color={theme.primary} />
                        <Text style={[styles.addressText, { 
                            color: theme.gray[700],
                            fontFamily: Fonts?.medium 
                        }]} numberOfLines={2}>
                            {location.address || t('location.addressUnavailable')}
                        </Text>
                    </View>
                    
                    {location.accuracy && (
                        <View style={styles.accuracyContainer}>
                            <Ionicons name="radio-outline" size={14} color={theme.gray[400]} />
                            <Text style={[styles.accuracyText, { 
                                color: theme.gray[500],
                                fontFamily: Fonts?.regular 
                            }]}>
                                {t('location.accurateWithinMeters', { meters: Math.round(location.accuracy) })}
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={[styles.noLocationContainer, { backgroundColor: theme.surface }]}>
                    <Ionicons name="location-outline" size={24} color={theme.gray[400]} />
                    <Text style={[styles.noLocationText, { 
                        color: theme.gray[500],
                        fontFamily: Fonts?.medium 
                    }]}>
                        {t('location.locationUnavailable')}
                    </Text>
                </View>
            )}
            
            {onPress && (
                <View style={[styles.cardActions, { borderTopColor: theme.divider }]}>
                    {onRequestLocation && (
                        <TouchableOpacity 
                            style={[styles.requestLocationButton, { backgroundColor: theme.csk[50] }]}
                            onPress={onRequestLocation}
                            disabled={isRequestingLocation}
                        >
                            {isRequestingLocation ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <>
                                    <Ionicons name="locate-outline" size={16} color={theme.primary} />
                                    <Text style={[styles.requestLocationText, { 
                                        color: theme.primary,
                                        fontFamily: Fonts?.medium 
                                    }]}>
                                        {isOnline ? t('location.refreshLocation') : t('location.requestLocation')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        style={[styles.viewHistoryRow, { borderTopColor: theme.divider }]} 
                        onPress={onPress}
                    >
                        <Text style={[styles.viewHistoryText, { 
                            color: theme.primary,
                            fontFamily: Fonts?.medium 
                        }]}>
                            {t('location.viewHistory')}
                        </Text>
                        <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
});


const styles = StyleSheet.create({
    locationCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
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
    },
    onlineStatus: {
        fontSize: 12,
    },
    cardTime: {
        fontSize: 12,
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
    },
    locationDetails: {
        borderRadius: 12,
        overflow: 'hidden',
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
        marginLeft: 6,
    },
    noLocationContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 12,
    },
    noLocationText: {
        fontSize: 14,
        marginTop: 8,
    },
    cardActions: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    requestLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    requestLocationText: {
        fontSize: 14,
        marginLeft: 6,
    },
    viewHistoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    viewHistoryText: {
        fontSize: 14,
        marginRight: 4,
    },
});
