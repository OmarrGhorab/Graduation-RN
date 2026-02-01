import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ChatService } from '@/services/ChatService';
import { ChatMember } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: () => leaveGroupMutation.mutate() },
            ]
        );
    };

    const renderMember = (member: ChatMember) => (
        <View key={member.user_id} style={[styles.memberItem, { borderBottomColor: theme.divider }]}>
            <Image
                source={{ uri: member.user_image || `https://ui-avatars.com/api/?name=${member.user_name}` }}
                style={styles.memberAvatar}
                contentFit="cover"
                transition={200}
            />
            <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.text }]}>{member.user_name}</Text>
                <Text style={[styles.memberStatus, { color: theme.textSecondary }]}>{member.user_role}</Text>
            </View>
            <RoleTag role={member.user_role} isDark={isDark} />
        </View>
    );

    if (isConvLoading || isMembersLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!conversation) return null;

    const isDirect = conversation.type === 'DIRECT';
    const displayInfo = isDirect ? (
        conversation.members?.find(m => m.user_id !== currentUser?.id) || { user_name: 'User', user_image: '', user_role: 'STUDENT' }
    ) : { user_name: conversation.name, user_image: '', user_role: 'GROUP' };

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
                            <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary, borderColor: theme.background }]}>
                                <Ionicons name="pencil" size={16} color="#FFFFFF" />
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
                        <TouchableOpacity style={[styles.resourceItem, { borderBottomColor: theme.divider }]}>
                            <Ionicons name="bookmark" size={24} color={theme.primary} />
                            <Text style={[styles.resourceText, { color: theme.text }]}>Pinned Messages</Text>
                            <Ionicons name={textAlign === 'right' ? "chevron-back" : "chevron-forward"} size={20} color={theme.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.resourceItem}>
                            <Ionicons name="images" size={24} color={theme.primary} />
                            <View style={styles.mediaContent}>
                                <Text style={[styles.resourceText, { color: theme.text }]}>Media, Links, and Docs</Text>
                            </View>
                            <Ionicons name={textAlign === 'right' ? "chevron-back" : "chevron-forward"} size={20} color={theme.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Members */}
                {!isDirect && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionHeading, { color: theme.text }]}>Members</Text>
                            <TouchableOpacity>
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

                {/* Leave Group */}
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
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const RoleTag = ({ role, isDark }: { role: string, isDark: boolean }) => {
    let bg, color, border;

    switch (role) {
        case 'OWNER':
        case 'INSTRUCTOR':
            bg = '#097D46';
            color = '#FFFFFF';
            border = 'transparent';
            break;
        case 'ASSISTANT':
            bg = 'transparent';
            color = isDark ? '#4FBF8A' : '#097D46';
            border = isDark ? '#4FBF8A' : '#097D46';
            break;
        default: // STUDENT
            bg = isDark ? '#2D3748' : '#F7FAFC';
            color = isDark ? '#A0AEC0' : '#4A5568';
            border = 'transparent';
    }

    return (
        <View style={[
            styles.roleTag,
            { backgroundColor: bg, borderColor: border, borderWidth: role === 'ASSISTANT' ? 1 : 0 }
        ]}>
            <Text style={[styles.roleText, { color }]}>{role}</Text>
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
});
