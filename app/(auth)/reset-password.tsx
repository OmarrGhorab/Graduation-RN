import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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
import { resetPassword } from '@/services/AuthService';
import { useToast } from '@/components/toast';

const { width, height } = Dimensions.get('window');

export default function ResetPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
    const { success, error } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        if (!password || !confirmPassword) {
            error('Required', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            error('Mismatch', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            error('Invalid', 'Password must be at least 6 characters');
            return;
        }

        if (!email || !otp) {
            error('Error', 'Missing session information. Please try again.');
            router.replace('/forgot-password');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword({
                email,
                otp,
                newPassword: password
            });
            success('Success', 'Your password has been reset successfully');
            router.replace('/signin');
        } catch (err: any) {
            console.error('Reset password error:', err);
            error('Reset Failed', err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

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

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: cskColors[500] }]}>Reset Password</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>PASSWORD</Text>
                        </View>
                        <View style={[styles.passwordContainer, { borderColor: '#ccc' }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: theme.text }]}
                                placeholder="* * * *"
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

                    {/* Confirm Password Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>CONFIRM PASSWORD</Text>
                        </View>
                        <View style={[styles.passwordContainer, { borderColor: '#ccc' }]}>
                            <TextInput
                                style={[styles.passwordInput, { color: theme.text }]}
                                placeholder="* * * *"
                                placeholderTextColor="#A0A0A0"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#A0A0A0" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.spacer} />

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            { backgroundColor: cskColors[500] },
                            isLoading && styles.confirmButtonDisabled
                        ]}
                        onPress={handleConfirm}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.confirmButtonText}>Confirm</Text>
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
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        fontFamily: 'System',
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 24,
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
        textTransform: 'uppercase',
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
    spacer: {
        height: 20,
    },
    confirmButton: {
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
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    confirmButtonDisabled: {
        opacity: 0.7,
    },
});
