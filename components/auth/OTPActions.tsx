import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

interface OTPActionsProps {
    theme: Theme;
    isDark: boolean;
    isLoading: boolean;
    timer: number;
    buttonText?: string;
    onContinue: () => void;
    onResend: () => void;
}

export const OTPActions: React.FC<OTPActionsProps> = ({
    theme,
    isDark,
    isLoading,
    timer,
    buttonText = 'Continue',
    onContinue,
    onResend,
}) => {
    const styles = createStyles(theme, isDark);
    const formattedTimer = `00:${timer < 10 ? `0${timer}` : timer}`;

    return (
        <>
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
                    <Text style={styles.continueButtonText}>{buttonText}</Text>
                )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
                <Text style={styles.resendLabel}>Did not receive the code?</Text>
                {timer === 0 ? (
                    <TouchableOpacity onPress={onResend} disabled={isLoading}>
                        <Text style={styles.resendLink}>Send Again</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.timerText}>{formattedTimer}</Text>
                )}
            </View>
        </>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
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
            marginBottom: 24,
        },
        continueButtonText: {
            color: theme.onPrimary,
            fontSize: 16,
            fontFamily: Fonts?.bold,
        },
        continueButtonDisabled: {
            opacity: 0.7,
        },
        resendContainer: {
            alignItems: 'center',
        },
        resendLabel: {
            fontSize: 14,
            fontFamily: Fonts?.regular,
            color: theme.icon,
            marginBottom: 8,
        },
        resendLink: {
            fontSize: 14,
            fontFamily: Fonts?.bold,
            color: theme.primary,
        },
        timerText: {
            fontSize: 16,
            fontFamily: Fonts?.bold,
            color: theme.primary,
            marginTop: 2,
        },
    });
