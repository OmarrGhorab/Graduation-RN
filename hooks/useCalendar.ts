import { STALE_TIMES } from '@/constants/queryConfig';
import { getStudentCalendar } from '@/services/CalendarService';
import { useQuery } from '@tanstack/react-query';

export const CALENDAR_QUERY_KEY = (start?: string, end?: string) => ['calendar', 'student', { start, end }];

export function useStudentCalendar(start?: string, end?: string) {
    return useQuery({
        queryKey: CALENDAR_QUERY_KEY(start, end),
        queryFn: () => getStudentCalendar(start, end),
        staleTime: STALE_TIMES.REALTIME, // Calendar might change more frequently (LIVE status)
    });
}
