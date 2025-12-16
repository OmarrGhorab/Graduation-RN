import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function ResetSuccessScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    
    const handleGoToLogin = () => {
        // Navigate back to login
        router.push('/signin');
    };

    const handleBack = () => {
        // In success screen, back usually goes to login or dashboard, but for consistency with UI flow:
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
            
            {/* Modal-like Card */}
            <View style={styles.modalContainer}>
                <View style={[styles.card, { backgroundColor: theme.background }]}>
                    
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                         <Image
                            source={require('@/assets/images/reset-successful.png')}
                            style={styles.successIcon}
                            resizeMode="contain"
                        />
                        {/* If we had the specific success checkmark image, we would use it here. 
                            Using logo-green as fallback/placeholder or 'reset-successful.png' if available.
                            Wait, file list showed 'reset-successful.png'!
                        */}
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: cskColors[500] }]}>Reset Password Successful!</Text>
                    
                    {/* Subtitle */}
                    <Text style={[styles.subtitle, { color: '#666' }]}>
                        our password has been successfully changed.
                    </Text>

                    {/* Go To Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: cskColors[500] }]}
                        onPress={handleGoToLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>Go To Log in</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Confirm Button (Outside Card - as per screenshot design, there seems to be a Confirm button at bottom of screen too? 
                    Actually, the screenshot shows the modal OVER the previous screen, and the previous screen's "Confirm" button is visible at the bottom dimmed out.
                    But to keep it simple, I'll just make this a full screen page that looks like a modal or just the success content.
                    The screenshot "reset password success" shows a white card centered on a dimmed background.
                    Let's replicate that look.
                */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    card: {
        width: '100%',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: 24,
    },
    successIcon: {
        width: 80,
        height: 80,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
        fontFamily: 'System', 
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'System',
        paddingHorizontal: 20,
    },
    loginButton: {
        width: '100%',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
