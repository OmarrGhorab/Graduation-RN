import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/toast';
import {
    searchParents, sendLinkRequest, getLinkRequests, respondToLinkRequest,
    getLinkedAccounts, sendUnlinkRequest, getUnlinkRequests, respondToUnlinkRequest,
    ParentUser, LinkRequest, LinkedAccount,
} from '@/services/ParentLinkService';

export function useParentLinkState() {
    const toast = useToast();
    
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [pendingRequests, setPendingRequests] = useState<LinkRequest[]>([]);
    const [pendingUnlinkRequests, setPendingUnlinkRequests] = useState<LinkRequest[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ParentUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);
    const [unlinkTargetParent, setUnlinkTargetParent] = useState<{ id: string; name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchParentLinkData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [linkedRes, requestsRes, unlinkRes] = await Promise.allSettled([
                getLinkedAccounts(),
                getLinkRequests(),
                getUnlinkRequests(),
            ]);
            setLinkedAccounts(linkedRes.status === 'fulfilled' ? linkedRes.value.data || [] : []);
            setPendingRequests(requestsRes.status === 'fulfilled' ? requestsRes.value.data || [] : []);
            setPendingUnlinkRequests(unlinkRes.status === 'fulfilled' ? unlinkRes.value.data || [] : []);
        } catch (error: any) {
            console.error('[ParentLink] Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearchParents = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            setIsSearching(true);
            const response = await searchParents(query.trim());
            setSearchResults(response.data || []);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to search');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [toast]);

    // Debounced search effect
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(() => handleSearchParents(searchQuery), 300);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery, handleSearchParents]);

    const handleSendLinkRequest = useCallback(async (parentId: string) => {
        try {
            setProcessingRequestId(parentId);
            await sendLinkRequest(parentId);
            toast.success('Success', 'Link request sent');
            setShowSearchModal(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to send request');
        } finally {
            setProcessingRequestId(null);
        }
    }, [toast, fetchParentLinkData]);

    const handleRespondToRequest = useCallback(async (requestId: string, action: 'accept' | 'decline') => {
        try {
            setProcessingRequestId(requestId);
            await respondToLinkRequest(requestId, action);
            toast.success('Success', `Request ${action}ed`);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to respond');
        } finally {
            setProcessingRequestId(null);
        }
    }, [toast, fetchParentLinkData]);

    const handleConfirmUnlink = useCallback(async () => {
        if (!unlinkTargetParent) return;
        try {
            setProcessingRequestId(unlinkTargetParent.id);
            await sendUnlinkRequest(unlinkTargetParent.id);
            toast.success('Success', 'Unlink request sent');
            setShowUnlinkModal(false);
            setUnlinkTargetParent(null);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to send unlink request');
        } finally {
            setProcessingRequestId(null);
        }
    }, [unlinkTargetParent, toast, fetchParentLinkData]);

    const handleRespondToUnlinkRequest = useCallback(async (requestId: string, action: 'accept' | 'decline') => {
        try {
            setProcessingRequestId(requestId);
            await respondToUnlinkRequest(requestId, action);
            toast.success('Success', `Unlink request ${action}ed`);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to respond');
        } finally {
            setProcessingRequestId(null);
        }
    }, [toast, fetchParentLinkData]);

    const openUnlinkModal = useCallback((id: string, name: string) => {
        setUnlinkTargetParent({ id, name });
        setShowUnlinkModal(true);
    }, []);

    const closeUnlinkModal = useCallback(() => {
        setShowUnlinkModal(false);
        setUnlinkTargetParent(null);
    }, []);

    const closeSearchModal = useCallback(() => {
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    return {
        linkedAccounts,
        pendingRequests,
        pendingUnlinkRequests,
        showSearchModal,
        setShowSearchModal,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        processingRequestId,
        showUnlinkModal,
        unlinkTargetParent,
        isLoading,
        fetchParentLinkData,
        handleSendLinkRequest,
        handleRespondToRequest,
        handleConfirmUnlink,
        handleRespondToUnlinkRequest,
        openUnlinkModal,
        closeUnlinkModal,
        closeSearchModal,
    };
}
