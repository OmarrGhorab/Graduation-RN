import React from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

const { width } = Dimensions.get('window');

type Theme = typeof Colors.light | typeof Colors.dark;

interface LoginButtonsProps {
    theme: Theme;
    isDark: boolean;
    isGoogleLoading: boolean;
    onGoogleSignIn: () => void;
    onSignUp: () => void;
    onLogIn: () => void;
}

export const LoginButtons: React.FC<LoginButtonsProps> = ({
    theme,
    isDark,
    isGoogleLoading,
    onGoogleSignIn,
    onSignUp,
    onLogIn,
}) => {
    const { t } = useTranslation();
    const styles = createStyles(theme, isDark);

    return (
        <>
            {/* Google Sign In Button */}
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

            {/* Sign Up Button */}
            <TouchableOpacity
                style={styles.signUpButton}
                onPress={onSignUp}
                activeOpacity={0.8}
            >
                <Text style={styles.signUpButtonText}>{t('auth.signUp')}</Text>
            </TouchableOpacity>

            {/* Log In Button */}
            <TouchableOpacity
                style={styles.logInButton}
                onPress={onLogIn}
                activeOpacity={0.8}
            >
                <Text style={styles.logInButtonText}>{t('auth.logIn')}</Text>
            </TouchableOpacity>
        </>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        googleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: width * 0.85,
            maxWidth: 350,
            marginBottom: 16,
            minHeight: 56,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 2,
            elevation: 2,
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
            color: theme.text,
            flex: 1,
            textAlign: 'center',
        },
        signUpButton: {
            backgroundColor: theme.primary,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: width * 0.85,
            maxWidth: 350,
            marginBottom: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        signUpButtonText: {
            fontSize: 16,
            fontFamily: Fonts?.semiBold,
            color: theme.onPrimary,
        },
        logInButton: {
            borderWidth: 2,
            borderColor: theme.primary,
            backgroundColor: 'transparent',
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: width * 0.85,
            maxWidth: 350,
            alignItems: 'center',
        },
        logInButtonText: {
            fontSize: 16,
            fontFamily: Fonts?.semiBold,
            color: theme.primary,
        },
    });
