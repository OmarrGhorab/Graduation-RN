import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';

interface BioInputProps {
    value: string;
    onChangeText: (text: string) => void;
    maxLength?: number;
}

export const BioInput = ({ value, onChangeText, maxLength = 200 }: BioInputProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    
    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <View style={[styles.labelContainer, { backgroundColor: theme.background }]}>
                    <Text style={[styles.label, { color: theme.icon, fontFamily: Fonts.medium }]}>
                        {t('onboarding.bioOptional')}
                    </Text>
                </View>
                <TextInput
                    style={[styles.input, { 
                        borderColor: theme.border,
                        color: theme.text,
                        fontFamily: Fonts.regular,
                        backgroundColor: theme.background,
                    }]}
                    placeholder={t('onboarding.bioPlaceholder')}
                    placeholderTextColor={theme.icon}
                    value={value}
                    onChangeText={onChangeText}
                    multiline
                    numberOfLines={4}
                    maxLength={maxLength}
                    textAlignVertical="top"
                />
            </View>
            <Text style={[styles.characterCount, { 
                color: theme.gray[500], 
                fontFamily: Fonts.regular 
            }]}>
                {value.length}/{maxLength}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
    },
    inputWrapper: {
        position: 'relative',
        paddingTop: 8,
    },
    labelContainer: {
        position: 'absolute',
        top: 0,
        left: 12,
        zIndex: 1,
        paddingHorizontal: 4,
    },
    label: {
        fontSize: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        minHeight: 100,
    },
    characterCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 4,
    },
});
