import { useRouter, Href } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { cskColors, Colors } from '@/constants/theme';
import { googleSignIn, configureGoogleSignIn } from '@/services/AuthService';
import { useToast } from '@/components/toast';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const toast = useToast();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const navigateTo2FA = (authData: any) => {
        router.push({
            pathname: '/verify-2fa',
            params: {
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
                user: JSON.stringify(authData.user),
            }
        } as any);
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);

        const result = await googleSignIn({
            showAlerts: true,
            onSuccess: (data) => {
                console.log('Google Sign-In successful:', data);
                if (data.user?.onboardingCompleted) {
                    router.replace('/home' as Href);
                } else {
                    router.replace('/onboarding/step1' as Href);
                }
            },
            onCancel: () => {
                console.log('Google Sign-In cancelled');
            },
        });

        // If 2FA is required, navigate to 2FA page
        if (result.requires2FA && result.data) {
            navigateTo2FA(result.data);
        }

        setIsGoogleLoading(false);
    };

    const handleSignUp = () => {
        router.push('/signup');
    };

    const handleLogIn = () => {
        router.push('/signin');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            {/* Content */}
            <View style={styles.content}>
                {/* Welcome Text */}
                <Text style={[styles.welcomeText, { color: cskColors[500] }]}>WELCOME BACK</Text>
                <Text style={[styles.subtitle, { color: cskColors[500] }]}>Sign in to access your account and continue your journey with us.</Text>

                {/* Logo */}
                <Image
                    source={require('@/assets/images/logo-green.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Google Sign In Button */}
                <TouchableOpacity
                    style={[
                        styles.googleButton,
                        isGoogleLoading && styles.googleButtonDisabled,
                    ]}
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.8}
                    disabled={isGoogleLoading}
                >
                    {isGoogleLoading ? (
                        <ActivityIndicator size="small" color={cskColors[500]} />
                    ) : (
                        <>
                            <Image
                                source={require('@/assets/images/google-icon.png')}
                                style={styles.googleIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.googleButtonText}>Continue With Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Sign Up Button */}
                <TouchableOpacity
                    style={[styles.signUpButton, { backgroundColor: cskColors[500] }]}
                    onPress={handleSignUp}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                {/* Log In Button */}
                <TouchableOpacity
                    style={[styles.logInButton, { borderColor: cskColors[500] }]}
                    onPress={handleLogIn}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.logInButtonText, { color: cskColors[500] }]}>Log In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.15,
        alignItems: 'center',
    },
    logo: {
        width: width * 0.4,
        height: height * 0.2,
        maxWidth: 200,
        maxHeight: 200,
        marginBottom: 40,
    },
    welcomeText: {
        fontSize: 32,
        fontFamily: 'System',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'System',
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: 60,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: width * 0.85,
        maxWidth: 350,
        marginBottom: 16,
        minHeight: 56,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
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
        fontFamily: 'System',
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    signUpButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: width * 0.85,
        maxWidth: 350,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'System',
        fontWeight: '600',
        color: '#FFFFFF',
    },
    logInButton: {
        borderWidth: 2,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: width * 0.85,
        maxWidth: 350,
        alignItems: 'center',
    },
    logInButtonText: {
        fontSize: 16,
        fontFamily: 'System',
        fontWeight: '600',
    },
});
