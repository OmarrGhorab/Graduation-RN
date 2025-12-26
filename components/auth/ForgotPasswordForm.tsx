import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

type Theme = typeof Colors.light | typeof Colors.dark;

interface ForgotPasswordFormProps {
    theme: Theme;
    isDark: boolean;
    email: string;
    isLoading: boolean;
    onEmailChange: (text: string) => void;
    onContinue: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    theme,
    isDark,
    email,
    isLoading,
    onEmailChange,
    onContinue,
}) => {
    const { t, textAlign } = useTranslation();
    const styles = createStyles(theme, isDark);

    return (
        <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{t('auth.emailUsername')}</Text>
                </View>
                <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={theme.icon}
                    value={email}
                    onChangeText={onEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
                style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
                onPress={onContinue}
                activeOpacity={0.8}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color={theme.onPrimary} />
                ) : (
                    <Text style={styles.continueButtonText}>{t('auth.continue')}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        form: {
            width: '100%',
        },
        inputWrapper: {
            marginBottom: 20,
            position: 'relative',
            paddingTop: 8,
        },
        labelContainer: {
            position: 'absolute',
            top: 0,
            left: 12,
            zIndex: 1,
            paddingHorizontal: 4,
            backgroundColor: theme.background,
        },
        label: {
            fontSize: 12,
            fontFamily: Fonts?.medium,
            color: theme.icon,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            fontFamily: Fonts?.regular,
            height: 50,
            color: theme.text,
            backgroundColor: theme.background,
        },
        continueButton: {
            backgroundColor: theme.primary,
            borderRadius: 8,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        continueButtonText: {
            color: theme.onPrimary,
            fontSize: 16,
            fontFamily: Fonts?.bold,
        },
        continueButtonDisabled: {
            opacity: 0.7,
        },
    });
