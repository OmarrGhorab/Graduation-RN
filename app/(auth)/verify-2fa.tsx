import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors, grayColors } from '@/constants/theme';
import { verify2FALogin } from '@/services/SecurityService';
import { useToast } from '@/components/toast';
import { useAuthStore } from '@/libs/auth';

const { width } = Dimensions.get('window');

export default function Verify2FAScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const { setAuth } = useAuthStore();
    const toast = useToast();

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isBackupMode, setIsBackupMode] = useState(false);
    const [backupCode, setBackupCode] = useState('');
    
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Get auth data from params
    const accessToken = params.accessToken as string;
    const refreshToken = params.refreshToken as string;
    const userData = params.user ? JSON.parse(params.user as string) : null;

    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];
        
        // Handle paste (multiple characters)
        if (text.length > 1) {
            const chars = text.slice(0, 6).split('');
            chars.forEach((char, i) => {
                if (index + i < 6) {
                    newCode[index + i] = char;
                }
            });
            setCode(newCode);
            // Focus last filled input or next empty
            const lastIndex = Math.min(index + chars.length - 1, 5);
            inputRefs.current[lastIndex]?.focus();
            return;
        }

        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const getFullCode = () => {
        return isBackupMode ? backupCode : code.join('');
    };

    const handleVerify = async () => {
        const token = getFullCode();
        
        if (!isBackupMode && token.length !== 6) {
            toast.error('Invalid Code', 'Please enter a 6-digit code');
            return;
        }

        if (isBackupMode && token.length !== 8) {
            toast.error('Invalid Code', 'Please enter an 8-character backup code');
            return;
        }

        if (!accessToken) {
            toast.error('Error', 'Authentication data missing. Please try logging in again.');
            router.replace('/login' as Href);
            return;
        }

        setIsVerifying(true);
        try {
            const response = await verify2FALogin(token, accessToken);
            
            // Use response tokens (backend returns new tokens after 2FA verification)
            const finalAccessToken = response.accessToken || accessToken;
            const finalRefreshToken = response.refreshToken || refreshToken;
            const user = response.user || userData;
            
            if (user && finalAccessToken) {
                setAuth(user, finalAccessToken, finalRefreshToken);
            }

            toast.success('Success', 'Login successful');

            if (user?.onboardingCompleted) {
                router.replace('/home' as Href);
            } else {
                router.replace('/onboarding/step1' as Href);
            }
        } catch (err: any) {
            console.error('2FA verification error:', err);
            toast.error('Verification Failed', err.message || 'Invalid code. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const toggleBackupMode = () => {
        setIsBackupMode(!isBackupMode);
        setCode(['', '', '', '', '', '']);
        setBackupCode('');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: cskColors[50] }]}>
                    <Ionicons name="shield-checkmark" size={48} color={cskColors[500]} />
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: theme.text }]}>
                    Two-Factor Authentication
                </Text>
                <Text style={[styles.subtitle, { color: grayColors[500] }]}>
                    {isBackupMode 
                        ? 'Enter one of your backup codes to verify your identity'
                        : 'Enter the 6-digit code from your authenticator app'
                    }
                </Text>

                {/* Code Input */}
                {isBackupMode ? (
                    <TextInput
                        style={[styles.backupInput, { color: theme.text, borderColor: grayColors[300] }]}
                        value={backupCode}
                        onChangeText={setBackupCode}
                        placeholder="Enter backup code"
                        placeholderTextColor={grayColors[400]}
                        maxLength={8}
                        autoCapitalize="characters"
                        autoFocus
                    />
                ) : (
                    <View style={styles.codeContainer}>
                        {code.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[
                                    styles.codeInput,
                                    { 
                                        color: theme.text, 
                                        borderColor: digit ? cskColors[500] : grayColors[300],
                                        backgroundColor: digit ? cskColors[50] : 'transparent'
                                    }
                                ]}
                                value={digit}
                                onChangeText={(text) => handleCodeChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={6}
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                    style={[
                        styles.verifyButton,
                        { backgroundColor: cskColors[500] },
                        (isVerifying || getFullCode().length < (isBackupMode ? 8 : 6)) && styles.verifyButtonDisabled
                    ]}
                    onPress={handleVerify}
                    disabled={isVerifying || getFullCode().length < (isBackupMode ? 8 : 6)}
                >
                    {isVerifying ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.verifyButtonText}>Verify</Text>
                    )}
                </TouchableOpacity>

                {/* Toggle Backup Mode */}
                <TouchableOpacity onPress={toggleBackupMode} style={styles.toggleButton}>
                    <Text style={[styles.toggleText, { color: cskColors[500] }]}>
                        {isBackupMode ? 'Use authenticator code instead' : 'Use a backup code instead'}
                    </Text>
                </TouchableOpacity>

                {/* Help Text */}
                <View style={styles.helpContainer}>
                    <Ionicons name="information-circle-outline" size={18} color={grayColors[400]} />
                    <Text style={[styles.helpText, { color: grayColors[500] }]}>
                        {isBackupMode 
                            ? 'Backup codes are 8 characters long and can only be used once'
                            : 'Open your authenticator app to view your verification code'
                        }
                    </Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        paddingTop: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 32,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
    },
    backupInput: {
        width: '100%',
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 4,
        marginBottom: 32,
    },
    verifyButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    verifyButtonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    toggleButton: {
        paddingVertical: 12,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    helpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 20,
        gap: 8,
    },
    helpText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
});
