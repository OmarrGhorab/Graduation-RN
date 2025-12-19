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
import { forgotPassword } from '@/services/AuthService';
import { useToast } from '@/components/toast';

const { width, height } = Dimensions.get('window');

export default function VerifyResetOTPScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const { email } = useLocalSearchParams<{ email: string }>();
    const { success, error, info } = useToast();
    const [loading, setLoading] = useState(false);

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
    }

    const handleContinue = async () => {
        const otpValue = otp.join('');
        if (otpValue.length < 6) {
            error('Invalid Code', 'Please enter the full 6-digit code');
            return;
        }

        if (!email) {
            error('Error', 'Missing email address');
            return;
        }

        // Simply navigate to reset password with the OTP
        // The actual validation will happen when they submit the new password
        success('Code Verified', 'Please enter your new password');
        router.replace({
            pathname: '/reset-password',
            params: { email, otp: otpValue }
        } as any);
    };

    const handleResend = async () => {
        if (timer === 0 && email) {
            setLoading(true);
            try {
                const result = await forgotPassword({ email });
                success('Code Sent', result.message || 'A new code has been sent to your email');
                setTimer(60);
                // Clear OTP inputs
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } catch (err: any) {
                console.error('Resend OTP error:', err);
                error('Error', err.message || 'Failed to resend code');
            } finally {
                setLoading(false);
            }
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

                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('@/assets/images/logo-green.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>

                {/* Title and Subtitle */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: cskColors[500] }]}>Verify OTP Code</Text>
                    <Text style={[styles.subtitle, { color: '#888' }]}>
                        Please enter the security code sent to your email to reset your password.
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
                                    borderColor: cskColors[500], // Green border
                                    color: cskColors[500] // Green text
                                }
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: cskColors[500] }]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.continueButtonText}>Continue</Text>
                    )}
                </TouchableOpacity>

                {/* Resend Code */}
                <View style={styles.resendContainer}>
                    <Text style={[styles.resendLabel, { color: '#888' }]}>Did not receive the code?</Text>
                    {timer === 0 ? (
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={[styles.resendLink, { color: cskColors[500] }]}>Send Again</Text>
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
    imageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    illustration: {
        width: width * 0.6,
        height: height * 0.25,
        marginBottom: 10,
    },
    timerText: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'System',
        marginTop: 10,
    },
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        fontFamily: 'System',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'System',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    otpInput: {
        width: 45,
        height: 50,
        borderWidth: 1,
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
    continueButton: {
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
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
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
});
