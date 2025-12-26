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
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const { width, height } = Dimensions.get('window');

export default function Onboarding2Screen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();

    const handleHalfScreenPress = () => {
        // Navigate to next onboarding screen
        router.push('/onboarding3');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
            
            {/* Main Content */}
            <View style={styles.content}>
                {/* Illustration */}
                <Image
                    source={require('@/assets/images/welcome-screen2.png')}
                    style={styles.illustration}
                    resizeMode="cover"
                />
            </View>
            
            {/* Text Content - Centered */}
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.primary }]}>Learn Any Time</Text>
                <Text style={[styles.subtitle, { color: theme.primary }]}>Anywhere And Accelerate Your Future</Text>
            </View>
            
            {/* Progress Indicator - Bottom Right */}
            <View style={styles.progressContainer}>
                <Image
                    source={require('@/assets/images/half-circle-completed.png')}
                    style={styles.halfCircle}
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
    bottomSection: {
        position: 'absolute',
        bottom: height * 0.05,
        right: 24,
    },
    progressContainer: {
        position: 'absolute',
        bottom: height * 0.05,
        right: 24,
    },
    halfCircle: {
        width: 60,
        height: 60,
    },
    textContainer: {
        position: 'absolute',
        top: '50%',
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
    rightHalfTouch: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: width / 2,
        height: height,
        backgroundColor: 'transparent',
    },
});
