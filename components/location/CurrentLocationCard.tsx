import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { LocationData } from '@/hooks/useLocation';
import { getMapUrl, openInMaps } from './locationUtils';

interface CurrentLocationCardProps {
    location: LocationData;
}

export const CurrentLocationCard = ({ location }: CurrentLocationCardProps) => {
    const { theme, isDark } = useTheme();
    
    const handlePress = () => {
        openInMaps(location.latitude, location.longitude, location.address || 'My Location');
    };
    
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
                        Current Location
                    </Text>
                </View>
                {location.accuracy && (
                    <Text style={[styles.currentAccuracy, { 
                        color: theme.csk[600], 
                        fontFamily: Fonts.medium 
                    }]}>
                        Within {Math.round(location.accuracy)}m
                    </Text>
                )}
            </View>
            
            <Image 
                source={{ uri: getMapUrl(location.latitude, location.longitude) }}
                style={[styles.currentMap, { backgroundColor: theme.gray[200] }]}
                resizeMode="cover"
            />
            
            <View style={styles.currentLocation}>
                <Ionicons name="location" size={20} color={theme.primary} />
                <Text style={[styles.currentAddress, { 
                    color: isDark ? theme.gray[900] : theme.gray[800], 
                    fontFamily: Fonts.medium 
                }]} numberOfLines={2}>
                    {location.address || 'Address unavailable'}
                </Text>
            </View>
            
            <View style={[styles.openInMapsRow, { borderTopColor: theme.csk[200] }]}>
                <Ionicons name="open-outline" size={14} color={theme.primary} />
                <Text style={[styles.openInMapsText, { 
                    color: theme.primary, 
                    fontFamily: Fonts.medium 
                }]}>
                    Tap to open in Maps
                </Text>
            </View>
        </TouchableOpacity>
    );
};

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
