import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AvatarProps {
    uri?: string;
    name?: string;
    size?: number;
    style?: any;
}

export default function Avatar({ uri, name, size = 50, style }: AvatarProps) {
    const { theme } = useTheme();

    return (
        <View 
            style={[
                styles.container, 
                { 
                    width: size, 
                    height: size, 
                    borderRadius: size / 2,
                    backgroundColor: theme.gray[100],
                },
                style
            ]}
        >
            {uri ? (
                <Image
                    source={{ uri }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                    contentFit="cover"
                    transition={200}
                />
            ) : (
                <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
                    <Text style={[styles.initial, { fontSize: size * 0.4, color: theme.primary }]}>
                        {name ? name.charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initial: {
        fontFamily: Fonts.bold,
    },
});
