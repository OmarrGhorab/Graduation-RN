import { triggerReport, getReportSummary, getReportHistory } from '@/services/ReportService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useTranslation } from './useTranslation';

export function useTriggerReportMutation() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ studentId, period, language }: { studentId: string, period: 'weekly' | 'monthly', language: string }) => 
            triggerReport(studentId, period, language),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report-summary'] });
            Alert.alert(
                t('common.success') || 'Success',
                t('reports.generationStarted') || 'AI is analyzing your child\'s progress. We will notify you when the report is ready!'
            );
        },
        onError: (error: any) => {
            Alert.alert(
                t('common.error') || 'Error',
                error.message || 'Failed to trigger report generation'
            );
        }
    });
}

export function useReportSummaryQuery(studentId: string | null, period: 'weekly' | 'monthly') {
    return useQuery({
        queryKey: ['report-summary', studentId, period],
        queryFn: () => studentId ? getReportSummary(studentId, period) : null,
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useReportHistoryQuery(studentId: string | null) {
    return useQuery({
        queryKey: ['report-history', studentId],
        queryFn: () => studentId ? getReportHistory(studentId) : null,
        enabled: !!studentId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}
