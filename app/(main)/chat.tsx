import { Fonts, primaryGradient } from '@/constants/theme';
import { useConversationPresence } from '@/hooks/useConversationPresence';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { Conversation } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, LayoutAnimation, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS = [
    { key: 'ALL', label: 'All' },
    { key: 'groups', label: 'My Groups' },
    { key: 'students', label: 'Students' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'instructors', label: 'Instructors' },
    { key: 'parents', label: 'Parents' },
    { key: 'DIRECT', label: 'Direct' },
    { key: 'GROUP', label: 'All Groups' }
];

// Conversation Item Component with Presence
function ConversationItem({ item, theme, router, t, textAlign }: {
    item: Conversation,
    theme: any,
    router: any,
    t: any,
    textAlign: 'left' | 'right'
}) {
    // Add real-time presence tracking
    const conversationWithPresence = useConversationPresence(item);
    const isOnline = conversationWithPresence?.type === 'DIRECT'
        ? (conversationWithPresence.peer_online ?? false)
        : false;

    // Debug logging
    React.useEffect(() => {
        if (item.type === 'DIRECT') {
            console.log('[ConversationItem] Presence Debug:', {
                conversationId: item.id,
                peerName: item.peer_profile?.name,
                peer_online: conversationWithPresence?.peer_online,
                isOnline: isOnline,
                hasPresenceData: conversationWithPresence !== null
            });
        }
    }, [conversationWithPresence?.peer_online, isOnline]);

    const getConversationDisplay = (item: Conversation) => {
        if (item.type === 'DIRECT') {
            const displayName = item.peer_profile?.name || item.name || 'User';
            const displayImage = item.peer_profile?.image || item.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;
            return {
                name: displayName,
                avatar: displayImage,
                role: item.role || item.peer_profile?.role || 'STUDENT',
            };
        }
        const groupName = item.name || 'Group Chat';
        return {
            name: groupName,
            avatar: item.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}`,
            role: 'GROUP',
        };
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            if (date.toDateString() === now.toDateString()) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString();
        } catch (e) {
            return '';
        }
    };

    const getSubtitle = () => {
        if (item.is_typing_name) {
            return {
                text: `${item.is_typing_name} is typing...`,
                senderImage: item.is_typing_image
            };
        }
        if (item.last_message) {
            const isMe = item.last_message.sender_id === useAuthStore.getState().user?.id;
            const senderName = item.last_message.sender?.name || 'Someone';
            const senderImage = item.last_message.sender?.image;

            let content = item.last_message.content;
            if (item.last_message.type === 'image') {
                content = '📷 Image';
            } else if (item.last_message.type === 'voice') {
                content = '🎤 Voice Message';
            }

            if (item.type === 'GROUP' && !isMe) {
                return {
                    text: `${senderName}: ${content}`,
                    senderImage: senderImage
                };
            } else if (isMe) {
                return { text: `You: ${content}` };
            }
            return { text: content };
        }
        return null;
    };

    const display = getConversationDisplay(item);
    const subtitle = getSubtitle();

    return (
        <TouchableOpacity
            style={[styles.itemContainer, { borderBottomColor: theme.divider }]}
            activeOpacity={0.7}
            onPress={() => router.push({
                pathname: `/conversation/${item.id}`,
                params: {
                    name: display.name,
                    avatar: display.avatar,
                    role: display.role,
                    type: item.type
                }
            })}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: display.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                />
                {/* Show online indicator for direct chats */}
                {item.type === 'DIRECT' && isOnline && (
                    <View style={[styles.onlineIndicator, { borderColor: theme.background }]} />
                )}
            </View>

            <View style={styles.contentContainer}>
                <View style={[styles.headerRow, { direction: textAlign === 'right' ? 'rtl' : 'ltr' }]}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                        {display.name}
                    </Text>
                    <RoleBadge role={display.role} isDark={theme.isDark} />
                </View>
                {subtitle ? (
                    <View style={styles.subtitleRow}>
                        {(item.type === 'GROUP' || item.is_typing_name) && subtitle.senderImage && (
                            <Image
                                source={{ uri: subtitle.senderImage }}
                                style={styles.senderThumb}
                                contentFit="cover"
                            />
                        )}
                        <Text
                            style={[
                                styles.message,
                                {
                                    color: item.is_typing_name ? theme.primary : theme.textSecondary,
                                    flex: 1,
                                    fontStyle: item.is_typing_name ? 'italic' : 'normal',
                                    fontWeight: item.is_typing_name ? '600' : 'normal',
                                    textAlign
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {subtitle.text}
                        </Text>
                    </View>
                ) : null}
                <Text style={[styles.time, { color: theme.textTertiary, marginTop: 4 }]}>
                    {formatTime(item.updated_at)}
                </Text>
            </View>

            <View style={styles.metaContainer}>
                {/* Unread badge */}
                {(item.unread_count ?? 0) > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                            {(item.unread_count ?? 0) > 99 ? '99+' : (item.unread_count ?? 0).toString()}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function ChatScreen() {
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const currentUser = useAuthStore(state => state.user);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const queryClient = useQueryClient();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching,
        isError
    } = useInfiniteQuery({
        queryKey: ['conversations', activeFilter, debouncedSearchQuery],
        queryFn: async ({ pageParam = 0 }) => {
            const fetchedResults = await ChatService.getConversations({
                type: activeFilter !== 'ALL' ? activeFilter : undefined,
                q: debouncedSearchQuery || undefined,
                limit: 20,
                offset: pageParam
            });

            return fetchedResults;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 20) return undefined;
            return allPages.length * 20;
        },
        initialPageParam: 0,
    });

    const conversations = data?.pages.flat() || [];
    const { subscribe } = useWebSocket();

    useEffect(() => {
        // 1. Message Created Listener
        const unsubscribeMessage = subscribe('message.created', (payload: any) => {
            try {
                const message = payload.data || payload;
                if (!message || !message.conversation_id) {
                    console.warn('[Chat] Invalid message.created payload:', payload);
                    return;
                }

                // If we are filtering or searching, it's safer to just invalidate
                if (activeFilter !== 'ALL' || searchQuery) {
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    return;
                }

                // Optimistically update the conversation list with new message structure
                queryClient.setQueriesData({ queryKey: ['conversations'] }, (oldData: any) => {
                    if (!oldData || !oldData.pages) return oldData;

                    const conversationId = message.conversation_id;
                    const activeConvId = queryClient.getQueryData<string>(['active-conversation-id']);
                    const isChatOpen = activeConvId === conversationId;

                    // Proactively resolve sender name/image from existing conversation members if missing in payload
                    let senderName = message.sender_name || message.sender?.name;
                    let senderImage = (message.sender_image && message.sender_image !== "") ? message.sender_image : (message.sender?.image || "");
                    
                    // Update the conversation list
                    const newPages = oldData.pages.map((page: Conversation[]) => [...page]);
                    let foundIndex = -1;
                    let foundPageIndex = -1;

                    for (let i = 0; i < newPages.length; i++) {
                        const idx = newPages[i].findIndex((c: Conversation) => c.id === conversationId);
                        if (idx !== -1) {
                            foundPageIndex = i;
                            foundIndex = idx;
                            break;
                        }
                    }

                    if (foundPageIndex !== -1) {
                        const existingConv = newPages[foundPageIndex][foundIndex];
                        
                        // Resolve from members if still missing
                        if (!senderName || senderName === 'Someone') {
                            const member = existingConv.members?.find((m: any) => m.user_id === message.sender_id);
                            if (member?.profile?.name) senderName = member.profile.name;
                            if (!senderImage && member?.profile?.image) senderImage = member.profile.image;
                        }
                        
                        // Final fallback
                        if (!senderName) senderName = 'Someone';
                        if (!senderImage) senderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`;

                        const fullMessageObject = {
                            id: message.message_id || message.id,
                            conversation_id: message.conversation_id,
                            sender_id: message.sender_id,
                            content: message.content || message.body || '',
                            type: (message.type === 'chat.message' || message.type === 'text') ? 'text' : (message.type || 'text'),
                            media_urls: message.media_urls || [],
                            created_at: message.created_at || new Date().toISOString(),
                            sender: {
                                id: message.sender_id,
                                name: senderName,
                                image: senderImage
                            }
                        };

                        // Proactively update the detailed message cache if it exists
                        queryClient.setQueryData(['messages', conversationId], (oldMessages: any) => {
                            if (!oldMessages || !oldMessages.pages) return oldMessages;
                            
                            const newMsgPages = [...oldMessages.pages];
                            if (newMsgPages.length > 0) {
                                const firstPage = newMsgPages[0];
                                const isArray = Array.isArray(firstPage);
                                const currentMsgs = isArray ? firstPage : (firstPage.messages || []);
                                
                                if (currentMsgs.some((m: any) => m.id === fullMessageObject.id)) return oldMessages;

                                const updatedMsgs = [fullMessageObject, ...currentMsgs];
                                
                                if (isArray) {
                                    newMsgPages[0] = updatedMsgs;
                                } else {
                                    newMsgPages[0] = { ...firstPage, messages: updatedMsgs };
                                }
                                
                                return { ...oldMessages, pages: newMsgPages };
                            }
                            return oldMessages;
                        });

                        const updatedConv = {
                            ...existingConv,
                            unread_count: isChatOpen ? 0 : (message.unread_count ? parseInt(message.unread_count, 10) : (existingConv.unread_count || 0) + 1),
                            last_message: fullMessageObject,
                            updated_at: message.created_at || new Date().toISOString(),
                            is_typing_name: null 
                        };

                        newPages[foundPageIndex].splice(foundIndex, 1);
                        newPages[0].unshift(updatedConv);

                        return { ...oldData, pages: newPages };
                    } else {
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                        return oldData;
                    }
                });
            } catch (error) {
                console.error('[Chat] Error handling message.created:', error);
                // On error, invalidate to ensure consistency
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        });

        // 2. Typing Indicator Listener
        const unsubscribeTyping = subscribe('typing', (payload: any) => {
            const typingData = payload.data || payload;
            if (!typingData || !typingData.conversation_id) return;

            queryClient.setQueriesData({ queryKey: ['conversations'] }, (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;

                const newPages = oldData.pages.map((page: Conversation[]) => {
                    const index = page.findIndex(c => c.id === typingData.conversation_id);
                    if (index !== -1) {
                        const newPage = [...page];
                        newPage[index] = {
                            ...newPage[index],
                            is_typing_name: typingData.is_typing ? (typingData.user_name || 'Someone') : null,
                            is_typing_image: typingData.is_typing ? typingData.user_image : null
                        };
                        return newPage;
                    }
                    return page;
                });

                return { ...oldData, pages: newPages };
            });
        });

        // 3. Conversation Read Listener (Multi-device sync)
        const unsubscribeRead = subscribe('conversation.read', (payload: any) => {
            const readData = payload.data || payload;
            if (!readData || !readData.conversation_id) return;

            queryClient.setQueriesData({ queryKey: ['conversations'] }, (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;

                const newPages = oldData.pages.map((page: Conversation[]) => {
                    const index = page.findIndex(c => c.id === readData.conversation_id);
                    if (index !== -1) {
                        const newPage = [...page];
                        newPage[index] = {
                            ...newPage[index],
                            unread_count: 0
                        };
                        return newPage;
                    }
                    return page;
                });

                return { ...oldData, pages: newPages };
            });
        });

        return () => {
            unsubscribeMessage();
            unsubscribeTyping();
            unsubscribeRead();
        };
    }, [queryClient, subscribe]);



    const renderConversationItem = ({ item }: { item: Conversation }) => {
        return <ConversationItem item={item} theme={theme} router={router} t={t} textAlign={textAlign} />;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient
                colors={primaryGradient.colors}
                locations={primaryGradient.locations}
                start={primaryGradient.start}
                end={primaryGradient.end}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>{t('tabs.chat')}</Text>

                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.8)" />
                        <TextInput
                            style={[styles.searchInput, { textAlign }]}
                            placeholder={t('common.search') + "..."}
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
            </LinearGradient>

            {/* Filters */}
            <View style={[styles.filtersContainer, { borderBottomColor: theme.divider }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.filterChip,
                                activeFilter === filter.key
                                    ? { backgroundColor: theme.primary }
                                    : { backgroundColor: isDark ? 'rgba(79, 191, 138, 0.2)' : 'rgba(9, 125, 70, 0.1)' }
                            ]}
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setActiveFilter(filter.key);
                            }}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter.key
                                    ? { color: '#FFFFFF' }
                                    : { color: theme.primary }
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Conversations List */}
            {isLoading ? (
                <LoadingSkeleton theme={theme} isDark={isDark} />
            ) : isError ? (
                <ErrorState theme={theme} isDark={isDark} onRetry={refetch} />
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, conversations.length === 0 && { flex: 1 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor={theme.primary}
                            colors={[theme.primary]}
                        />
                    }
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={theme.primary} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <EmptyState
                            theme={theme}
                            isDark={isDark}
                            activeFilter={activeFilter}
                            searchQuery={searchQuery}
                        />
                    }
                />
            )}

            {/* FAB - Restricted for students/parents as per group creation policy */}
            {currentUser?.role !== 'STUDENT' && currentUser?.role !== 'PARENT' && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: insets.bottom + 20 }]}
                    activeOpacity={0.8}
                    onPress={() => router.push('/new-chat')}
                >
                    <LinearGradient
                        colors={primaryGradient.colors}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="add" size={30} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

// Role Badge Component
function RoleBadge({ role, isDark }: { role: string, isDark: boolean }) {
    let bg, color;
    const upperRole = role?.toUpperCase();

    switch (upperRole) {
        case 'OWNER':
            bg = '#097D46';
            color = '#FFFFFF';
            break;
        case 'ADMIN':
            bg = isDark ? 'rgba(79, 191, 138, 0.2)' : 'rgba(9, 125, 70, 0.1)';
            color = isDark ? '#4FBF8A' : '#097D46';
            break;
        case 'INSTRUCTOR':
        case 'TEACHER':
            bg = isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF';
            color = '#3B82F6';
            break;
        case 'STUDENT':
            bg = isDark ? 'rgba(66, 153, 225, 0.2)' : '#EBF8FF';
            color = isDark ? '#63B3ED' : '#3182CE';
            break;
        case 'GROUP':
            bg = isDark ? 'rgba(159, 122, 234, 0.2)' : '#FAF5FF';
            color = '#9F7AEA';
            break;
        default:
            bg = isDark ? '#2D3748' : '#EDF2F7';
            color = isDark ? '#A0AEC0' : '#718096';
    }

    return (
        <View style={[styles.roleBadge, { backgroundColor: bg }]}>
            <Text style={[styles.roleText, { color }]}>{upperRole || role}</Text>
        </View>
    );
}

// Empty State Component
function EmptyState({ theme, isDark, activeFilter, searchQuery }: { theme: any, isDark: boolean, activeFilter: string, searchQuery: string }) {
    const getMessage = () => {
        if (searchQuery) return `No chats matching "${searchQuery}"`;
        switch (activeFilter) {
            case 'instructors': return 'No instructor conversations';
            case 'students': return 'No student conversations';
            case 'teachers': return 'No teacher conversations';
            case 'parents': return 'No parent conversations';
            case 'groups': return 'No group conversations';
            case 'GROUP': return 'No group conversations';
            case 'DIRECT': return 'No direct conversations';
            default: return 'No conversations yet';
        }
    };

    const getSubtitle = () => {
        if (searchQuery) return "Try adjusting your search or check your spelling";
        switch (activeFilter) {
            case 'instructors': return 'Start chatting with your instructors';
            case 'students': return 'Connect with students';
            case 'teachers': return 'Reach out to teachers';
            case 'parents': return 'Connect with parents';
            case 'groups': return 'Browse your course groups';
            case 'GROUP': return 'Browse all groups';
            case 'DIRECT': return 'Start a direct chat';
            default: return 'Start a new conversation by tapping the + button below';
        }
    };

    const getIcon = () => {
        if (searchQuery) return 'search-outline';
        switch (activeFilter) {
            case 'instructors': return 'school-outline';
            case 'teachers': return 'briefcase-outline';
            case 'students': return 'people-outline';
            case 'parents': return 'home-outline';
            case 'groups':
            case 'GROUP': return 'chatbubbles-outline';
            case 'DIRECT': return 'person-outline';
            default: return 'chatbubble-ellipses-outline';
        }
    };

    return (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(79, 191, 138, 0.1)' : 'rgba(9, 125, 70, 0.05)' }]}>
                <Ionicons name={getIcon()} size={60} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {getMessage()}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {getSubtitle()}
            </Text>
        </View>
    );
}

// Loading Skeleton Component
function LoadingSkeleton({ theme, isDark }: { theme: any, isDark: boolean }) {
    const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';

    return (
        <View style={styles.loadingContainer}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <View key={item} style={[styles.skeletonItem, { borderBottomColor: theme.divider }]}>
                    <View style={[styles.skeletonAvatar, { backgroundColor: skeletonColor }]} />
                    <View style={styles.skeletonContent}>
                        <View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: skeletonColor }]} />
                        <View style={[styles.skeletonLine, styles.skeletonSubtitle, { backgroundColor: skeletonColor }]} />
                        <View style={[styles.skeletonLine, styles.skeletonTime, { backgroundColor: skeletonColor }]} />
                    </View>
                </View>
            ))}
        </View>
    );
}

// Error State Component
function ErrorState({ theme, isDark, onRetry }: { theme: any, isDark: boolean, onRetry: () => void }) {
    return (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }]}>
                <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Failed to load conversations
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Something went wrong while loading your chats. Please check your connection and try again.
            </Text>
            <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={onRetry}
                activeOpacity={0.8}
            >
                <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    searchContainer: {
        width: '100%',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: Fonts.regular,
        color: '#FFFFFF',
        height: '100%',
    },
    filtersContainer: {
        borderBottomWidth: 1,
    },
    filtersContent: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
    listContent: {
        paddingBottom: 100, // Space for FAB
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#48BB78', // Green
        borderWidth: 2,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    senderThumb: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 4,
    },
    name: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
    },
    message: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    metaContainer: {
        alignItems: 'flex-end',
        gap: 6,
    },
    time: {
        fontSize: 11,
        fontFamily: Fonts.medium,
    },
    unreadBadge: {
        backgroundColor: '#097D46', // App's primary green color
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
    },
    skeletonItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        alignItems: 'center',
        gap: 12,
    },
    skeletonAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    skeletonContent: {
        flex: 1,
        gap: 8,
    },
    skeletonLine: {
        height: 12,
        borderRadius: 6,
    },
    skeletonTitle: {
        width: '60%',
        height: 16,
    },
    skeletonSubtitle: {
        width: '80%',
    },
    skeletonTime: {
        width: '30%',
        height: 10,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
});
