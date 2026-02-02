import CustomConfirmModal from '@/components/CustomConfirmModal';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { User } from '@/types/auth'; // Import User type
import { ChatMember } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GroupInfoScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const currentUser = useAuthStore(state => state.user);
    const queryClient = useQueryClient();

    const { data: conversation, isLoading: isConvLoading } = useQuery({
        queryKey: ['conversation', id],
        queryFn: () => ChatService.getConversationDetails(id!),
        enabled: !!id,
    });

    const { data: members, isLoading: isMembersLoading } = useQuery({
        queryKey: ['members', id],
        queryFn: () => ChatService.getMembers(id!),
        enabled: !!id,
    });

    // Add Member State
    const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isKickModalVisible, setIsKickModalVisible] = useState(false);
    const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [memberToKick, setMemberToKick] = useState<ChatMember | null>(null);

    // Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 1) {
                setIsSearching(true);
                try {
                    const response = await ChatService.searchUsers(searchQuery);
                    // Filter out existing members
                    const existingIds = members?.map(m => m.user_id) || [];
                    const filtered = (response.users || []).filter(u => !existingIds.includes(u.id));
                    setSearchResults(filtered);
                } catch (error) {
                    console.error('Search failed:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, members]);

    const addMemberMutation = useMutation({
        mutationFn: (userId: string) => ChatService.addMember(id!, { user_id: userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', id] });
            setIsAddMemberModalVisible(false);
            setSearchQuery('');
            Alert.alert('Success', 'Member added successfully');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to add member');
        },
    });

    const leaveGroupMutation = useMutation({
        mutationFn: () => ChatService.removeMember(id, currentUser?.id || ''),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            router.replace('/(main)/chat');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to leave group');
        },
    });

    const handleLeaveGroup = () => {
        setIsLeaveModalVisible(true);
    };

    const kickMemberMutation = useMutation({
        mutationFn: (userId: string) => ChatService.removeMember(id!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', id] });
            Alert.alert('Success', 'Member removed successfully');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to remove member');
        },
    });

    const updateGroupImageMutation = useMutation({
        mutationFn: (imageUrl: string) => ChatService.updateGroupImage(id!, imageUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversation', id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            // Alert removed as per user request to handle it via query refresh
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to update image');
        },
    });

    const updateMemberRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string, role: string }) =>
            ChatService.updateMemberRole(id!, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', id] });
            Alert.alert('Success', 'Member role updated successfully');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to update role');
        },
    });

    const deleteGroupMutation = useMutation({
        mutationFn: () => ChatService.deleteConversation(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            router.replace('/(main)/chat');
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to delete group');
        },
    });

    const handleDeleteGroup = () => {
        setIsDeleteModalVisible(true);
    };

    const handleUpdateImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Use array instead of deprecated string constant
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            try {
                const imageUrl = await ChatService.uploadMedia(result.assets[0].uri, 'image');
                updateGroupImageMutation.mutate(imageUrl);
            } catch (error) {
                Alert.alert('Error', 'Failed to upload image');
            }
        }
    };

    const handleMemberOptions = (member: ChatMember) => {
        if (!currentUser) return;

        const currentMember = members?.find(m => m.user_id === currentUser.id);
        const myRole = currentMember?.member_role;

        // Management is strictly restricted to local roles as per documentation
        const isAuthorized = myRole === 'OWNER' || myRole === 'ADMIN';

        if (!isAuthorized || member.user_id === currentUser.id) return;

        // Admin can only manage Members, Owner can manage anyone
        if (myRole === 'ADMIN' && member.member_role !== 'MEMBER') return;

        const options = ['Cancel'];
        const actions: (() => void)[] = [() => { }];

        // Role Management
        if (member.member_role === 'MEMBER') {
            options.push('Promote to Assistant (Admin)');
            actions.push(() => updateMemberRoleMutation.mutate({ userId: member.user_id, role: 'ADMIN' }));
        } else if (member.member_role === 'ADMIN') {
            options.push('Demote to Member');
            actions.push(() => updateMemberRoleMutation.mutate({ userId: member.user_id, role: 'MEMBER' }));
        }

        // Kicking handled by the trash icon, but could be added here too.

        if (options.length > 1) {
            Alert.alert(
                'Member Options',
                `What would you like to do with ${member.user_name}?`,
                options.map((option, index) => ({
                    text: option,
                    style: option === 'Cancel' ? 'cancel' : 'default',
                    onPress: actions[index]
                }))
            );
        }
    };

    const handleKickMember = (member: ChatMember) => {
        setMemberToKick(member);
        setIsKickModalVisible(true);
    };

    const confirmKickMember = () => {
        if (memberToKick) {
            kickMemberMutation.mutate(memberToKick.user_id);
            setMemberToKick(null);
            setIsKickModalVisible(false);
        }
    };

    const canKick = (targetMember: ChatMember) => {
        if (!currentUser) return false;
        if (currentUser.id === targetMember.user_id) return false; // Self

        const currentMember = members?.find(m => m.user_id === currentUser.id);
        if (!currentMember) return false;

        const myRole = currentMember.member_role;
        const targetRole = targetMember.member_role;

        // Logic strictly based on local group roles
        if (myRole === 'OWNER') return true;
        if (myRole === 'ADMIN') return targetRole === 'MEMBER';

        return false;
    };

    const renderMember = (member: ChatMember) => {
        const canRemove = canKick(member);
        return (
            <TouchableOpacity
                key={member.user_id}
                style={[styles.memberItem, { borderBottomColor: theme.divider }]}
                onPress={() => {
                    // Navigate to profile or show options? For now just profile if we had one
                }}
            >
                <Image
                    source={{ uri: member.user_image || (member.user_name ? `https://ui-avatars.com/api/?name=${member.user_name}` : undefined) }}
                    style={styles.memberAvatar}
                    contentFit="cover"
                />
                <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                        {member.user_name}
                        {member.user_id === currentUser?.id && <Text style={{ color: theme.textSecondary }}> (You)</Text>}
                    </Text>
                    <View style={styles.roleContainer}>
                        <RoleTag role={member.member_role || 'STUDENT'} isDark={isDark} />
                        {member.member_role === 'OWNER' && <Text style={{ fontSize: 10, color: theme.textSecondary, marginLeft: 4 }}>👑</Text>}
                    </View>
                </View>
                {canRemove ? (
                    <TouchableOpacity
                        onPress={() => handleKickMember(member)}
                        style={{ padding: 8 }}
                        disabled={kickMemberMutation.isPending}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => handleMemberOptions(member)} style={{ padding: 8 }}>
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    if (isConvLoading || isMembersLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!conversation) return null;

    const isDirect = conversation.type === 'DIRECT';
    let displayInfo;

    if (isDirect) {
        const otherMember = conversation.members?.find(m => m.user_id !== currentUser?.id);
        displayInfo = {
            user_name: conversation.name || otherMember?.user_name || 'User',
            user_image: conversation.image_url || otherMember?.user_image,
            user_role: otherMember?.user_role || 'STUDENT'
        };
    } else {
        displayInfo = {
            user_name: conversation.name || 'Group Chat',
            user_image: conversation.image_url,
            user_role: 'GROUP'
        };
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <BlurView
                intensity={Platform.OS === 'android' ? 50 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.header, { paddingTop: insets.top, borderBottomColor: theme.divider }]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name={textAlign === 'right' ? "chevron-forward" : "chevron-back"} size={28} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{isDirect ? 'Contact Info' : 'Group Info'}</Text>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={theme.primary} />
                </TouchableOpacity>
            </BlurView>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={[styles.profileSection, { marginTop: 60 + insets.top }]}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: displayInfo.user_image || (displayInfo.user_name ? `https://ui-avatars.com/api/?name=${displayInfo.user_name}` : undefined) }}
                            style={[styles.profileAvatar, { borderColor: isDark ? 'rgba(9, 125, 70, 0.2)' : 'rgba(9, 125, 70, 0.1)' }]}
                            contentFit="cover"
                            transition={200}
                        />
                        {!isDirect && (
                            <TouchableOpacity
                                style={[styles.editButton, { backgroundColor: theme.primary, borderColor: theme.background }]}
                                onPress={handleUpdateImage}
                                disabled={updateGroupImageMutation.isPending}
                            >
                                {updateGroupImageMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="pencil" size={16} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={[styles.groupName, { color: theme.text }]}>{displayInfo.user_name}</Text>
                    {!isDirect && <Text style={[styles.memberCount, { color: theme.primary }]}>{members?.length || 0} Members</Text>}
                </View>

                {/* Description */}
                {(conversation.description || isDirect) && (
                    <View style={styles.section}>
                        <View style={[styles.card, { backgroundColor: isDark ? theme.surface : theme.surface, borderColor: theme.border }]}>
                            <Text style={styles.sectionTitle}>{isDirect ? 'INFO' : 'DESCRIPTION'}</Text>
                            <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                                {conversation.description || (isDirect ? 'Direct conversation' : 'No description')}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Resources */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: isDark ? theme.surface : theme.surface, borderColor: theme.border, padding: 0, overflow: 'hidden' }]}>
                        <TouchableOpacity
                            style={[styles.resourceItem, { borderBottomColor: theme.divider }]}
                            onPress={() => router.push(`/group-info/pinned/${id}`)}
                        >
                            <Ionicons name="bookmark" size={24} color={theme.primary} />
                            <Text style={[styles.resourceText, { color: theme.text }]}>Pinned Messages</Text>
                            <Ionicons name={textAlign === 'right' ? "chevron-back" : "chevron-forward"} size={20} color={theme.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resourceItem}
                            onPress={() => router.push(`/group-info/media/${id}`)}
                        >
                            <Ionicons name="images" size={24} color={theme.primary} />
                            <Text style={[styles.resourceText, { color: theme.text }]}>Media, Links, and Docs</Text>
                            <Ionicons name={textAlign === 'right' ? "chevron-back" : "chevron-forward"} size={20} color={theme.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Members */}
                {!isDirect && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionHeading, { color: theme.text }]}>Members</Text>
                            <TouchableOpacity onPress={() => setIsAddMemberModalVisible(true)}>
                                <Text style={[styles.addButton, { color: theme.primary }]}>Add Member</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.card, { backgroundColor: isDark ? theme.surface : theme.surface, borderColor: theme.border, padding: 0 }]}>
                            {members?.slice(0, 5).map((member: ChatMember) => renderMember(member))}
                            {(members?.length || 0) > 5 && (
                                <TouchableOpacity style={styles.viewAllButton}>
                                    <Text style={[styles.viewAllText, { color: theme.primary }]}>View All {members?.length} Members</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Leave Group / Delete Group */}
                {!isDirect && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.leaveButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}
                            onPress={handleLeaveGroup}
                            disabled={leaveGroupMutation.isPending}
                        >
                            {leaveGroupMutation.isPending ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <>
                                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                                    <Text style={styles.leaveText}>Leave Group</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {(members?.find(m => m.user_id === currentUser?.id)?.member_role === 'OWNER' ||
                            members?.find(m => m.user_id === currentUser?.id)?.member_role === 'ADMIN') && (
                                <TouchableOpacity
                                    style={[styles.leaveButton, {
                                        marginTop: 12,
                                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA',
                                        borderColor: '#EF4444'
                                    }]}
                                    onPress={handleDeleteGroup}
                                    disabled={deleteGroupMutation.isPending}
                                >
                                    {deleteGroupMutation.isPending ? (
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    ) : (
                                        <>
                                            <Ionicons name="trash-outline" size={24} color="#EF4444" />
                                            <Text style={[styles.leaveText, { color: '#B91C1C' }]}>Delete Group</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                    </View>
                )}

            </ScrollView>

            <CustomConfirmModal
                visible={isKickModalVisible}
                onClose={() => setIsKickModalVisible(false)}
                onConfirm={confirmKickMember}
                title="Remove Member"
                message={`Are you sure you want to remove ${memberToKick?.user_name || 'this member'}?`}
                confirmText="Remove"
                isDestructive
                isDark={isDark}
                theme={theme}
            />

            <CustomConfirmModal
                visible={isLeaveModalVisible}
                onClose={() => setIsLeaveModalVisible(false)}
                onConfirm={() => leaveGroupMutation.mutate()}
                title="Leave Group"
                message="Are you sure you want to leave this group?"
                confirmText="Leave"
                isDestructive
                isDark={isDark}
                theme={theme}
            />

            <CustomConfirmModal
                visible={isDeleteModalVisible}
                onClose={() => setIsDeleteModalVisible(false)}
                onConfirm={() => deleteGroupMutation.mutate()}
                title="Delete Group"
                message="Are you sure you want to permanently delete this group and all its data? This action cannot be undone."
                confirmText="Delete"
                isDestructive
                isDark={isDark}
                theme={theme}
            />

            {/* Add Member Modal */}
            <Modal
                visible={isAddMemberModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsAddMemberModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Add Member</Text>
                        <TouchableOpacity onPress={() => setIsAddMemberModalVisible(false)}>
                            <Text style={{ color: theme.primary, fontSize: 16 }}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.surface : theme.surfaceVariant }]}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search users..."
                            placeholderTextColor={theme.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>

                    {isSearching ? (
                        <ActivityIndicator style={{ marginTop: 20 }} color={theme.primary} />
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.userItem, { borderBottomColor: theme.divider }]}
                                    onPress={() => addMemberMutation.mutate(item.id)}
                                    disabled={addMemberMutation.isPending}
                                >
                                    <Image
                                        source={{ uri: item.profileImg || `https://ui-avatars.com/api/?name=${item.name}` }}
                                        style={styles.memberAvatar}
                                    />
                                    <View style={styles.memberInfo}>
                                        <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
                                        <Text style={[styles.memberStatus, { color: theme.textSecondary }]}>{item.role}</Text>
                                    </View>
                                    {addMemberMutation.isPending ? (
                                        <ActivityIndicator size="small" color={theme.primary} />
                                    ) : (
                                        <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                searchQuery.length > 1 ? (
                                    <Text style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary }}>No users found</Text>
                                ) : null
                            }
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const RoleTag = ({ role, isDark }: { role: string, isDark: boolean }) => {
    let bg, color, border;
    let label = role;

    switch (role) {
        case 'OWNER':
        case 'INSTRUCTOR':
        case 'TEACHER':
            bg = '#097D46';
            color = '#FFFFFF';
            border = 'transparent';
            break;
        case 'ADMIN':
        case 'ASSISTANT':
            bg = 'transparent';
            color = isDark ? '#4FBF8A' : '#097D46';
            border = isDark ? '#4FBF8A' : '#097D46';
            label = 'ASSISTANT';
            break;
        default: // STUDENT, MEMBER
            bg = isDark ? '#2D3748' : '#F7FAFC';
            color = isDark ? '#A0AEC0' : '#4A5568';
            border = 'transparent';
            label = role === 'MEMBER' ? 'MEMBER' : 'STUDENT';
    }

    return (
        <View style={[
            styles.roleTag,
            { backgroundColor: bg, borderColor: border, borderWidth: (role === 'ASSISTANT' || role === 'ADMIN') ? 1 : 0 }
        ]}>
            <Text style={[styles.roleText, { color }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    moreButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 16,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profileAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    groupName: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        textAlign: 'center',
        marginBottom: 4,
    },
    memberCount: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        color: '#949DA5',
        marginBottom: 8,
        letterSpacing: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionHeading: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    addButton: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    descriptionText: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    resourceText: {
        flex: 1,
        fontSize: 15,
        fontFamily: Fonts.medium,
    },
    mediaContent: {
        flex: 1,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    memberStatus: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    roleTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
    },
    viewAllButton: {
        padding: 16,
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    leaveText: {
        color: '#EF4444',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    modalContainer: {
        flex: 1,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.regular,
        height: '100%',
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
});
