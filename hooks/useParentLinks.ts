import { useQuery } from '@tanstack/react-query';
import { 
    getLinkedAccounts, 
    getKids, 
    getChildProgress, 
    getChildAttendance 
} from '@/services/ParentLinkService';

export const useLinkedAccounts = () => {
    return useQuery({
        queryKey: ['parent', 'linked-accounts'],
        queryFn: getLinkedAccounts,
    });
};

export const useLinkedChildren = () => {
    const { data, ...rest } = useLinkedAccounts();
    
    const children = data?.data
        .filter(account => !!account.child)
        .map(account => account.child!) || [];

    return {
        ...rest,
        children,
    };
};

export const useKidsQuery = () => {
    return useQuery({
        queryKey: ['parent', 'kids'],
        queryFn: getKids,
    });
};

export const useChildProgress = (studentId: string | null) => {
    return useQuery({
        queryKey: ['parent', 'kids', studentId, 'progress'],
        queryFn: () => getChildProgress(studentId!),
        enabled: !!studentId,
    });
};

export const useChildAttendance = (studentId: string | null) => {
    return useQuery({
        queryKey: ['parent', 'kids', studentId, 'attendance'],
        queryFn: () => getChildAttendance(studentId!),
        enabled: !!studentId,
    });
};
