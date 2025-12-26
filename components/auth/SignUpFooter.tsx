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

interface SignUpFooterProps {
    theme: Theme;
    isDark: boolean;
    isGoogleLoading: boolean;
    onGoogleSignIn: () => void;
    onSignIn: () => void;
}

export const SignUpFooter: React.FC<SignUpFooterProps> = ({
    theme,
    isDark,
    isGoogleLoading,
    onGoogleSignIn,
    onSignIn,
}) => {
    const { t } = useTranslation();
    const styles = createStyles(theme, isDark);

    return (
        <>
            {/* Sign In Link */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
                <TouchableOpacity onPress={onSignIn}>
                    <Text style={styles.signInText}>{t('auth.logIn')}</Text>
                </TouchableOpacity>
            </View>

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
        </>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 24,
        },
        footerText: {
            fontSize: 14,
            fontFamily: Fonts?.regular,
            color: theme.icon,
        },
        signInText: {
            fontSize: 14,
            fontFamily: Fonts?.bold,
            color: theme.primary,
        },
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
    });
