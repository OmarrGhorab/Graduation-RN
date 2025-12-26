import React, { useEffect, useRef, memo } from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ToastItemProps } from './types';
import { useToastStyles } from './useToastStyles';

const ToastItem = memo(({ toast, onHide }: ToastItemProps) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const { styles, colors, toastConfig } = useToastStyles();
    const config = toastConfig[toast.type];

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto hide
        const timeout = setTimeout(() => {
            hideToast();
        }, toast.duration || 3000);

        return () => clearTimeout(timeout);
    }, []);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide(toast.id);
        });
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: config.backgroundColor,
                    borderLeftColor: config.borderColor,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <View style={styles.toastContent}>
                <Ionicons
                    name={config.icon}
                    size={24}
                    color={config.iconColor}
                    style={styles.toastIcon}
                />
                <View style={styles.toastTextContainer}>
                    <Text style={[styles.toastTitle, { color: config.titleColor }]}>
                        {toast.title}
                    </Text>
                    {toast.message && (
                        <Text style={styles.toastMessage}>{toast.message}</Text>
                    )}
                </View>
                <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
});

ToastItem.displayName = 'ToastItem';

export default ToastItem;
