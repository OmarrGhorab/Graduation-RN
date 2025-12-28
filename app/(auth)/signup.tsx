import { useRouter, Href } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { googleSignIn, configureGoogleSignIn, register } from '@/services/AuthService';
import { checkUsername } from '@/services/ProfileService';
import { useToast } from '@/components/toast';
import { SignUpHeader, SignUpForm, SignUpFooter } from '@/components/auth';
import { logger } from '@/libs/logger';

// ============================================================================
// Main Component
// ============================================================================

export default function SignUpScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { success, error } = useToast();

    // Form state
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Username validation states
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(false);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    // ========================================================================
    // Username Validation
    // ========================================================================

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (!username.trim()) {
            setUsernameError('');
            setUsernameAvailable(false);
            setSuggestions([]);
            setIsCheckingUsername(false);
            return;
        }

        setIsCheckingUsername(true);

        debounceTimeoutRef.current = setTimeout(() => {
            handleCheckUsername();
        }, 500);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [username]);

    const handleCheckUsername = async () => {
        if (!username.trim()) {
            setUsernameError('');
            setUsernameAvailable(false);
            setSuggestions([]);
            return;
        }

        try {
            setIsCheckingUsername(true);
            const result = await checkUsername(username);

            if (!result.available) {
                setUsernameError(result.message || 'Username is not available');
                setUsernameAvailable(false);
                setSuggestions(result.suggestions || []);
            } else {
                setUsernameError('');
                setUsernameAvailable(true);
                setSuggestions([]);
            }
        } catch (err: any) {
            console.error('Username check error:', err);
            setUsernameError(err.message || 'Failed to check username');
            setUsernameAvailable(false);
            setSuggestions([]);
        } finally {
            setIsCheckingUsername(false);
        }
    };

    // ========================================================================
    // Auth Handlers
    // ========================================================================

    const handleSignUp = async () => {
        if (!fullName || !username || !email || !password) {
            error('Missing fields', 'Please fill in all fields');
            return;
        }

        if (usernameError) {
            error('Invalid username', 'Please fix username errors');
            return;
        }

        setIsLoading(true);
        try {
            const data = await register({
                name: fullName,
                username: username,
                email: email,
                password: password,
            });

            success('Account created', data.message || 'Verification code sent');
            router.push({
                pathname: '/verification',
                params: { email },
            } as any);
        } catch (err: any) {
            console.error('Signup error:', err);
            const errorMsg = err.message || 'Registration failed';

            if (err.responseData?.suggestions && Array.isArray(err.responseData.suggestions)) {
                setSuggestions(err.responseData.suggestions);
                setUsernameError(errorMsg);
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
        setUsernameError('');
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);

        await googleSignIn({
            showAlerts: true,
            onSuccess: (data) => {
                logger.log('Google Sign-In successful:', data);
                const destination = data.user?.onboardingCompleted ? '/home' : '/onboarding/step1';
                router.replace(destination as Href);
            },
            onCancel: () => {
                logger.log('Google Sign-In cancelled');
            },
        });

        setIsGoogleLoading(false);
    };

    const handleSignIn = () => router.push('/signin');

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <SignUpHeader theme={theme} isDark={isDark} />

                <SignUpForm
                    theme={theme}
                    isDark={isDark}
                    fullName={fullName}
                    username={username}
                    email={email}
                    password={password}
                    showPassword={showPassword}
                    isLoading={isLoading}
                    isCheckingUsername={isCheckingUsername}
                    usernameError={usernameError}
                    usernameAvailable={usernameAvailable}
                    suggestions={suggestions}
                    onFullNameChange={setFullName}
                    onUsernameChange={setUsername}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onSuggestionClick={handleSuggestionClick}
                    onSignUp={handleSignUp}
                />

                <SignUpFooter
                    theme={theme}
                    isDark={isDark}
                    isGoogleLoading={isGoogleLoading}
                    onGoogleSignIn={handleGoogleSignIn}
                    onSignIn={handleSignIn}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
});
