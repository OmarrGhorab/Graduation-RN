import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TabBarIconProps {
    name: keyof typeof Ionicons.glyphMap;
    color: string;
    size: number;
    badge?: number;
}

export default function TabBarIcon({ name, color, size, badge }: TabBarIconProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={name} size={size} color={color} />
            {badge !== undefined && badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {badge > 99 ? '99+' : badge.toString()}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#097D46', // App's primary green color
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontFamily: Fonts.bold,
    },
});
