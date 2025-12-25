import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';
import { DeviceService } from './DeviceService';

// ==================== Types ====================

// 2FA Types
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

// Session Types
export interface Session {
    id: string;
    deviceName: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    ipAddress: string;
    location?: string;
    isActive: boolean;
    isCurrent: boolean;
    isRevoked: boolean;
    isExpired: boolean;
    lastActivityAt: string;
    createdAt: string;
    expiresAt: string;
    revokedAt: string | null;
}

export interface SessionsResponse {
    sessions: Session[];
    totalSessions: number;
    activeSessions: number;
}

export interface SessionDevice {
    id: string;
    name: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    browser: string | null;
    os: string | null;
    isTrusted: boolean;
}

export interface SessionNetwork {
    ipAddress: string;
    location: string | null;
    userAgent: string | null;
}

export interface SessionStatus {
    isActive: boolean;
    isRevoked: boolean;
    isExpired: boolean;
}

export interface SessionTimestamps {
    createdAt: string;
    lastActivityAt: string;
    expiresAt: string;
    revokedAt: string | null;
    deviceLastLoginAt: string | null;
}

export interface SessionDetails {
    id: string;
    isCurrent: boolean;
    device: SessionDevice;
    network: SessionNetwork;
    status: SessionStatus;
    timestamps: SessionTimestamps;
}

export interface RevokeSessionResponse {
    message: string;
    revoked: boolean;
    loggedOut: boolean;
}

export interface RevokeAllSessionsResponse {
    message: string;
    revokedCount: number;
    loggedOut: boolean;
}

export interface CleanupSessionsResponse {
    message: string;
    deletedCount: number;
}

// Activity Types
export interface ActivityAccount {
    lastLoginAt: string;
    accountCreatedAt: string;
}

export interface ActivityCurrentDevice {
    deviceName: string;
    deviceModel: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    browser: string | null;
    browserVersion: string | null;
    os: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    ipAddress: string;
    location: string | null;
    timezone: string;
    appVersion: string;
}

export interface ActivitySessions {
    totalActive: number;
    byPlatform: {
        IOS?: number;
        ANDROID?: number;
        WEB?: number;
    };
    mostRecentActivity: string;
}

export interface ActivityDeviceItem {
    id: string;
    name: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    isTrusted: boolean;
    lastLoginAt: string;
}

export interface ActivityDevices {
    total: number;
    trusted: number;
    list: ActivityDeviceItem[];
}

export interface RecentActivityItem {
    sessionId: string;
    deviceName: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    ipAddress: string;
    location: string | null;
    lastActivityAt: string;
    createdAt: string;
    status: 'active' | 'expired' | 'revoked';
}

export interface ActivityResponse {
    account: ActivityAccount;
    currentDevice: ActivityCurrentDevice;
    sessions: ActivitySessions;
    devices: ActivityDevices;
    recentActivity: RecentActivityItem[];
}

// Legacy types for backward compatibility
export interface ActivityItem {
    id: string;
    type: 'login' | 'logout' | 'password_change' | 'profile_update' | '2fa_enabled' | '2fa_disabled' | 'session_revoked' | 'device_verified';
    description: string;
    deviceName?: string;
    ipAddress?: string;
    location?: string;
    timestamp: string;
}

// ==================== Helper Functions ====================

/**
 * Authenticated fetch with device headers
 */
async function authFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getValidAccessToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const deviceHeaders = await DeviceService.getDeviceHeaders();

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...deviceHeaders,
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

// ==================== 2FA APIs ====================

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

// ==================== Sessions APIs ====================

export async function getSessions(): Promise<SessionsResponse> {
    return authFetch('/api/v1/auth/sessions');
}

export async function getSessionDetails(sessionId: string): Promise<SessionDetails> {
    return authFetch(`/api/v1/auth/sessions/${sessionId}`);
}

export async function revokeSession(sessionId: string): Promise<RevokeSessionResponse> {
    return authFetch(`/api/v1/auth/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function revokeAllSessions(includeCurrent: boolean = false): Promise<RevokeAllSessionsResponse> {
    const query = includeCurrent ? '?includeCurrent=true' : '';
    return authFetch(`/api/v1/auth/sessions/all${query}`, { method: 'DELETE' });
}

export async function cleanupExpiredSessions(): Promise<CleanupSessionsResponse> {
    return authFetch('/api/v1/auth/sessions/cleanup', { method: 'DELETE' });
}

// ==================== Activity APIs ====================

export async function getActivityLog(): Promise<ActivityResponse> {
    return authFetch('/api/v1/auth/activity');
}

// ==================== Account Management APIs ====================

export async function deactivateAccount(): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/account/deactivate', { method: 'POST' });
}

export async function deleteAccount(password?: string): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/account/delete', {
        method: 'POST',
        body: JSON.stringify(password ? { password } : {}),
    });
}

// ==================== Device Verification APIs ====================

export async function verifyDevice(otp: string): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/verify-device', {
        method: 'POST',
        body: JSON.stringify({ otp }),
    });
}

export async function resendDeviceVerificationOTP(): Promise<{ message: string }> {
    return authFetch('/api/v1/auth/resend-device-verification-otp', { method: 'POST' });
}

// ==================== 2FA Login Verification ====================

export async function verify2FALogin(token: string, accessToken?: string): Promise<any> {
    if (!accessToken) {
        throw new Error('Access token is required');
    }

    const deviceHeaders = await DeviceService.getDeviceHeaders();

    const response = await fetch(`${BASE_URL}/api/v1/auth/2fa/verify-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            ...deviceHeaders,
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

// ==================== Utility Functions ====================

/**
 * Get device type icon name based on platform
 */
export function getDeviceIcon(platform: string): string {
    switch (platform?.toUpperCase()) {
        case 'IOS':
            return 'phone-portrait-outline';
        case 'ANDROID':
            return 'phone-portrait-outline';
        case 'WEB':
            return 'desktop-outline';
        default:
            return 'hardware-chip-outline';
    }
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string): string {
    switch (platform?.toUpperCase()) {
        case 'IOS':
            return 'iOS';
        case 'ANDROID':
            return 'Android';
        case 'WEB':
            return 'Web';
        default:
            return platform || 'Unknown';
    }
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case 'active':
            return '#10B981'; // green
        case 'expired':
            return '#F59E0B'; // yellow
        case 'revoked':
            return '#EF4444'; // red
        default:
            return '#6B7280'; // gray
    }
}
