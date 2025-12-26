import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

type Theme = typeof Colors.light | typeof Colors.dark;

interface ResetPasswordHeaderProps {
    theme: Theme;
    isDark: boolean;
    onBack: () => void;
}

export const ResetPasswordHeader: React.FC<ResetPasswordHeaderProps> = ({ theme, isDark, onBack }) => (
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
            <Text style={[styles.title, { color: theme.primary }]}>Reset Password</Text>
        </View>
    </>
);

const styles = StyleSheet.create({
    header: {
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
        width: width * 0.6,
        height: height * 0.25,
        marginBottom: 10,
    },
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts?.bold,
        marginBottom: 12,
    },
});
