import React from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface SettingsToggleProps {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}

export function SettingsToggle({ label, value, onValueChange }: SettingsToggleProps) {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { borderBottomColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: theme.gray[200], true: theme.csk[400] }}
                thumbColor={value ? theme.primary : theme.gray[50]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    label: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
});
