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
import { completeOnboarding } from '@/services/OnboardingService';

const { width, height } = Dimensions.get('window');

export default function Onboarding3Screen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = isDark ? Colors.dark : Colors.light;

    const handleHalfScreenPress = async () => {
        // Mark intro onboarding as completed
        await completeOnboarding();
        // Navigate to login screen
        router.replace('/login');
        console.log('Login')
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

            {/* Main Content */}
            <View style={styles.content}>
                {/* Illustration */}
                <Image
                    source={require('@/assets/images/welcome-screen3.png')}
                    style={styles.illustration}
                    resizeMode="cover"
                />
            </View>

            {/* Text Content - Centered */}
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.primary }]}>best platform for both</Text>
                <Text style={[styles.subtitle, { color: theme.primary }]}>teachers & Learners</Text>
            </View>

            {/* Progress Indicator - Bottom Right */}
            <View style={styles.progressContainer}>
                <Image
                    source={require('@/assets/images/full-circle-completed.png')}
                    style={styles.fullCircle}
                    resizeMode="contain"
                />
            </View>

            {/* Invisible touchable area on right half */}
            <TouchableOpacity
                style={styles.rightHalfTouch}
                onPress={handleHalfScreenPress}
                activeOpacity={1}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 160
    },
    illustration: {
        width: width * 0.9,
        height: height * 0.5,
        maxWidth: 400,
        maxHeight: 500,
    },
    textContainer: {
        position: 'absolute',
        top: '54%',
        left: 24,
        alignItems: 'flex-start',
        marginTop: 100,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts.light,
        textAlign: 'left',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        textAlign: 'left',
    },
    progressContainer: {
        position: 'absolute',
        bottom: height * 0.05,
        right: 24,
    },
    fullCircle: {
        width: 60,
        height: 60,
    },
    rightHalfTouch: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: width / 2,
        height: height,
        backgroundColor: 'transparent',
    },
});
