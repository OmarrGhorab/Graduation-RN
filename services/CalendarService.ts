import { logger } from '@/libs/logger';
import { apiClient } from './apiClient';

export interface ApiSchedule {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    startTime: string;
    endTime: string;
    status: 'COMPLETED' | 'LIVE' | 'SCHEDULED' | 'CANCELED';
    location: string;
    lessonNumber: number;
    attendanceStatus?: 'PRESENT' | 'LATE' | 'ABSENT' | null;
    canMarkAttendance?: boolean;
}

export interface CalendarResponse {
    data: ApiSchedule[];
    success: boolean;
}

/**
 * Fetch calendar/schedule for the current student
 * @param start - Start ISO date string
 * @param end - End ISO date string
 */
export async function getStudentCalendar(start?: string, end?: string): Promise<CalendarResponse> {
    logger.log('[Calendar] Fetching student calendar', { start, end });
    return apiClient.get<CalendarResponse>('/api/v1/calendar/student', {
        params: { start, end }
    });
}


/**
 * Fetch calendar/schedule for the current teacher
 * @param start - Start ISO date string
 * @param end - End ISO date string
 */
export async function getTeacherCalendar(start?: string, end?: string): Promise<CalendarResponse> {
    logger.log('[Calendar] Fetching teacher calendar', { start, end });
    return apiClient.get<CalendarResponse>('/api/v1/calendar/teacher', {
        params: { start, end }
    });
}
