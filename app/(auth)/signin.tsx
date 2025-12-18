import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
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
    useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { cskColors, Colors } from '@/constants/theme';
import {
    BASE_URL,
    GOOGLE_ANDROID_CLIENT_ID,
    GOOGLE_WEB_CLIENT_ID,
} from '@/constants/config';

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Google Sign-In hook using ID token flow without Expo Auth Proxy
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'graduation',
        path: 'oauthredirect'
    });
    console.log('Generated redirect URI:', redirectUri);
    
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        webClientId: GOOGLE_WEB_CLIENT_ID,
        redirectUri,
    });

    // Send ID token to backend
    const handleGoogleBackendAuth = useCallback(async (idToken: string) => {
        try {
            const backendResponse = await fetch(`${BASE_URL}/api/v1/auth/google/mobile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!backendResponse.ok) {
                const errorData = await backendResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${backendResponse.status}`);
            }

            const data = await backendResponse.json();
            console.log('Backend auth successful:', data);

            // Navigate to next screen on success
            router.push('/onboarding/step1');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to authenticate with server';
            Alert.alert('Authentication Error', errorMessage);
            console.error('Backend auth error:', error);
        } finally {
            setIsGoogleLoading(false);
        }
    }, [router]);

    // Handle Google Sign-In response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                handleGoogleBackendAuth(id_token);
            } else {
                setIsGoogleLoading(false);
                Alert.alert('Error', 'Failed to retrieve Google ID token. Please try again.');
            }
        } else if (response?.type === 'error') {
            setIsGoogleLoading(false);
            Alert.alert(
                'Google Sign-In Error',
                response.error?.message || 'An error occurred during Google Sign-In. Please try again.'
            );
        } else if (response?.type === 'dismiss') {
            setIsGoogleLoading(false);
        }
    }, [response, handleGoogleBackendAuth]);

    const handleLogin = () => {
        console.log('Login with:', email, password);
        router.push('/onboarding/step1');
        // Implement login logic here
    };

    const handleGoogleSignIn = async () => {
        if (!request) {
            Alert.alert('Error', 'Google Sign-In is not available. Please try again later.');
            return;
        }
        setIsGoogleLoading(true);
        try {
            await promptAsync();
        } catch (error) {
            setIsGoogleLoading(false);
            Alert.alert('Error', 'Failed to start Google Sign-In. Please try again.');
            console.error('Google Sign-In prompt error:', error);
        }
    };

    const handleSignUp = () => {
        // Navigate to sign up
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
                        style={[styles.loginButton, { backgroundColor: cskColors[500] }]}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
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
                        disabled={isGoogleLoading || !request}
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
        paddingTop: 8, // Make space for the label
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
