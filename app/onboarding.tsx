import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Fonts, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = isDark ? Colors.dark : Colors.light;

    const handleStartNow = () => {
        // Navigate to next onboarding screen or login
        router.push('/onboarding2');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            
            {/* Content */}
            <View style={styles.content}>
                {/* Subtitle */}
                <Text style={[styles.subtitle, { color: theme.primary }]}>Online Learning...</Text>
                
                {/* Main Title */}
                <Text style={[styles.title, { color: theme.primary }]}>The Easiest Way To Start Your Journey</Text>
                
                {/* Illustration */}
                <Image
                    source={require('@/assets/images/welcome-screen1.png')}
                    style={styles.illustration}
                    resizeMode="contain"
                />
            </View>
            
            {/* Start Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: theme.primary }]}
                    onPress={handleStartNow}
                    activeOpacity={0.8}
                >
                    <Text style={styles.startButtonText}>Start Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.1,
        alignItems: 'flex-start',
    },
    subtitle: {
        fontSize: 24,
        fontFamily: Fonts.light,
        textAlign: 'left',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        textAlign: 'left',
        paddingHorizontal: 0,
        lineHeight: 32,
        marginBottom: 40,
    },
    illustration: {
        width: width * 0.95,
        height: height * 0.55,
        maxWidth: 450,
        maxHeight: 550,
        alignSelf: 'center',
        marginTop: 20,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: height * 0.08,
    },
    startButton: {
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    startButtonText: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
});
