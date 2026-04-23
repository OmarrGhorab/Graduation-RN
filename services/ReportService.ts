import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';
import { logger } from '@/libs/logger';

export interface ReportTriggerResponse {
    message: string;
    status: string;
}

export interface ReportSummary {
    summary: string;
    period: string;
    generatedAt: string;
    studentId: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        // Handle PDF or other binary responses separately if needed
        if (response.ok) {
            return {} as T; 
        }
        throw new Error(`Server error (${response.status})`);
    }
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
    }
    return data;
}

/**
 * Trigger AI report generation for a child
 */
export async function triggerReport(studentId: string, period: 'weekly' | 'monthly', language: string): Promise<ReportTriggerResponse> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/reports/parent/student/${studentId}/trigger?period=${period}&language=${language}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    return parseResponse<ReportTriggerResponse>(response);
}

/**
 * Get download URL for report PDF
 */
export function getReportDownloadUrl(studentId: string, period: 'weekly' | 'monthly'): string {
    return `${BASE_URL}/api/v1/reports/parent/student/${studentId}/download?period=${period}`;
}

/**
 * Fetch the latest AI report summary for a student
 */
export async function getReportSummary(studentId: string, period: 'weekly' | 'monthly'): Promise<ReportSummary> {
    const token = await getValidAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BASE_URL}/api/v1/reports/parent/student/${studentId}?period=${period}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    return parseResponse<ReportSummary>(response);
}
