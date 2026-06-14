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
    childId?: string;
    childName?: string;
}

export interface CalendarResponse {
    data: ApiSchedule[];
    success: boolean;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CalendarFilters {
    range?: 'prev_7' | 'upcoming_7' | 'upcoming_30';
    status?: 'upcoming' | 'finished' | 'CANCELED';
    subject_name?: string;
    subject?: string;
    start?: string;
    end?: string;
    page?: number;
    limit?: number;
    child_id?: string;
    [key: string]: string | number | boolean | undefined;
}

export async function getStudentCalendar(filters?: CalendarFilters): Promise<CalendarResponse> {
    logger.log('[Calendar] Fetching student calendar', filters);
    return apiClient.get<CalendarResponse>('/api/v1/calendar/student', { params: filters });
}

export async function getTeacherCalendar(filters?: CalendarFilters): Promise<CalendarResponse> {
    logger.log('[Calendar] Fetching teacher calendar', filters);
    return apiClient.get<CalendarResponse>('/api/v1/calendar/teacher', { params: filters });
}

export async function getParentCalendar(filters?: CalendarFilters): Promise<CalendarResponse> {
    logger.log('[Calendar] Fetching parent calendar', filters);
    return apiClient.get<CalendarResponse>('/api/v1/calendar/parent', { params: filters });
}

