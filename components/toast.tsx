import { Colors, Fonts, cskColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig = {
    success: {
        icon: 'checkmark-circle' as const,
        backgroundColor: '#E7F5EC',
        borderColor: cskColors[500],
        iconColor: cskColors[500],
        titleColor: cskColors[500],
    },
    error: {
        icon: 'close-circle' as const,
        backgroundColor: '#FEE7E7',
        borderColor: '#DC3545',
        iconColor: '#DC3545',
        titleColor: '#DC3545',
    },
    info: {
        icon: 'information-circle' as const,
        backgroundColor: '#E7F0FE',
        borderColor: '#007AFF',
        iconColor: '#007AFF',
        titleColor: '#007AFF',
    },
    warning: {
        icon: 'warning' as const,
        backgroundColor: '#FFF8E7',
        borderColor: '#FFC107',
        iconColor: '#FFC107',
        titleColor: '#856404',
    },
};

interface ToastItemProps {
    toast: Toast;
    onHide: (id: string) => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
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
                    <Ionicons name="close" size={20} color={Colors.light.text} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const insets = useSafeAreaInsets();

    const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration?: number) => {
            const id = Date.now().toString();
            const newToast: Toast = { id, type, title, message, duration };
            setToasts((prev) => [...prev, newToast]);
        },
        []
    );

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = useCallback(
        (title: string, message?: string) => showToast('success', title, message),
        [showToast]
    );

    const error = useCallback(
        (title: string, message?: string) => showToast('error', title, message),
        [showToast]
    );

    const info = useCallback(
        (title: string, message?: string) => showToast('info', title, message),
        [showToast]
    );

    const warning = useCallback(
        (title: string, message?: string) => showToast('warning', title, message),
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <View style={[styles.toastWrapper, { top: insets.top + 10 }]}>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onHide={hideToast} />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    toastWrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    toastContainer: {
        borderRadius: 12,
        borderLeftWidth: 4,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    toastIcon: {
        marginRight: 12,
    },
    toastTextContainer: {
        flex: 1,
    },
    toastTitle: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        marginBottom: 2,
    },
    toastMessage: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});
