import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

type Theme = typeof Colors.light | typeof Colors.dark;

interface SignUpHeaderProps {
    theme: Theme;
    isDark: boolean;
}

export const SignUpHeader: React.FC<SignUpHeaderProps> = ({ theme, isDark }) => {
    const { t } = useTranslation();
    
    return (
        <>
            <View style={styles.imageContainer}>
                <Image
                    source={
                        isDark
                            ? require('@/assets/images/logo-white.png')
                            : require('@/assets/images/logo-green.png')
                    }
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            <Text style={[styles.title, { color: theme.primary }]}>{t('auth.signUp')}</Text>
        </>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        alignItems: 'center',
        marginTop: height * 0.05,
        marginBottom: 20,
    },
    logo: {
        width: width * 0.5,
        height: height * 0.2,
        maxWidth: 200,
        maxHeight: 200,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts?.bold,
        marginBottom: 30,
    },
});
