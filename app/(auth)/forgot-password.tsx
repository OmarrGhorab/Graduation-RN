import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    
    const [email, setEmail] = useState('');

    const handleContinue = () => {
        console.log('Continue with email:', email);
        // Navigate to verification code screen
        router.push('/verification');
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

                {/* Title and Subtitle */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: cskColors[500] }]}>Forgot Password</Text>
                    <Text style={[styles.subtitle, { color: '#888' }]}>
                        Enter your email address We will send an OTP code for verification in the next step.
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.labelContainer}>
                            <Text style={[styles.label, { color: '#888', backgroundColor: theme.background }]}>Email / Username</Text>
                        </View>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: '#ccc' }]}
                            placeholder="smantha@mail.com"
                            placeholderTextColor="#A0A0A0"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[styles.continueButton, { backgroundColor: cskColors[500] }]}
                        onPress={handleContinue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Continue</Text>
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
    },
    header: {
        marginBottom: 30,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    titleContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        fontFamily: 'System', 
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'System',
    },
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
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        height: 50,
    },
    spacer: {
        height: height * 0.3, // Push button down like in screenshot
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
        marginBottom: 0,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
