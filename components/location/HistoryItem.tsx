import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { LocationData } from '@/hooks/useLocation';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime, getMapUrl, openInMaps } from './locationUtils';

interface HistoryItemProps {
    item: LocationData;
    isFirst: boolean;
}

export const HistoryItem = memo(({ item, isFirst }: HistoryItemProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const { date, time } = useMemo(() => formatDateTime(item.timestamp), [item.timestamp]);
    
    const mapUrl = useMemo(() => getMapUrl(item.latitude, item.longitude), [item.latitude, item.longitude]);
    
    const handlePress = useCallback(() => {
        openInMaps(item.latitude, item.longitude, item.address || t('location.title'));
    }, [item.latitude, item.longitude, item.address, t]);
    
    return (
        <View style={styles.historyItem}>
            <View style={styles.timeline}>
                <View style={[
                    styles.timelineDot, 
                    { backgroundColor: isFirst ? theme.primary : theme.gray[300] }
                ]} />
                <View style={[styles.timelineLine, { backgroundColor: theme.gray[200] }]} />
            </View>
            
            <TouchableOpacity 
                style={[styles.historyContent, { backgroundColor: theme.surface }]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <View style={styles.historyHeader}>
                    <Text style={[styles.historyTime, { 
                        color: theme.text, 
                        fontFamily: Fonts.semiBold 
                    }]}>
                        {time}
                    </Text>
                    <Text style={[styles.historyDate, { 
                        color: theme.gray[500], 
                        fontFamily: Fonts.regular 
                    }]}>
                        {date}
                    </Text>
                </View>
                
                <View style={[styles.historyMap, { backgroundColor: theme.gray[200] }]}>
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={theme.primary} />
                        </View>
                    )}
                    <Image 
                        source={{ uri: mapUrl }}
                        style={styles.mapImage}
                        contentFit="cover"
                        cachePolicy="disk"
                        priority="normal"
                        onLoadStart={() => setIsLoading(true)}
                        onLoadEnd={() => setIsLoading(false)}
                        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                        transition={200}
                    />
                </View>
                
                <View style={styles.historyLocation}>
                    <Ionicons name="location" size={14} color={theme.primary} />
                    <Text style={[styles.historyAddress, { 
                        color: theme.gray[700], 
                        fontFamily: Fonts.regular 
                    }]} numberOfLines={2}>
                        {item.address || t('location.addressUnavailable')}
                    </Text>
                </View>
                
                {item.accuracy && (
                    <View style={styles.historyAccuracy}>
                        <Ionicons name="radio-outline" size={12} color={theme.gray[400]} />
                        <Text style={[styles.historyAccuracyText, { 
                            color: theme.gray[400], 
                            fontFamily: Fonts.regular 
                        }]}>
                            {t('location.withinMeters', { meters: Math.round(item.accuracy) })}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    historyItem: { 
        flexDirection: 'row', 
        marginBottom: 4 
    },
    timeline: { 
        width: 24, 
        alignItems: 'center' 
    },
    timelineDot: { 
        width: 10, 
        height: 10, 
        borderRadius: 5, 
        marginTop: 4 
    },
    timelineLine: { 
        flex: 1, 
        width: 2, 
        marginVertical: 4 
    },
    historyContent: { 
        flex: 1, 
        borderRadius: 12, 
        padding: 12, 
        marginLeft: 8, 
        marginBottom: 8 
    },
    historyHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 8 
    },
    historyTime: { 
        fontSize: 14 
    },
    historyDate: { 
        fontSize: 12 
    },
    historyMap: { 
        width: '100%', 
        height: 80, 
        borderRadius: 8, 
        marginBottom: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    historyLocation: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        marginBottom: 4 
    },
    historyAddress: { 
        flex: 1, 
        fontSize: 13, 
        marginLeft: 6, 
        lineHeight: 18 
    },
    historyAccuracy: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginLeft: 20 
    },
    historyAccuracyText: { 
        fontSize: 11, 
        marginLeft: 4 
    },
});
