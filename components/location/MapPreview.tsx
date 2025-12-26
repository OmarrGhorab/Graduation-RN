import React, { memo, useMemo, useCallback } from 'react';
import { 
    View, 
    Text, 
    Image, 
    TouchableOpacity, 
    StyleSheet, 
    Linking, 
    Platform,
    useColorScheme 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { GEOAPIFY_API_KEY } from '@/constants/config';
import { useTranslation } from '@/hooks/useTranslation';

// Generate static map URL
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

interface MapPreviewProps {
    latitude: number;
    longitude: number;
    label: string;
}

export const MapPreview = memo(({ latitude, longitude, label }: MapPreviewProps) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const { t } = useTranslation();
    
    const mapUrl = useMemo(() => getMapUrl(latitude, longitude), [latitude, longitude]);
    const handlePress = useCallback(() => openInMaps(latitude, longitude, label), [latitude, longitude, label]);
    
    return (
        <TouchableOpacity 
            style={[styles.mapContainer, { backgroundColor: theme.gray[200] }]}
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
                <Text style={[styles.openMapText, { fontFamily: Fonts?.medium }]}>
                    {t('location.openInMaps')}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    mapContainer: {
        height: 120,
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
        color: '#FFFFFF',
        marginLeft: 4,
    },
});
