export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

export interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
}

export interface ToastItemProps {
    toast: Toast;
    onHide: (id: string) => void;
}

export interface ToastConfig {
    icon: 'checkmark-circle' | 'close-circle' | 'information-circle' | 'warning';
    backgroundColor: string;
    borderColor: string;
    iconColor: string;
    titleColor: string;
}
