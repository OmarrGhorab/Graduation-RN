import React, { createContext, useCallback, useContext, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, ToastContextType, ToastType } from './types';
import { useToastStyles } from './useToastStyles';
import ToastItem from './ToastItem';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const insets = useSafeAreaInsets();
    const { styles } = useToastStyles();

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
