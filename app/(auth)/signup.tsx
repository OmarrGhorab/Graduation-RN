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
    useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors } from '@/constants/theme';
import { googleSignIn, configureGoogleSignIn, register } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { RegisterRequest } from '@/types/auth';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { success, error } = useToast();
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const handleSignUp = async () => {
        setSuggestions([]); // Clear previous suggestions
        if (!fullName || !username || !email || !password) {
            error('Missing fields', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const data = await register({
                name: fullName,
                username: username,
                email: email,
                password: password
            });

            success('Account created', data.message || 'Verification code sent');
            // After successful sign up, redirect to verification with email
            router.push({
                pathname: '/verification',
                params: { email }
            } as any);
        } catch (err: any) {
            console.error('Signup error:', err);
            const errorMsg = err.message || 'Registration failed';

            // Handle username suggestions if present in the error response
            if (err.responseData?.suggestions && Array.isArray(err.responseData.suggestions)) {
                setSuggestions(err.responseData.suggestions);
                // Don't append to toast, just show the base error
                error('Username taken', errorMsg);
            } else {
                error('Registration failed', errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setUsername(suggestion);
        setSuggestions([]);
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

        setIsGoogleLoading(false);
    };

    const handleSignIn = () => {
        router.push('/signin');
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
                <Text style={[styles.title, { color: cskColors[500] }]}>Sign Up</Text>

                {/* Form */}
                <View style={styles.form}>

                    {/* Full Name Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>Full Name</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: '#ccc' }]}
                            placeholder="Enter your full name"
                            placeholderTextColor="#A0A0A0"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Username Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>Username</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: '#ccc' }]}
                            placeholder="Choose a unique username"
                            placeholderTextColor="#A0A0A0"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <Text style={styles.suggestionsLabel}>Username taken. Try one of these:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                                {suggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionChip}
                                        onPress={() => handleSuggestionClick(suggestion)}
                                    >
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Email Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>Email / Username</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: '#ccc' }]}
                            placeholder="Enter your email address"
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
                                placeholder="Create a password"
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

                    {/* Create Account Button */}
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: cskColors[500] }, isLoading && { opacity: 0.7 }]}
                        onPress={handleSignUp}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.createButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    {/* Footer / Login Link */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: '#A0A0A0' }]}>Already have an account? </Text>
                        <TouchableOpacity onPress={handleSignIn}>
                            <Text style={[styles.signInText, { color: cskColors[500] }]}>Log In</Text>
                        </TouchableOpacity>
                    </View>

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
                                <Text style={[styles.googleButtonText, { color: cskColors[500] }]}>Continue With Google</Text>
                            </>
                        )}
                    </TouchableOpacity>
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
    createButton: {
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginTop: 10,
    },
    createButtonText: {
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
        marginBottom: 24,
    },
    footerText: {
        fontSize: 14,
    },
    signInText: {
        fontSize: 14,
        fontWeight: '700',
    },
    suggestionsContainer: {
        marginBottom: 20,
        marginTop: -10,
    },
    suggestionsLabel: {
        fontSize: 14,
        color: '#FF4444',
        marginBottom: 8,
        fontWeight: '500',
    },
    suggestionsScroll: {
        flexDirection: 'row',
    },
    suggestionChip: {
        backgroundColor: cskColors[50], // Light version of primary color
        borderWidth: 1,
        borderColor: cskColors[200],
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    suggestionText: {
        color: cskColors[500],
        fontSize: 14,
        fontWeight: '600',
    },
});
