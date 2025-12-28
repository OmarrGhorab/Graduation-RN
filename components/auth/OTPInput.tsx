import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, Pressable, Text, Animated } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

// Unified OTP Input sizes
const OTP_BOX_SIZE = 50;
const OTP_BOX_GAP = 12;
const OTP_FONT_SIZE = 22;
const OTP_BORDER_RADIUS = 12;

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
    const hiddenInputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const cursorAnim = useRef(new Animated.Value(1)).current;
    const styles = createStyles(theme, isDark);

    // Auto-focus on mount
    useEffect(() => {
        if (autoFocus) {
            setTimeout(() => {
                hiddenInputRef.current?.focus();
            }, 100);
        }
    }, [autoFocus]);

    // Blinking cursor animation
    useEffect(() => {
        if (isFocused) {
            const blink = Animated.loop(
                Animated.sequence([
                    Animated.timing(cursorAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(cursorAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            blink.start();
            return () => blink.stop();
        } else {
            cursorAnim.setValue(0);
        }
    }, [isFocused, cursorAnim]);

    const handlePress = () => {
        hiddenInputRef.current?.focus();
    };

    const handleChange = (value: string) => {
        // Only allow digits, max length
        const digits = value.replace(/[^0-9]/g, '').slice(0, length);
        
        // Convert to array
        const newOtp = Array(length).fill('');
        digits.split('').forEach((digit, index) => {
            newOtp[index] = digit;
        });
        
        onOtpChange(newOtp);
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const otpValue = otp.join('');
    const currentIndex = otpValue.length;

    return (
        <View style={styles.container}>
            {/* Hidden input that captures all keyboard input */}
            <TextInput
                ref={hiddenInputRef}
                style={styles.hiddenInput}
                value={otpValue}
                onChangeText={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                keyboardType="number-pad"
                maxLength={length}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                caretHidden
            />
            
            {/* Visual OTP boxes */}
            <Pressable style={styles.boxContainer} onPress={handlePress}>
                {otp.map((digit, index) => {
                    const isCurrentIndex = currentIndex === index && isFocused;
                    const isFilled = !!digit;
                    const isActive = isFocused && (index === currentIndex || (currentIndex === length && index === length - 1));
                    
                    return (
                        <View
                            key={index}
                            style={[
                                styles.box,
                                isFilled && styles.boxFilled,
                                isActive && styles.boxActive,
                            ]}
                        >
                            {digit ? (
                                <Text style={styles.digit}>{digit}</Text>
                            ) : isCurrentIndex ? (
                                <Animated.View 
                                    style={[
                                        styles.cursor,
                                        { opacity: cursorAnim }
                                    ]} 
                                />
                            ) : null}
                        </View>
                    );
                })}
            </Pressable>
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        container: {
            marginBottom: 32,
        },
        hiddenInput: {
            position: 'absolute',
            opacity: 0,
            height: 1,
            width: 1,
        },
        boxContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: OTP_BOX_GAP,
        },
        box: {
            width: OTP_BOX_SIZE,
            height: OTP_BOX_SIZE,
            borderWidth: 1.5,
            borderRadius: OTP_BORDER_RADIUS,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            borderColor: isDark ? theme.border : '#E0E0E0',
        },
        boxFilled: {
            borderColor: theme.primary,
            backgroundColor: isDark ? theme.surfaceVariant : '#F0FBF6',
        },
        boxActive: {
            borderColor: theme.primary,
            borderWidth: 2,
        },
        digit: {
            fontSize: OTP_FONT_SIZE,
            fontFamily: Fonts?.semiBold,
            textAlign: 'center',
            color: theme.text,
        },
        cursor: {
            width: 2,
            height: OTP_FONT_SIZE,
            backgroundColor: theme.primary,
            borderRadius: 1,
        },
    });
