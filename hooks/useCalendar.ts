import { useAuthStore } from '@/libs/auth';
import { getStudentCalendar, getTeacherCalendar, CalendarFilters } from '@/services/CalendarService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export function useStudentCalendar(filters?: CalendarFilters, enabled: boolean = true) {
    return useQuery({
        queryKey: ['calendar', 'student', filters],
        queryFn: () => getStudentCalendar(filters),
        enabled: enabled,
        staleTime: 0,
        placeholderData: keepPreviousData,
    });
}

export function useTeacherCalendar(filters?: CalendarFilters, enabled: boolean = true) {
    return useQuery({
        queryKey: ['calendar', 'teacher', filters],
        queryFn: () => getTeacherCalendar(filters),
        enabled: enabled,
        staleTime: 0,
        placeholderData: keepPreviousData,
    });
}

export function useCalendar(filters?: CalendarFilters) {
    const user = useAuthStore(state => state.user);
    const isTeacher = user?.role === 'TEACHER';

    const studentQuery = useStudentCalendar(filters, !isTeacher);
    const teacherQuery = useTeacherCalendar(filters, isTeacher);

    return isTeacher ? teacherQuery : studentQuery;
}
