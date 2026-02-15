import { STALE_TIMES } from '@/constants/queryConfig';
import { getStudentCalendar, getTeacherCalendar } from '@/services/CalendarService';
import { useQuery } from '@tanstack/react-query';

export const CALENDAR_QUERY_KEY = (start?: string, end?: string) => ['calendar', 'student', { start, end }];
export const TEACHER_CALENDAR_QUERY_KEY = (start?: string, end?: string) => ['calendar', 'teacher', { start, end }];

export function useStudentCalendar(start?: string, end?: string) {
    return useQuery({
        queryKey: CALENDAR_QUERY_KEY(start, end),
        queryFn: () => getStudentCalendar(start, end),
        staleTime: STALE_TIMES.REALTIME, // Calendar might change more frequently (LIVE status)
    });
}

/**
 * Get teacher calendar/schedule
 */
export function useTeacherCalendar(start?: string, end?: string) {
    return useQuery({
        queryKey: TEACHER_CALENDAR_QUERY_KEY(start, end),
        queryFn: () => getTeacherCalendar(start, end),
        staleTime: STALE_TIMES.REALTIME,
    });
}
