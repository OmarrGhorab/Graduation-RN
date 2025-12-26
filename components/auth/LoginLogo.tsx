import React from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoginLogoProps {
    isDark: boolean;
}

export const LoginLogo: React.FC<LoginLogoProps> = ({ isDark }) => (
    <Image
        source={
            isDark
                ? require('@/assets/images/logo-white.png')
                : require('@/assets/images/logo-green.png')
        }
        style={styles.logo}
        resizeMode="contain"
    />
);

const styles = StyleSheet.create({
    logo: {
        width: width * 0.4,
        height: height * 0.2,
        maxWidth: 200,
        maxHeight: 200,
        marginBottom: 40,
    },
});
