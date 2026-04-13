import { useAuthStore } from '@/libs/auth';
import { getStudentCalendar, getTeacherCalendar } from '@/services/CourseService';
import { useQuery } from '@tanstack/react-query';

export function useStudentCalendar(start?: string, end?: string) {
    return useQuery({
        queryKey: ['calendar', 'student', start, end],
        queryFn: () => getStudentCalendar(start, end),
    });
}

export function useTeacherCalendar(start?: string, end?: string) {
    return useQuery({
        queryKey: ['calendar', 'teacher', start, end],
        queryFn: () => getTeacherCalendar(start, end),
    });
}

export function useCalendar(start?: string, end?: string) {
    const user = useAuthStore(state => state.user);
    const isTeacher = user?.role === 'TEACHER';

    const studentQuery = useStudentCalendar(start, end);
    const teacherQuery = useTeacherCalendar(start, end);

    return isTeacher ? teacherQuery : studentQuery;
}
