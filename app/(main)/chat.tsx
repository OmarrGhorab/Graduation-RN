import { Fonts, primaryGradient } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { Conversation } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS = ['ALL', 'INSTRUCTORS', 'STUDENTS', 'GROUPS'];

interface ChatMessageNotification {
    userId: string;
    type: string;
    messageId: string;
    conversationId: string;
    senderName: string;
    messagePreview: string;
    messageType: string;
}

export default function ChatScreen() {
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const currentUser = useAuthStore(state => state.user);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading, refetch, isRefetching, isError, error } = useQuery({
        queryKey: ['conversations', activeFilter, searchQuery],
        queryFn: () => ChatService.getConversations({
            type: activeFilter === 'GROUPS' ? 'GROUP' : undefined,
            role: activeFilter === 'INSTRUCTORS' ? 'INSTRUCTOR' : activeFilter === 'STUDENTS' ? 'STUDENT' : undefined,
            q: searchQuery || undefined
        }),
    });

    const { subscribe } = useWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe('message.created', (payload: any) => {
            try {
                // Check if payload needs unpacking (some backends wrap in 'data')
                const message = payload.data || payload;

                // Validate message structure
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
                queryClient.setQueryData(['conversations', 'ALL', ''], (oldData: Conversation[] | undefined) => {
                    if (!oldData) return oldData;

                    const conversationId = message.conversation_id;
                    const conversations = [...oldData];
                    const index = conversations.findIndex(c => c.id === conversationId);

                    if (index !== -1) {
                        // Update existing conversation with new last_message structure
                        const updatedConv = {
                            ...conversations[index],
                            last_message: {
                                id: message.id,
                                conversation_id: message.conversation_id,
                                sender_id: message.sender_id,
                                content: message.content,
                                type: message.type,
                                media_urls: message.media_urls || [],
                                created_at: message.created_at,
                                sender: message.sender || {
                                    id: message.sender_id,
                                    name: 'Unknown',
                                    image: `https://ui-avatars.com/api/?name=Unknown`
                                }
                            },
                            updated_at: message.created_at || new Date().toISOString(),
                        };

                        // Remove from current position and move to top
                        conversations.splice(index, 1);
                        conversations.unshift(updatedConv);

                        return conversations;
                    } else {
                        // New conversation - invalidate to fetch fresh data
                        // This handles edge case where user receives message in new conversation
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

        return unsubscribe;
    }, [activeFilter, searchQuery, queryClient, subscribe]);

    const conversations = data || [];

    const getConversationDisplay = (item: Conversation) => {
        if (item.type === 'DIRECT') {
            // Use peer_profile for DIRECT chats
            const displayName = item.peer_profile?.name || item.name || 'User';
            const displayImage = item.peer_profile?.image || item.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;
            return {
                name: displayName,
                avatar: displayImage,
                role: 'STUDENT', // Default role for direct chats
            };
        }
        // Use name and image_url for GROUP chats
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

    const renderConversationItem = ({ item }: { item: Conversation }) => {
        const display = getConversationDisplay(item);

        const getSubtitle = () => {
            if (item.last_message) {
                const isMe = item.last_message.sender_id === useAuthStore.getState().user?.id;
                const senderName = item.last_message.sender?.name || 'Someone';
                
                // Handle media types in preview
                let content = item.last_message.content;
                if (item.last_message.type === 'image') {
                    content = '📷 Image';
                } else if (item.last_message.type === 'voice') {
                    content = '🎤 Voice Message';
                }
                
                // Show sender name for group chats, or "You:" for own messages
                if (item.type === 'GROUP' && !isMe) {
                    return `${senderName}: ${content}`;
                } else if (isMe) {
                    return `${t('chat.you')}: ${content}`;
                }
                return content;
            }
            return item.description || null;
        };

        return (
            <TouchableOpacity
                style={[styles.itemContainer, { borderBottomColor: theme.divider }]}
                activeOpacity={0.7}
                onPress={() => {
                    router.push(`/conversation/${item.id}`);
                }}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: display.avatar }}
                        style={styles.avatar}
                        contentFit="cover"
                        transition={200}
                    />
                </View>

                <View style={styles.contentContainer}>
                    <View style={[styles.headerRow, { direction: textAlign === 'right' ? 'rtl' : 'ltr' }]}>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                            {display.name}
                        </Text>
                        <RoleBadge role={display.role} isDark={isDark} />
                    </View>
                    {getSubtitle() && (
                        <Text
                            style={[styles.message, { color: theme.textSecondary, textAlign }]}
                            numberOfLines={1}
                        >
                            {getSubtitle()}
                        </Text>
                    )}
                    <Text style={[styles.time, { color: theme.textTertiary, marginTop: 4 }]}>{formatTime(item.updated_at)}</Text>
                </View>

                <View style={styles.metaContainer}>
                    {/* Unread badge removed - not provided by API */}
                </View>
            </TouchableOpacity>
        );
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
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Image
                            source={{ uri: currentUser?.profileImg || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDri1dSkSplychwQdo55IV_v5l94pfLv5_M6ZrTANBYsXc7qv43UPcj7NTxKLyPpl_e2T4Zilxk6lZYYwcjTGZ049kSzzsWsN6JimKDAPL7UN-ly80FQlXRwgCfC9zd8viS4tVZxCyALCeebmMv_Ii4Gt6D8EyiOXLHarW2QMNXr1-PLRIvLbvaL6BufhMRqcoIZlkbaB3zjOlzuQIEVvVXjEdpn6_aoPF-_QWS9Yge6WqGFetSVUdjuxOkPwIm2XFms5NVu5ETN1y' }}
                            style={styles.profileImage}
                            contentFit="cover"
                            transition={200}
                        />
                    </View>
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
                            key={filter}
                            style={[
                                styles.filterChip,
                                activeFilter === filter
                                    ? { backgroundColor: theme.primary }
                                    : { backgroundColor: isDark ? 'rgba(79, 191, 138, 0.2)' : 'rgba(9, 125, 70, 0.1)' }
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter
                                    ? { color: '#FFFFFF' }
                                    : { color: theme.primary }
                            ]}>
                                {filter}
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

            {/* FAB */}
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
        </View>
    );
}

// Role Badge Component
function RoleBadge({ role, isDark }: { role: string, isDark: boolean }) {
    let bg, color;

    switch (role) {
        case 'INSTRUCTOR':
        case 'TEACHER':
            bg = isDark ? 'rgba(79, 191, 138, 0.2)' : 'rgba(9, 125, 70, 0.1)';
            color = isDark ? '#4FBF8A' : '#097D46';
            break;
        case 'STUDENT':
            bg = isDark ? 'rgba(66, 153, 225, 0.2)' : '#EBF8FF';
            color = isDark ? '#63B3ED' : '#3182CE';
            break;
        case 'TA':
        case 'ASSISTANT':
            bg = isDark ? 'rgba(79, 191, 138, 0.2)' : 'rgba(9, 125, 70, 0.1)';
            color = isDark ? '#4FBF8A' : '#097D46';
            break;
        default:
            bg = isDark ? '#2D3748' : '#EDF2F7';
            color = isDark ? '#A0AEC0' : '#718096';
    }

    return (
        <View style={[styles.roleBadge, { backgroundColor: bg }]}>
            <Text style={[styles.roleText, { color }]}>{role}</Text>
        </View>
    );
}

// Empty State Component
function EmptyState({ theme, isDark, activeFilter, searchQuery }: { theme: any, isDark: boolean, activeFilter: string, searchQuery: string }) {
    const getMessage = () => {
        if (searchQuery) return `No chats matching "${searchQuery}"`;
        switch (activeFilter) {
            case 'INSTRUCTORS': return 'No instructor conversations';
            case 'STUDENTS': return 'No student conversations';
            case 'GROUPS': return 'No group conversations';
            default: return 'No conversations yet';
        }
    };

    const getSubtitle = () => {
        if (searchQuery) return "Try adjusting your search or check your spelling";
        switch (activeFilter) {
            case 'INSTRUCTORS': return 'Start chatting with your instructors by creating a new conversation';
            case 'STUDENTS': return 'Connect with students by starting a new conversation';
            case 'GROUPS': return 'Create or join a group to start collaborating';
            default: return 'Start a new conversation by tapping the + button below';
        }
    };

    const getIcon = () => {
        if (searchQuery) return 'search-outline';
        switch (activeFilter) {
            case 'INSTRUCTORS': return 'school-outline';
            case 'STUDENTS': return 'people-outline';
            case 'GROUPS': return 'chatbubbles-outline';
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
        gap: 8,
        marginBottom: 4,
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
        backgroundColor: '#EF4444',
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
