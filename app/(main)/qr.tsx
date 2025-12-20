import React from 'react';
import { StyleSheet, View, Text, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, grayColors, Fonts } from '@/constants/theme';

export default function QRScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.iconContainer}>
                <Ionicons name="qr-code" size={80} color={cskColors[500]} />
            </View>
            <Text style={styles.title}>QR Scanner</Text>
            <Text style={styles.subtitle}>Scan QR codes to join classes or access content</Text>
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
    iconContainer: {
        marginBottom: 24,
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
