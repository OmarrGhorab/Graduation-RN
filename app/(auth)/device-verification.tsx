import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
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
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors } from '@/constants/theme';
import { verifyDevice, resendDeviceVerificationOTP } from '@/services/AuthService';
import { useToast } from '@/components/toast';

const { width, height } = Dimensions.get('window');

export default function DeviceVerificationScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const { emailOrUsername, deviceFingerprint } = useLocalSearchParams<{
        emailOrUsername: string;
        deviceFingerprint: string;
    }>();
    const { success, error, info } = useToast();
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    // OTP State (6 digits)
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);

    // Refs for inputs to manage focus
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleBackspace = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const navigateTo2FA = (authData: any) => {
        router.push({
            pathname: '/verify-2fa',
            params: {
                accessToken: authData.accessToken || '',
                refreshToken: authData.refreshToken || '',
                user: authData.user ? JSON.stringify(authData.user) : '',
                emailOrUsername: authData.emailOrUsername || emailOrUsername,
            }
        } as any);
    };

    const handleVerify = async () => {
        const otpValue = otp.join('');
        if (otpValue.length < 6) {
            error('Invalid Code', 'Please enter the full 6-digit code');
            return;
        }

        if (!emailOrUsername || !deviceFingerprint) {
            error('Error', 'Missing verification data. Please try logging in again.');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyDevice({
                emailOrUsername,
                deviceFingerprint,
                otp: otpValue,
            });

            // Check if 2FA is required after device verification
            if (result.requires2FA) {
                navigateTo2FA(result);
                return;
            }

            // Ensure tokens are persisted before navigation
            await new Promise(resolve => setTimeout(resolve, 200));
            
            success('Device Verified', result.message || 'Device verified successfully');

            // Device verified and logged in - navigate based on onboarding status
            if (result.user?.onboardingCompleted) {
                router.replace('/home' as Href);
            } else {
                router.replace('/onboarding/step1' as Href);
            }
        } catch (err: any) {
            console.error('Device verification error:', err);
            error('Verification Failed', err.message || 'Please check the code and try again');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0 || !emailOrUsername || !deviceFingerprint) return;

        setResending(true);
        try {
            const result = await resendDeviceVerificationOTP({
                emailOrUsername,
                deviceFingerprint,
            });
            success('Code Sent', result.message || 'A new verification code has been sent to your email');
            setTimer(60);
            setOtp(['', '', '', '', '', '']);
        } catch (err: any) {
            console.error('Resend OTP error:', err);
            error('Error', err.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    // Format timer as MM:SS
    const formattedTimer = `00:${timer < 10 ? `0${timer}` : timer}`;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header with Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Icon */}
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: cskColors[100] }]}>
                        <Ionicons name="phone-portrait-outline" size={48} color={cskColors[500]} />
                    </View>
                </View>

                {/* Title and Subtitle */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: cskColors[500] }]}>New Device Detected</Text>
                    <Text style={[styles.subtitle, { color: '#888' }]}>
                        We noticed you're logging in from a new device. For your security, please enter the verification code sent to your email.
                    </Text>
                </View>

                {/* OTP Inputs */}
                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            style={[
                                styles.otpInput,
                                {
                                    borderColor: digit ? cskColors[500] : '#ccc',
                                    color: cskColors[500]
                                }
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                            editable={!loading}
                        />
                    ))}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                    style={[
                        styles.verifyButton,
                        { backgroundColor: cskColors[500] },
                        loading && styles.buttonDisabled
                    ]}
                    onPress={handleVerify}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.verifyButtonText}>Verify Device</Text>
                    )}
                </TouchableOpacity>

                {/* Resend Code */}
                <View style={styles.resendContainer}>
                    <Text style={[styles.resendLabel, { color: '#888' }]}>Didn't receive the code?</Text>
                    {timer === 0 ? (
                        <TouchableOpacity onPress={handleResend} disabled={resending}>
                            {resending ? (
                                <ActivityIndicator size="small" color={cskColors[500]} />
                            ) : (
                                <Text style={[styles.resendLink, { color: cskColors[500] }]}>Send Again</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.timerText, { color: cskColors[500] }]}>{formattedTimer}</Text>
                    )}
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        fontFamily: 'System',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'System',
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    otpInput: {
        width: 45,
        height: 50,
        borderWidth: 1.5,
        borderRadius: 8,
        fontSize: 18,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontWeight: '600',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    verifyButton: {
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 24,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    resendContainer: {
        alignItems: 'center',
    },
    resendLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '700',
    },
    timerText: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'System',
        marginTop: 4,
    },
});
