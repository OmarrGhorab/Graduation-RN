import { Fonts, primaryGradient } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ChatService } from '@/services/ChatService';
import { User } from '@/types/auth';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewChatScreen() {
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    // Group Modal State
    const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');

    // Discovery Implementation
    const { data: discovery, isLoading: isDiscoveryLoading } = useQuery({
        queryKey: ['chat-discovery'],
        queryFn: () => ChatService.discoverContacts(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Search Users Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setIsLoading(true);
                try {
                    const response = await ChatService.searchUsers(searchQuery);
                    setUsers(response.users || []);
                } catch (error) {
                    console.error('Search failed:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setUsers([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Create Direct Chat Mutation
    const createDirectMutation = useMutation({
        mutationFn: (recipientId: string) => ChatService.createDirectChat(recipientId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            router.replace(`/conversation/${data.id}`);
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to start chat');
        },
    });

    // Create Group Chat Mutation
    const createGroupMutation = useMutation({
        mutationFn: () => ChatService.createGroupChat({
            name: groupName,
            description: groupDesc,
            member_ids: selectedUsers.map(u => u.id),
        }),
        onSuccess: (data) => {
            setIsGroupModalVisible(false);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            router.replace(`/conversation/${data.id}`);
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to create group');
        },
    });

    const toggleUserSelection = (user: User) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleAction = () => {
        if (selectedUsers.length === 1) {
            createDirectMutation.mutate(selectedUsers[0].id);
        } else if (selectedUsers.length > 1) {
            setIsGroupModalVisible(true);
        }
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const isSelected = selectedUsers.find(u => u.id === item.id);
        return (
            <TouchableOpacity
                style={[styles.userItem, { borderBottomColor: theme.divider }]}
                onPress={() => toggleUserSelection(item)}
            >
                <Image
                    source={{ uri: item.profileImg || `https://ui-avatars.com/api/?name=${item.name}` }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.text }]}>{item.name || 'Unknown User'}</Text>
                    <Text style={[styles.userRole, { color: theme.textSecondary }]}>{item.role}</Text>
                </View>
                <View style={[
                    styles.checkbox,
                    { borderColor: theme.primary },
                    isSelected && { backgroundColor: theme.primary }
                ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
            </TouchableOpacity>
        );
    };

    const renderDiscoverySection = (title: string, data: any[], type: 'contact' | 'group') => {
        if (!data || data.length === 0) return null;
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
                    <View style={[styles.sectionBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.sectionBadgeText, { color: theme.primary }]}>{data.length}</Text>
                    </View>
                </View>
                {data.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.discoveryItem,
                            { borderBottomColor: index === data.length - 1 ? 'transparent' : theme.divider }
                        ]}
                        onPress={() => {
                            if (type === 'contact') {
                                // Direct chat for suggestion
                                createDirectMutation.mutate(item.id);
                            } else {
                                // Group chat suggestion
                                // For course groups, the ID matches the conversation ID in our chat service
                                router.replace(`/conversation/${item.id}`);
                            }
                        }}
                    >
                        <View style={styles.discoveryAvatarContainer}>
                            <Image
                                source={{ uri: item.image || `https://ui-avatars.com/api/?name=${item.name}` }}
                                style={styles.discoveryAvatar}
                            />
                            {type === 'group' && (
                                <View style={[styles.groupIconBadge, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="people" size={10} color="white" />
                                </View>
                            )}
                        </View>
                        <View style={styles.discoveryInfo}>
                            <Text style={[styles.discoveryName, { color: theme.text }]}>{item.name}</Text>
                            <Text style={[styles.discoverySub, { color: theme.textSecondary }]}>
                                {type === 'contact' ? `${item.relation} • ${item.role}` : 'Course Group'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <BlurView intensity={Platform.OS === 'android' ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>New Chat</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search users..."
                        placeholderTextColor={theme.textTertiary}
                        style={[styles.searchInput, { color: theme.text, textAlign }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                </View>
            </BlurView>

            {/* Selected Users Horizontal List */}
            {selectedUsers.length > 0 && (
                <View style={[styles.selectedContainer, { borderBottomColor: theme.divider }]}>
                    <FlatList
                        data={selectedUsers}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.selectedUser}
                                onPress={() => toggleUserSelection(item)}
                            >
                                <Image
                                    source={{ uri: item.profileImg || `https://ui-avatars.com/api/?name=${item.name}` }}
                                    style={styles.selectedAvatar}
                                />
                                <View style={styles.removeBadge}>
                                    <Ionicons name="close" size={12} color="white" />
                                </View>
                                <Text style={[styles.selectedName, { color: theme.text }]} numberOfLines={1}>{(item.name || 'User').split(' ')[0]}</Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    />
                </View>
            )}

            {/* Users List */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : searchQuery.trim().length > 1 && users.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="people-outline" size={64} color={theme.textTertiary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No users found</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        searchQuery.trim().length === 0 ? (
                            <View style={styles.discoveryContainer}>
                                {isDiscoveryLoading ? (
                                    <View style={styles.discoveryLoading}>
                                        <ActivityIndicator size="small" color={theme.primary} />
                                        <Text style={[styles.discoveryLoadingText, { color: theme.textSecondary }]}>Finding your contacts...</Text>
                                    </View>
                                ) : (
                                    <>
                                        {renderDiscoverySection(t('Family'), discovery?.contacts.filter(c => c.category === 'FAMILY') || [], 'contact')}
                                        {renderDiscoverySection(t('Academic'), discovery?.contacts.filter(c => c.category === 'ACADEMIC') || [], 'contact')}
                                        {renderDiscoverySection(t('Course Groups'), discovery?.groups || [], 'group')}

                                        {!discovery?.contacts.length && !discovery?.groups.length && (
                                            <View style={styles.guideContainer}>
                                                <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
                                                <Text style={[styles.guideText, { color: theme.textSecondary }]}>
                                                    Search for people by name or email to start a conversation
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Floating Action Button */}
            {selectedUsers.length > 0 && (
                <TouchableOpacity
                    style={[styles.actionButton, { bottom: insets.bottom + 20 }]}
                    onPress={handleAction}
                    activeOpacity={0.8}
                >
                    <LinearGradient colors={primaryGradient.colors} style={styles.actionGradient}>
                        <Text style={styles.actionText}>
                            {selectedUsers.length === 1 ? 'Start Chat' : `Create Group (${selectedUsers.length})`}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Group Modal */}
            <Modal
                visible={isGroupModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsGroupModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>New Group</Text>
                            <TouchableOpacity onPress={() => setIsGroupModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.modalInputContainer}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>GROUP NAME</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant, color: theme.text }]}
                                    value={groupName}
                                    onChangeText={setGroupName}
                                    placeholder="Enter group name..."
                                    placeholderTextColor={theme.textTertiary}
                                />
                            </View>

                            <View style={styles.modalInputContainer}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>DESCRIPTION (OPTIONAL)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant, color: theme.text, height: 100, textAlignVertical: 'top' }]}
                                    value={groupDesc}
                                    onChangeText={setGroupDesc}
                                    placeholder="What is this group about?"
                                    placeholderTextColor={theme.textTertiary}
                                    multiline
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.modalSubmit, { opacity: groupName.trim() ? 1 : 0.5 }]}
                                disabled={!groupName.trim() || createGroupMutation.isPending}
                                onPress={() => createGroupMutation.mutate()}
                            >
                                <LinearGradient colors={primaryGradient.colors} style={styles.modalSubmitGradient}>
                                    {createGroupMutation.isPending ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.modalSubmitText}>Create Group</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    selectedContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    selectedUser: {
        alignItems: 'center',
        marginRight: 20,
        width: 60,
    },
    selectedAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    removeBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    selectedName: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        marginTop: 4,
        textAlign: 'center',
    },
    listContent: {
        paddingVertical: 8,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E2E8F0',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    userRole: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginTop: 16,
    },
    guideContainer: {
        marginTop: 100,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    guideText: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 22,
    },
    actionButton: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 54,
        borderRadius: 27,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actionGradient: {
        flex: 1,
        borderRadius: 27,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        minHeight: '60%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: Fonts.bold,
    },
    modalBody: {
        gap: 20,
    },
    modalInputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    modalInput: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    modalSubmit: {
        height: 54,
        borderRadius: 27,
        marginTop: 12,
    },
    modalSubmitGradient: {
        flex: 1,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSubmitText: {
        color: 'white',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    // Discovery Styles
    discoveryContainer: {
        paddingBottom: 100,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    sectionBadgeText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
    },
    discoveryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    discoveryAvatarContainer: {
        position: 'relative',
    },
    discoveryAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f1f1f1',
    },
    groupIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    discoveryInfo: {
        flex: 1,
        marginLeft: 16,
    },
    discoveryName: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    discoverySub: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    discoveryLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        gap: 12,
    },
    discoveryLoadingText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
});
