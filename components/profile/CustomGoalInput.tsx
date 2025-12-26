import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';

interface CustomGoalInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSubmit: () => void;
}

export default function CustomGoalInput({ value, onChangeText, onSubmit }: CustomGoalInputProps) {
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();

    return (
        <View style={styles.container}>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: isDark ? theme.surface : '#FFFFFF',
                        borderColor: isDark ? theme.border : theme.gray[200],
                        color: isDark ? theme.text : theme.gray[900],
                        textAlign,
                    },
                ]}
                placeholder={t('profile.customGoalPlaceholder')}
                placeholderTextColor={isDark ? theme.gray[500] : theme.gray[400]}
                value={value}
                onChangeText={onChangeText}
                onSubmitEditing={onSubmit}
                maxLength={30}
                autoFocus
            />
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={onSubmit}
                disabled={!value.trim()}
            >
                <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
