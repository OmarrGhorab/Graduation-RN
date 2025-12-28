import { useState, useCallback } from 'react';
import { useToast } from '@/components/toast';
import {
    getSessions, getSessionDetails, revokeSession, revokeAllSessions,
    Session, SessionDetails,
} from '@/services/SecurityService';

export function useSessionsState() {
    const toast = useToast();
    
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<SessionDetails | null>(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSessions = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getSessions();
            setSessions(response.sessions || []);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch sessions');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleViewSessionDetails = useCallback(async (sessionId: string) => {
        try {
            setLoadingSessionId(sessionId);
            const details = await getSessionDetails(sessionId);
            setSelectedSession(details);
            setShowSessionModal(true);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to load session details');
        } finally {
            setLoadingSessionId(null);
        }
    }, [toast]);

    const handleRevokeSession = useCallback(async (sessionId: string) => {
        try {
            setLoadingSessionId(sessionId);
            await revokeSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            setShowSessionModal(false);
            setSelectedSession(null);
            toast.success('Success', 'Session revoked');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to revoke session');
        } finally {
            setLoadingSessionId(null);
        }
    }, [toast]);

    const handleRevokeAllSessions = useCallback(async () => {
        try {
            setIsLoading(true);
            await revokeAllSessions();
            setSessions(prev => prev.filter(s => s.isCurrent));
            toast.success('Success', 'All other sessions revoked');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to revoke sessions');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const closeSessionModal = useCallback(() => {
        setShowSessionModal(false);
        setSelectedSession(null);
    }, []);

    return {
        sessions,
        selectedSession,
        showSessionModal,
        setShowSessionModal,
        loadingSessionId,
        isLoading,
        fetchSessions,
        handleViewSessionDetails,
        handleRevokeSession,
        handleRevokeAllSessions,
        closeSessionModal,
    };
}
