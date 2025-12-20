import React from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import { cskColors, grayColors, Fonts } from '@/constants/theme';

export default function CourseScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Text style={styles.title}>Courses</Text>
            <Text style={styles.subtitle}>Your enrolled courses will appear here</Text>
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
