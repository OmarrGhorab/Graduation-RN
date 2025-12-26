import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function ResetSuccessScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[colorScheme || 'light'];

    const handleGoToLogin = () => {
        router.push('/signin');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />

            <View style={styles.modalContainer}>
                <View style={[styles.card, { backgroundColor: theme.background }]}>
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                        <Image
                            source={require('@/assets/images/reset-successful.png')}
                            style={styles.successIcon}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.primary }]}>
                        Reset Password Successful!
                    </Text>

                    {/* Subtitle */}
                    <Text style={[styles.subtitle, { color: theme.icon }]}>
                        Your password has been successfully changed.
                    </Text>

                    {/* Go To Login Button */}
                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            {
                                backgroundColor: theme.primary,
                                shadowOpacity: isDark ? 0.3 : 0.1,
                            },
                        ]}
                        onPress={handleGoToLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.loginButtonText, { color: theme.onPrimary }]}>
                            Go To Log in
                        </Text>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        shadowOffset: { width: 0, height: 4 },
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
        fontFamily: Fonts?.bold,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts?.regular,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    loginButton: {
        width: '100%',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        fontSize: 16,
        fontFamily: Fonts?.bold,
    },
});
