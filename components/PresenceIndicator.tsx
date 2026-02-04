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
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.indicator,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: isOnline ? colors.success : colors.border,
                    borderColor: colors.background,
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
