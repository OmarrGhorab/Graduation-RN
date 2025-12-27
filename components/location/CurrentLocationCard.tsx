import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { LocationData } from '@/hooks/useLocation';
import { useTranslation } from '@/hooks/useTranslation';
import { getMapUrl, openInMaps } from './locationUtils';

interface CurrentLocationCardProps {
    location: LocationData;
}

export const CurrentLocationCard = memo(({ location }: CurrentLocationCardProps) => {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    
    const mapUrl = useMemo(() => getMapUrl(location.latitude, location.longitude), [location.latitude, location.longitude]);
    
    const handlePress = useCallback(() => {
        openInMaps(location.latitude, location.longitude, location.address || t('location.myLocation'));
    }, [location.latitude, location.longitude, location.address, t]);
    
    return (
        <TouchableOpacity 
            style={[styles.currentCard, { 
                backgroundColor: theme.csk[50], 
                borderColor: theme.csk[200] 
            }]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.currentHeader}>
                <View style={[styles.currentBadge, { backgroundColor: theme.primary }]}>
                    <View style={styles.liveDot} />
                    <Text style={[styles.liveText, { fontFamily: Fonts.medium }]}>
                        {t('location.currentLocation')}
                    </Text>
                </View>
                {location.accuracy && (
                    <Text style={[styles.currentAccuracy, { 
                        color: theme.csk[600], 
                        fontFamily: Fonts.medium 
                    }]}>
                        {t('location.withinMeters', { meters: Math.round(location.accuracy) })}
                    </Text>
                )}
            </View>
            
            <Image 
                source={{ uri: mapUrl }}
                style={[styles.currentMap, { backgroundColor: theme.gray[200] }]}
                resizeMode="cover"
            />
            
            <View style={styles.currentLocation}>
                <Ionicons name="location" size={20} color={theme.primary} />
                <Text style={[styles.currentAddress, { 
                    color: isDark ? theme.gray[900] : theme.gray[800], 
                    fontFamily: Fonts.medium 
                }]} numberOfLines={2}>
                    {location.address || t('location.addressUnavailable')}
                </Text>
            </View>
            
            <View style={[styles.openInMapsRow, { borderTopColor: theme.csk[200] }]}>
                <Ionicons name="open-outline" size={14} color={theme.primary} />
                <Text style={[styles.openInMapsText, { 
                    color: theme.primary, 
                    fontFamily: Fonts.medium 
                }]}>
                    {t('location.tapToOpenInMaps')}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
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
        marginRight: 6 
    },
    liveText: { 
        fontSize: 12, 
        color: '#FFFFFF' 
    },
    currentAccuracy: { 
        fontSize: 12 
    },
    currentMap: { 
        width: '100%', 
        height: 150, 
        borderRadius: 12, 
        marginBottom: 12 
    },
    currentLocation: { 
        flexDirection: 'row', 
        alignItems: 'flex-start' 
    },
    currentAddress: { 
        flex: 1, 
        fontSize: 15, 
        marginLeft: 8, 
        lineHeight: 22 
    },
    openInMapsRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 12, 
        paddingTop: 12, 
        borderTopWidth: 1 
    },
    openInMapsText: { 
        fontSize: 13, 
        marginLeft: 6 
    },
});
