import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

type Theme = typeof Colors.light | typeof Colors.dark;

interface VerificationHeaderProps {
    theme: Theme;
    isDark: boolean;
    onBack: () => void;
}

export const VerificationHeader: React.FC<VerificationHeaderProps> = ({ theme, isDark, onBack }) => {
    const { t } = useTranslation();
    
    return (
        <>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>
            <View style={styles.imageContainer}>
                <Image
                    source={
                        isDark
                            ? require('@/assets/images/logo-white.png')
                            : require('@/assets/images/logo-green.png')
                    }
                    style={styles.illustration}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: theme.primary }]}>{t('auth.verificationCode')}</Text>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    {t('auth.verificationCodeSubtitle')}
                </Text>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        marginTop: height * 0.05,
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
        width: width * 0.5,
        height: height * 0.2,
        maxWidth: 200,
        maxHeight: 200,
    },
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts?.bold,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: Fonts?.regular,
    },
});
