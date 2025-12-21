import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';

// Types
export interface TwoFactorStatus {
    enabled?: boolean;
    twoFactorEnabled?: boolean;
    enabledAt?: string;
    backupCodesCount?: number;
}

export interface TwoFactorEnableResponse {
    qrCode: string;
    secret: string;
    backupCodes: string[];
}

export interface TwoFactorVerifyResponse {
    success: boolean;
    message: string;
    backupCodes?: string[];
}

export interface Session {
    id: string;
    deviceName: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    ipAddress: string;
    location?: string;
    lastActive: string;
    isCurrent: boolean;
    browser?: string;
    os?: string;
}

export interface SessionsResponse {
    sessions: Session[];
}

export interface ActivityItem {
    id: string;
    type: 'login' | 'logout' | 'password_change' | 'profile_update' | '2fa_enabled' | '2fa_disabled' | 'session_revoked' | 'device_verified';
    description: string;
    deviceName?: string;
    ipAddress?: string;
    location?: string;
    timestamp: string;
}

export interface CurrentDevice {
    deviceName: string;
    platform: string | null;
    ipAddress: string;
    location: string | null;
}

export interface ActivityResponse {
    lastActivityAt: string;
    currentDevice: CurrentDevice;
    totalActiveSessions: number;
    activities?: ActivityItem[];
}

// Helper function for authenticated requests
async function authFetch(endpoint: string, options: RequestInit = {}) {
    const token = await getValidAccessToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const error: any = new Error(data.message || 'Request failed');
        error.status = response.status;
        error.responseData = data;
        throw error;
    }

    return data;
}

// 2FA APIs
export async function get2FAStatus(): Promise<TwoFactorStatus> {
    return authFetch('/api/v1/auth/2fa/status');
}

export async function enable2FA(): Promise<TwoFactorEnableResponse> {
    return authFetch('/api/v1/auth/2fa/enable', { method: 'POST' });
}

export async function verify2FASetup(token: string): Promise<TwoFactorVerifyResponse> {
    return authFetch('/api/v1/auth/2fa/verify-setup', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
}

export async function disable2FA(password: string): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
}

export async function regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
    return authFetch('/api/v1/auth/2fa/regenerate-backup-codes', { method: 'POST' });
}

// Sessions APIs
export async function getSessions(): Promise<SessionsResponse> {
    return authFetch('/api/v1/auth/sessions');
}

export async function revokeSession(sessionId: string): Promise<{ message: string }> {
    return authFetch(`/api/v1/auth/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function revokeAllSessions(): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/sessions/all', { method: 'DELETE' });
}

// Activity APIs
export async function getActivityLog(page: number = 1, limit: number = 20): Promise<ActivityResponse> {
    return authFetch(`/api/v1/auth/activity?page=${page}&limit=${limit}`);
}

// Account Management APIs
export async function deactivateAccount(): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/account/deactivate', { method: 'POST' });
}

export async function deleteAccount(password: string): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/account/delete', {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
}

// Device Verification APIs
export async function verifyDevice(otp: string): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/verify-device', {
        method: 'POST',
        body: JSON.stringify({ otp }),
    });
}

export async function resendDeviceVerificationOTP(): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/resend-device-verification-otp', { method: 'POST' });
}

// 2FA Login Verification
export async function verify2FALogin(token: string, accessToken?: string): Promise<any> {
    if (!accessToken) {
        throw new Error('Access token is required');
    }

    const response = await fetch(`${BASE_URL}/api/v1/auth/2fa/verify-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
        const error: any = new Error(data.message || 'Verification failed');
        error.status = response.status;
        error.responseData = data;
        throw error;
    }

    return data;
}
