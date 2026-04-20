import {
    createAbsenceRequest,
    getKidsAbsenceHistory,
    getLessonAbsenceRequests,
    getPendingParentAbsenceRequests,
    getStudentAbsenceRequests,
    respondToAbsenceRequest,
} from '@/services/CourseService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useStudentAbsences(studentId: string, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: ['absences', 'student', studentId],
        queryFn: () => getStudentAbsenceRequests(studentId),
        enabled: (options.enabled !== false) && !!studentId,
    });
}

export function useKidsAbsences(options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: ['absences', 'kids'],
        queryFn: () => getKidsAbsenceHistory(),
        enabled: options.enabled !== false,
    });
}

export function useLessonAbsences(lessonId: string) {
    return useQuery({
        queryKey: ['absences', 'lesson', lessonId],
        queryFn: () => getLessonAbsenceRequests(lessonId),
        enabled: !!lessonId,
    });
}

export function usePendingParentAbsences() {
    return useQuery({
        queryKey: ['absences', 'pending-parent'],
        queryFn: () => getPendingParentAbsenceRequests(),
    });
}

export function useCreateAbsence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAbsenceRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['absences'] });
        },
    });
}

export function useRespondToAbsence() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ requestId, approve, responseNote }: { requestId: string; approve: boolean; responseNote?: string }) =>
            respondToAbsenceRequest(requestId, { approve, responseNote }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['absences'] });
        },
    });
}
