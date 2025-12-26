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
import { useTranslation } from '@/hooks/useTranslation';

type Theme = typeof Colors.light | typeof Colors.dark;

interface SignUpFormProps {
    theme: Theme;
    isDark: boolean;
    fullName: string;
    username: string;
    email: string;
    password: string;
    showPassword: boolean;
    isLoading: boolean;
    isCheckingUsername: boolean;
    usernameError: string;
    usernameAvailable: boolean;
    suggestions: string[];
    onFullNameChange: (text: string) => void;
    onUsernameChange: (text: string) => void;
    onEmailChange: (text: string) => void;
    onPasswordChange: (text: string) => void;
    onTogglePassword: () => void;
    onSuggestionClick: (suggestion: string) => void;
    onSignUp: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
    theme,
    isDark,
    fullName,
    username,
    email,
    password,
    showPassword,
    isLoading,
    isCheckingUsername,
    usernameError,
    usernameAvailable,
    suggestions,
    onFullNameChange,
    onUsernameChange,
    onEmailChange,
    onPasswordChange,
    onTogglePassword,
    onSuggestionClick,
    onSignUp,
}) => {
    const { t, textAlign } = useTranslation();
    const styles = createStyles(theme, isDark);

    return (
        <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{t('auth.fullName')}</Text>
                </View>
                <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder={t('auth.fullNamePlaceholder')}
                    placeholderTextColor={theme.icon}
                    value={fullName}
                    onChangeText={onFullNameChange}
                    autoCapitalize="words"
                />
            </View>

            {/* Username Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{t('auth.username')}</Text>
                </View>
                <View style={styles.usernameInputContainer}>
                    <TextInput
                        style={[
                            styles.input,
                            { textAlign },
                            usernameError && styles.inputError,
                            usernameAvailable && username && styles.inputSuccess,
                        ]}
                        placeholder={t('auth.usernamePlaceholder')}
                        placeholderTextColor={theme.icon}
                        value={username}
                        onChangeText={onUsernameChange}
                        autoCapitalize="none"
                    />
                    {isCheckingUsername && (
                        <View style={styles.usernameStatusIcon}>
                            <ActivityIndicator size="small" color={theme.primary} />
                        </View>
                    )}
                    {!isCheckingUsername && usernameAvailable && username && (
                        <View style={styles.usernameStatusIcon}>
                            <Ionicons name="checkmark-circle" size={20} color={theme.csk[500]} />
                        </View>
                    )}
                    {!isCheckingUsername && usernameError && username && (
                        <View style={styles.usernameStatusIcon}>
                            <Ionicons name="close-circle" size={20} color={theme.error[500]} />
                        </View>
                    )}
                </View>
                {usernameError && (
                    <Text style={styles.errorText}>{usernameError}</Text>
                )}
                {usernameAvailable && username && (
                    <Text style={styles.successText}>{t('auth.usernameAvailable')}</Text>
                )}
            </View>

            {/* Username Suggestions */}
            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>{t('auth.suggestions')}</Text>
                    <View style={styles.suggestionsRow}>
                        {suggestions.map((suggestion, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.suggestionChip, { backgroundColor: theme.primary }]}
                                onPress={() => onSuggestionClick(suggestion)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{t('auth.email')}</Text>
                </View>
                <TextInput
                    style={[styles.input, { textAlign }]}
                    placeholder={t('auth.emailInputPlaceholder')}
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
                    <Text style={styles.label}>{t('auth.password')}</Text>
                </View>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.passwordInput, { textAlign }]}
                        placeholder={t('auth.createPassword')}
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

            {/* Create Account Button */}
            <TouchableOpacity
                style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                onPress={onSignUp}
                activeOpacity={0.8}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                    <Text style={styles.createButtonText}>{t('auth.createAccount')}</Text>
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
        inputError: {
            borderColor: theme.error[500],
        },
        inputSuccess: {
            borderColor: theme.csk[500],
        },
        usernameInputContainer: {
            position: 'relative',
        },
        usernameStatusIcon: {
            position: 'absolute',
            right: 16,
            top: 15,
        },
        errorText: {
            fontSize: 12,
            fontFamily: Fonts?.regular,
            color: theme.error[500],
            marginTop: 4,
            marginLeft: 4,
        },
        successText: {
            fontSize: 12,
            fontFamily: Fonts?.regular,
            color: theme.csk[500],
            marginTop: 4,
            marginLeft: 4,
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
        createButton: {
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
            marginTop: 10,
        },
        createButtonText: {
            color: theme.onPrimary,
            fontSize: 16,
            fontFamily: Fonts?.bold,
        },
        createButtonDisabled: {
            opacity: 0.7,
        },
        suggestionsContainer: {
            marginBottom: 16,
            marginTop: 8,
        },
        suggestionsLabel: {
            fontSize: 12,
            fontFamily: Fonts?.medium,
            color: theme.icon,
            marginBottom: 8,
        },
        suggestionsRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        suggestionChip: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 2,
        },
        suggestionText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontFamily: Fonts?.semiBold,
        },
    });
