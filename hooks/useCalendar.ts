import { useAuthStore } from '@/libs/auth';
import { getStudentCalendar, getTeacherCalendar, getParentCalendar, CalendarFilters } from '@/services/CalendarService';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export function useStudentCalendar(filters?: CalendarFilters, enabled: boolean = true) {
    return useQuery({
        queryKey: ['calendar', 'student', filters],
        queryFn: () => getStudentCalendar(filters),
        enabled,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useTeacherCalendar(filters?: CalendarFilters, enabled: boolean = true) {
    return useQuery({
        queryKey: ['calendar', 'teacher', filters],
        queryFn: () => getTeacherCalendar(filters),
        enabled,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useParentCalendar(filters?: CalendarFilters, enabled: boolean = true) {
    return useQuery({
        queryKey: ['calendar', 'parent', filters],
        queryFn: () => getParentCalendar(filters),
        enabled,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useCalendar(filters?: CalendarFilters) {
    const user = useAuthStore(state => state.user);
    const isTeacher = user?.role === 'TEACHER';
    const isParent = user?.role === 'PARENT';

    const studentQuery = useStudentCalendar(filters, !isTeacher && !isParent);
    const teacherQuery = useTeacherCalendar(filters, isTeacher);
    const parentQuery = useParentCalendar(filters, isParent);

    if (isTeacher) return teacherQuery;
    if (isParent) return parentQuery;
    return studentQuery;
}
