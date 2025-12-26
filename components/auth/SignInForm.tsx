import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

interface SignInFormProps {
    theme: Theme;
    isDark: boolean;
    email: string;
    password: string;
    showPassword: boolean;
    isLoading: boolean;
    onEmailChange: (text: string) => void;
    onPasswordChange: (text: string) => void;
    onTogglePassword: () => void;
    onForgotPassword: () => void;
    onLogin: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
    theme,
    isDark,
    email,
    password,
    showPassword,
    isLoading,
    onEmailChange,
    onPasswordChange,
    onTogglePassword,
    onForgotPassword,
    onLogin,
}) => {
    const styles = createStyles(theme, isDark);

    return (
        <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>Email / Username</Text>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="smantha@mail.com"
                    placeholderTextColor={theme.icon}
                    value={email}
                    onChangeText={onEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>Password</Text>
                </View>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="* * * *"
                        placeholderTextColor={theme.icon}
                        value={password}
                        onChangeText={onPasswordChange}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={theme.icon}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forgot password ?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={onLogin}
                activeOpacity={0.8}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                    <Text style={styles.loginButtonText}>Login</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
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
            backgroundColor: theme.background,
        },
        label: {
            fontSize: 12,
            fontFamily: Fonts?.medium,
            color: theme.icon,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            fontFamily: Fonts?.regular,
            height: 50,
            color: theme.text,
            backgroundColor: theme.background,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            height: 50,
            paddingHorizontal: 16,
            backgroundColor: theme.background,
        },
        passwordInput: {
            flex: 1,
            fontSize: 16,
            fontFamily: Fonts?.regular,
            height: '100%',
            color: theme.text,
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
            fontFamily: Fonts?.semiBold,
            color: theme.primary,
        },
        loginButton: {
            backgroundColor: theme.primary,
            borderRadius: 8,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        loginButtonText: {
            color: theme.onPrimary,
            fontSize: 16,
            fontFamily: Fonts?.bold,
        },
        loginButtonDisabled: {
            opacity: 0.7,
        },
    });
