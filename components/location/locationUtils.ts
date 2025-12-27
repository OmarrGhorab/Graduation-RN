import { Platform, Linking } from 'react-native';
import { geoapifyApiKey } from '@/constants/config';

/**
 * Format timestamp to date and time strings
 */
export const formatDateTime = (timestamp: string) => {
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

/**
 * Generate static map URL from Geoapify
 */
export const getMapUrl = (latitude: number, longitude: number) => {
    return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&width=400&height=120&center=lonlat:${longitude},${latitude}&zoom=16&marker=lonlat:${longitude},${latitude};color:%2322c55e;size:medium&apiKey=${geoapifyApiKey}`;
};

/**
 * Open location in maps app
 */
export const openInMaps = (latitude: number, longitude: number, label: string) => {
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
