import React from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { cskColors, grayColors, Fonts } from '@/constants/theme';

export default function CourseScreen() {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Text style={styles.title}>{t('course.title')}</Text>
            <Text style={styles.subtitle}>{t('course.emptyState')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        color: cskColors[500],
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        textAlign: 'center',
    },
});
