import { getTeacherRating, getTopRatedTeachers } from '@/services/CourseService';
import { searchTeacherProfiles } from '@/services/ProfileService';
import { useQuery } from '@tanstack/react-query';

export function useTopRatedTeachers(limit: number = 10, minRating: number = 4.0) {
    return useQuery({
        queryKey: ['teachers', 'top-rated', limit, minRating],
        queryFn: () => getTopRatedTeachers(limit, minRating),
    });
}

export function useTeacherRating(teacherId: string) {
    return useQuery({
        queryKey: ['teacher', teacherId, 'rating'],
        queryFn: () => getTeacherRating(teacherId),
        enabled: !!teacherId,
    });
}

export function useTeacherSearch(query: string) {
    return useQuery({
        queryKey: ['teachers', 'search', query],
        queryFn: () => searchTeacherProfiles(query),
        enabled: query.length >= 2,
    });
}
