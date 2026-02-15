import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface PresenceIndicatorProps {
    isOnline: boolean;
    size?: number;
    style?: any;
}

/**
 * Simple presence indicator component
 * Shows a green dot when user is online, gray when offline
 */
export function PresenceIndicator({ isOnline, size = 12, style }: PresenceIndicatorProps) {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.indicator,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: isOnline ? theme.primary : theme.border,
                    borderColor: theme.background,
                },
                style
            ]}
        />
    );
}

const styles = StyleSheet.create({
    indicator: {
        borderWidth: 2,
    },
});
