import React, { useRef, useEffect } from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

interface OTPInputProps {
    theme: Theme;
    isDark: boolean;
    otp: string[];
    length?: number;
    onOtpChange: (otp: string[]) => void;
    autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
    theme,
    isDark,
    otp,
    length = 6,
    onOtpChange,
    autoFocus = true,
}) => {
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const styles = createStyles(theme, isDark);

    // Auto-focus first input on mount
    useEffect(() => {
        if (autoFocus) {
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [autoFocus]);

    const focusInput = (index: number) => {
        if (index >= 0 && index < length) {
            inputRefs.current[index]?.focus();
        }
    };

    const handleChange = (value: string, index: number) => {
        // Only allow digits
        const digit = value.replace(/[^0-9]/g, '');

        if (digit.length > 1) {
            // Handle paste - distribute digits across inputs
            const digits = digit.split('').slice(0, length);
            const newOtp = [...otp];
            digits.forEach((d, i) => {
                if (index + i < length) {
                    newOtp[index + i] = d;
                }
            });
            onOtpChange(newOtp);
            focusInput(Math.min(index + digits.length, length - 1));
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = digit;
        onOtpChange(newOtp);

        // Move to next input if digit entered
        if (digit && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace') {
            if (otp[index]) {
                // Clear current input
                const newOtp = [...otp];
                newOtp[index] = '';
                onOtpChange(newOtp);
            } else if (index > 0) {
                // Move to previous input and clear it
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                onOtpChange(newOtp);
                focusInput(index - 1);
            }
        }
    };

    const handleFocus = (index: number) => {
        // If tapping on an empty input and there are empty inputs before it,
        // focus the first empty input instead
        const firstEmptyIndex = otp.findIndex((d) => !d);
        if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
            focusInput(firstEmptyIndex);
        }
    };

    return (
        <View style={styles.container}>
            {otp.map((digit, index) => (
                <Pressable key={index} onPress={() => focusInput(index)}>
                    <TextInput
                        ref={(ref) => {
                            inputRefs.current[index] = ref;
                        }}
                        style={[
                            styles.input,
                            digit ? styles.inputFilled : styles.inputEmpty,
                        ]}
                        value={digit}
                        onChangeText={(value) => handleChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        onFocus={() => handleFocus(index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        caretHidden
                    />
                </Pressable>
            ))}
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: 40,
            gap: 10,
        },
        input: {
            width: 48,
            height: 48,
            borderWidth: 1.5,
            borderRadius: 8,
            fontSize: 18,
            fontFamily: Fonts?.semiBold,
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 0,
            paddingHorizontal: 0,
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            color: theme.text,
        },
        inputEmpty: {
            borderColor: isDark ? theme.border : '#E0E0E0',
        },
        inputFilled: {
            borderColor: theme.primary,
            backgroundColor: isDark ? theme.surfaceVariant : '#F0FBF6',
        },
    });
