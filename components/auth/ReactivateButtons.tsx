import React from 'react';
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

type Theme = typeof Colors.light | typeof Colors.dark;

interface ReactivateButtonsProps {
    theme: Theme;
    isDark?: boolean;
    loading: boolean;
    fadeAnim: Animated.Value;
    buttonSlideAnim: Animated.Value;
    onContinue: () => void;
    onGoBack: () => void;
}

export const ReactivateButtons: React.FC<ReactivateButtonsProps> = ({
    theme,
    isDark = false,
    loading,
    fadeAnim,
    buttonSlideAnim,
    onContinue,
    onGoBack,
}) => {
    const { t, isRTL } = useTranslation();
    
    // Dark mode button colors
    const buttonGradient = isDark 
        ? ['#1E1E1E', '#252525'] as [string, string]
        : ['#FFFFFF', '#F8FAFC'] as [string, string];
    
    return (
        <Animated.View
            style={[
                styles.bottomSection,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: buttonSlideAnim }],
                },
            ]}
        >
            {/* Continue Button */}
            <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinue}
                activeOpacity={0.9}
                disabled={loading}
            >
                <LinearGradient
                    colors={buttonGradient}
                    style={[styles.buttonGradient, isRTL && styles.buttonGradientRTL]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <>
                            <Text style={[styles.continueButtonText, { color: theme.primary }]}>
                                {t('auth.reactivateAccount')}
                            </Text>
                            <View style={[styles.arrowCircle, { backgroundColor: theme.primary }]}>
                                <Ionicons 
                                    name={isRTL ? "arrow-back" : "arrow-forward"} 
                                    size={18} 
                                    color="#FFFFFF" 
                                />
                            </View>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* Logout Option */}
            <TouchableOpacity
                style={[styles.logoutButton, isRTL && styles.logoutButtonRTL]}
                onPress={onGoBack}
                activeOpacity={0.7}
                disabled={loading}
            >
                <Ionicons 
                    name="log-out-outline" 
                    size={18} 
                    color="rgba(255,255,255,0.8)" 
                    style={isRTL && { transform: [{ scaleX: -1 }] }}
                />
                <Text style={styles.logoutText}>{t('auth.goBack')}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bottomSection: {
        marginTop: 'auto',
    },
    continueButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 20,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 28,
    },
    buttonGradientRTL: {
        flexDirection: 'row-reverse',
    },
    continueButtonText: {
        fontSize: 17,
        fontFamily: Fonts?.bold,
        marginRight: 12,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    logoutButtonRTL: {
        flexDirection: 'row-reverse',
    },
    logoutText: {
        fontSize: 14,
        fontFamily: Fonts?.medium,
        color: 'rgba(255,255,255,0.8)',
    },
});
