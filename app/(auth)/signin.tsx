import { useRouter, Href } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors } from '@/constants/theme';
import { googleSignIn, configureGoogleSignIn, login, requiresDeviceVerification } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { LoginSuccessResponse } from '@/types/auth';

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast, error } = useToast();

    // Configure Google Sign-In on component mount
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
                console.log('Backend auth successful:', data);
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

        // Check if 2FA is required for Google sign-in
        if (result.requires2FA && result.data) {
            navigateTo2FA(result.data);
        }

        // Check if device verification is required for Google sign-in
        if (result.requiresDeviceVerification && result.deviceFingerprint) {
            showToast('info', 'New Device Detected', 'Please verify this device using the code sent to your email.');
            router.push({
                pathname: '/device-verification',
                params: {
                    emailOrUsername: result.emailOrUsername || '',
                    deviceFingerprint: result.deviceFingerprint,
                }
            } as any);
        }

        setIsGoogleLoading(false);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            error('Missing fields', 'Email and password are required');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login({ emailOrUsername: email, password });

            // If we got a response but it's a verification required error
            if ('requiresVerification' in result && result.requiresVerification) {
                router.push({
                    pathname: '/verification',
                    params: { email }
                } as any);
                return;
            }

            // Check if 2FA is required (twoFactorEnabled is inside user object)
            if ('user' in result && (result.user as any)?.twoFactorEnabled) {
                navigateTo2FA(result);
                return;
            }

            // At this point it's a LoginSuccessResponse
            const successData = result as LoginSuccessResponse;
            if (successData.user.onboardingCompleted) {
                router.replace('/home' as Href);
            } else {
                router.replace('/onboarding/step1' as Href);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const responseData = err.responseData;

            // Check if 2FA is required from error response (twoFactorEnabled is inside user object)
            if (responseData?.user?.twoFactorEnabled) {
                navigateTo2FA(responseData);
                return;
            }

            // Check if device verification is required
            if (responseData && requiresDeviceVerification(responseData)) {
                showToast('info', 'New Device Detected', 'Please verify this device using the code sent to your email.');
                router.push({
                    pathname: '/device-verification',
                    params: {
                        emailOrUsername: email,
                        deviceFingerprint: responseData.deviceFingerprint,
                    }
                } as any);
                return;
            }

            error('Login failed', err.message || 'Check your credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        router.push('/signup');
    };

    const handleForgotPassword = () => {
        router.push('/forgot-password');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Logo/Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('@/assets/images/logo-green.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: cskColors[500] }]}>Log In</Text>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>Email / Username</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: '#ccc' }]}
                            placeholder="smantha@mail.com"
                            placeholderTextColor="#A0A0A0"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>Password</Text>
                        </View>
                        <View style={[styles.passwordContainer, { borderColor: '#ccc' }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: theme.text }]}
                                placeholder="* * * *"
                                placeholderTextColor="#A0A0A0"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#A0A0A0" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
                        <Text style={[styles.forgotPasswordText, { color: cskColors[500] }]}>Forgot password ?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            { backgroundColor: cskColors[500] },
                            isLoading && styles.loginButtonDisabled
                        ]}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Login</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Button */}
                    <TouchableOpacity
                        style={[
                            styles.googleButton,
                            { borderColor: cskColors[500] },
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
                                <Text style={[styles.googleButtonText, { color: cskColors[500] }]}>
                                    Continue With Google
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: '#A0A0A0' }]}>Don&apos;t have an account? </Text>
                        <TouchableOpacity onPress={handleSignUp}>
                            <Text style={[styles.signUpText, { color: cskColors[500] }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    imageContainer: {
        alignItems: 'center',
        marginTop: height * 0.05,
        marginBottom: 20,
    },
    logo: {
        width: width * 0.5,
        height: height * 0.2,
        maxWidth: 200,
        maxHeight: 200,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 30,
        fontFamily: 'System',
    },
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
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        height: 50,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        height: 50,
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#A0A0A0',
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
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
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
    },
    signUpText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
