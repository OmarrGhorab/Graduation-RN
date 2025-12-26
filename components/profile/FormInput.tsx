import React from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';

interface FormInputProps extends TextInputProps {
    label: string;
    error?: string;
    helperText?: string;
    rightLabel?: React.ReactNode;
    isSuccess?: boolean;
    disabled?: boolean;
    disabledValue?: string;
}

export default function FormInput({
    label,
    error,
    helperText,
    rightLabel,
    isSuccess,
    disabled,
    disabledValue,
    style,
    ...props
}: FormInputProps) {
    const { theme, isDark } = useTheme();
    const { textAlign } = useTranslation();

    const inputBg = disabled
        ? isDark
            ? theme.surfaceVariant
            : theme.gray[50]
        : isDark
        ? theme.surface
        : '#FFFFFF';

    const borderColor = error
        ? '#EF4444'
        : isSuccess
        ? '#10B981'
        : isDark
        ? theme.border
        : theme.gray[200];

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={[styles.label, { color: isDark ? theme.gray[800] : theme.gray[700] }]}>
                    {label}
                </Text>
                {rightLabel}
            </View>
            {disabled ? (
                <View
                    style={[
                        styles.input,
                        { backgroundColor: inputBg, borderColor },
                    ]}
                >
                    <Text style={[styles.disabledText, { color: isDark ? theme.gray[600] : theme.gray[500], textAlign }]}>
                        {disabledValue}
                    </Text>
                </View>
            ) : (
                <TextInput
                    style={[
                        styles.input,
                        { backgroundColor: inputBg, borderColor, color: isDark ? theme.text : theme.gray[900], textAlign },
                        style,
                    ]}
                    placeholderTextColor={isDark ? theme.gray[500] : theme.gray[400]}
                    {...props}
                />
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
            {helperText && !error && (
                <Text style={[styles.helperText, { color: isDark ? theme.gray[600] : theme.gray[500] }]}>
                    {helperText}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    disabledText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    errorText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#EF4444',
        marginTop: 4,
    },
    helperText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 4,
    },
});
