import React from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

type Theme = typeof Colors.light | typeof Colors.dark;

interface SignInFooterProps {
    theme: Theme;
    isDark: boolean;
    isGoogleLoading: boolean;
    onGoogleSignIn: () => void;
    onSignUp: () => void;
}

export const SignInFooter: React.FC<SignInFooterProps> = ({
    theme,
    isDark,
    isGoogleLoading,
    onGoogleSignIn,
    onSignUp,
}) => {
    const { t } = useTranslation();
    const styles = createStyles(theme, isDark);

    return (
        <>
            {/* Divider */}
            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.or')}</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
                style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
                onPress={onGoogleSignIn}
                activeOpacity={0.8}
                disabled={isGoogleLoading}
            >
                {isGoogleLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                    <>
                        <Image
                            source={require('@/assets/images/google-icon.png')}
                            style={styles.googleIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
                <TouchableOpacity onPress={onSignUp}>
                    <Text style={styles.signUpText}>{t('auth.signUp')}</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        dividerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: theme.divider,
        },
        dividerText: {
            marginHorizontal: 16,
            color: theme.icon,
            fontSize: 14,
            fontFamily: Fonts?.regular,
        },
        googleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            borderWidth: 1,
            borderColor: theme.primary,
            paddingVertical: 14,
            borderRadius: 8,
            marginBottom: 24,
            minHeight: 52,
        },
        googleButtonDisabled: {
            opacity: 0.7,
        },
        googleIcon: {
            width: 24,
            height: 24,
            marginRight: 12,
        },
        googleButtonText: {
            fontSize: 16,
            fontFamily: Fonts?.semiBold,
            color: theme.primary,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 20,
        },
        footerText: {
            fontSize: 14,
            fontFamily: Fonts?.regular,
            color: theme.icon,
        },
        signUpText: {
            fontSize: 14,
            fontFamily: Fonts?.bold,
            color: theme.primary,
        },
    });
