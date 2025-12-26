import React, { useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

interface VerificationFormProps {
    theme: Theme;
    isDark: boolean;
    otp: string[];
    loading: boolean;
    timer: number;
    onOtpChange: (value: string, index: number) => void;
    onBackspace: (key: string, index: number) => void;
    onContinue: () => void;
    onResend: () => void;
    inputRefs: React.MutableRefObject<Array<TextInput | null>>;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
    theme,
    isDark,
    otp,
    loading,
    timer,
    onOtpChange,
    onBackspace,
    onContinue,
    onResend,
    inputRefs,
}) => {
    const styles = createStyles(theme, isDark);
    const formattedTimer = `00:${timer < 10 ? `0${timer}` : timer}`;

    return (
        <View style={styles.form}>
            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => { inputRefs.current[index] = ref; }}
                        style={styles.otpInput}
                        value={digit}
                        onChangeText={(value) => onOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) => onBackspace(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                    />
                ))}
            </View>

            {/* Continue Button */}
            <TouchableOpacity
                style={[styles.continueButton, loading && styles.continueButtonDisabled]}
                onPress={onContinue}
                activeOpacity={0.8}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.onPrimary} />
                ) : (
                    <Text style={styles.continueButtonText}>Continue</Text>
                )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
                <Text style={styles.resendLabel}>Did not receive the code?</Text>
                {timer === 0 ? (
                    <TouchableOpacity onPress={onResend} disabled={loading}>
                        <Text style={styles.resendLink}>Send Again</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.timerText}>{formattedTimer}</Text>
                )}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        form: {
            width: '100%',
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
            borderColor: theme.primary,
            borderRadius: 8,
            fontSize: 18,
            fontFamily: Fonts?.semiBold,
            textAlign: 'center',
            textAlignVertical: 'center',
            color: theme.primary,
            backgroundColor: theme.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        continueButton: {
            backgroundColor: theme.primary,
            borderRadius: 8,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 24,
        },
        continueButtonText: {
            color: theme.onPrimary,
            fontSize: 16,
            fontFamily: Fonts?.bold,
        },
        continueButtonDisabled: {
            opacity: 0.7,
        },
        resendContainer: {
            alignItems: 'center',
        },
        resendLabel: {
            fontSize: 14,
            fontFamily: Fonts?.regular,
            color: theme.icon,
            marginBottom: 8,
        },
        resendLink: {
            fontSize: 14,
            fontFamily: Fonts?.bold,
            color: theme.primary,
        },
        timerText: {
            fontSize: 16,
            fontFamily: Fonts?.bold,
            color: theme.primary,
            marginTop: 2,
        },
    });
