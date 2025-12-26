import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

interface TabBarLabelProps {
    label: string;
    color: string;
    focused: boolean;
}

export default function TabBarLabel({ label, color, focused }: TabBarLabelProps) {
    return (
        <Text style={[styles.label, { color }]}>
            {label}
        </Text>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
});
