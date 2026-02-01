import { Fonts, primaryGradient } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { Conversation } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS = ['ALL', 'INSTRUCTORS', 'STUDENTS', 'GROUPS'];

export default function ChatScreen() {
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const currentUser = useAuthStore(state => state.user);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['conversations', activeFilter, searchQuery],
        queryFn: () => ChatService.getConversations({
            type: activeFilter === 'GROUPS' ? 'GROUP' : undefined,
            role: activeFilter === 'INSTRUCTORS' ? 'INSTRUCTOR' : activeFilter === 'STUDENTS' ? 'STUDENT' : undefined,
            q: searchQuery || undefined
        }),
    });

    const conversations = data?.conversations || [];

    const getConversationDisplay = (item: Conversation) => {
        if (item.type === 'DIRECT') {
            const otherMember = item.members?.find(m => m.user_id !== currentUser?.id);
            return {
                name: otherMember?.user_name || 'User',
                avatar: otherMember?.user_image || 'https://ui-avatars.com/api/?name=User',
                role: otherMember?.user_role || 'STUDENT',
            };
        }
        return {
            name: item.name || 'Group Chat',
            avatar: 'https://ui-avatars.com/api/?name=' + (item.name || 'G'),
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
            if (item.preview_text) return item.preview_text;
            if (item.last_message) {
                const isMe = item.last_message.sender_id === useAuthStore.getState().user?.id;
                const content = item.last_message.type === 'image' ? '📷 Image' :
                    item.last_message.type === 'voice' ? '🎤 Voice Message' :
                        item.last_message.content;
                return isMe ? `${t('chat.you')}: ${content}` : content;
            }
            return item.description || t('chat.no_messages');
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
                    <Text
                        style={[styles.message, { color: theme.textSecondary, textAlign }]}
                        numberOfLines={1}
                    >
                        {getSubtitle()}
                    </Text>
                </View>

                <View style={styles.metaContainer}>
                    <Text style={[styles.time, { color: theme.primary }]}>{formatTime(item.updated_at)}</Text>
                    {item.unread_count > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.unreadText}>{item.unread_count}</Text>
                        </View>
                    )}
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
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, conversations.length === 0 && { flex: 1 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
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
            case 'INSTRUCTORS': return 'No instructors found';
            case 'STUDENTS': return 'No students found';
            case 'GROUPS': return 'No groups found';
            default: return 'No conversations yet';
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
                {searchQuery ? "Try checking your spelling or search for something else" : "Start a new conversation by tapping the button below"}
            </Text>
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
});
