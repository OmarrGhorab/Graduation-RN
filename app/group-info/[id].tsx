import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MEMBERS = [
    {
        id: '1',
        name: 'Dr. Arthur Miller',
        role: 'OWNER',
        status: 'Online',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARbPi34pyXMpoockI1LBczPoz2hZbdCMJxMLNxSdH_LEvgMJ3Pc31du72yu8xLJT-HgwfQahhHYxRyiVd259fl6asr1Sh6Ngg_3Ywwz2Xtz77RV7mBfLOUBtc_ttBgXCnghkyJF0bhGU1eg-CTTzGCM9n1cWBebSmvHMuhaHiinmLoTPgMgbZgnqJjiXpS0qb73scYnpKucRbwPzyT5Vc5AERP1KREPzLGkuHFjrP5Gz97cLnGQzm4nBRXxBeX7SPzvQy1EElsTPbb'
    },
    {
        id: '2',
        name: 'Sarah Jenkins',
        role: 'ASSISTANT',
        status: 'Last seen 5m ago',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_o1zFifHwGXTEpYnWT5A3AFz1gcIbJwMj_xW3WsBEvAxhWeTslSguB7mmfdO5SB3hKqhOt7Vx1tMdNFbgIVKkABWCN2Lsti4zlbVqKE2GIcSazi-fn5l50GBwtQQOoCMgy3RLCGO1WCJ8RkABnjRhZcql1dTvvgdXxUWR8kXTib-5woTbw0mB9IWBneWoHvjisfK1NWF-DuMf6ueFS-1lpD8BVO0NP6rmIQu6Q4lvIfqumJHW8MvHX5k46vBmUNOoiC4Q1qdt2FH2'
    },
    {
        id: '3',
        name: 'David Chen',
        role: 'STUDENT',
        status: 'Student',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBxDj7641TXvmoMGjhZtzsOoYufeW9uTPEFUYLvVEirvWO-XtdJVEHrFCIi0AVIV_J0sPJd-a6igBEsT0fHhW_Hm8NjGB2D21Sim3S3F6OLP_pY6fGq75CaEYF068i4-C1YN-kU2iwoHRBqqvo5Q-sMbovn9LRYDEJoxUW9uJ5VlLaZoFENWwntuVVoxqgq3IT9kDpR1HiR5wDXGXSZCqHvQliq54Sy1qqOjAbRTar8rcdZONxhl8yPFOSm3DazGTC6QLdbpyuxpdz'
    },
    {
        id: '4',
        name: 'Emily Rodriguez',
        role: 'STUDENT',
        status: 'Student',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2D5kXfMHD3fltC552sPbanpbradEkOOQDSChVtotLvOoMNL4o7An18Ld5UXipcGKeunExGU4-_MOd9_UUi1VhW2deLTNLzsRKAETOUXOaOg9vEo1iJJWDzCCVDbkL5hwEQshHctDKl48PCmwo9_mmULi9pvmgkXPWUJ05L8I4rK2kh-gJC_gH-x4FVUI6hbLrYXWI2ljgpjAq7yJnb3v7SdVFTa_txVhIlFFbTCV8tlcn5qSc53oyH6gzEIsPiMlvStL3E-fuf7aM'
    }
];

export default function GroupInfoScreen() {
    const { id } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const renderMember = ({ item }: { item: typeof MEMBERS[0] }) => (
        <View style={[styles.memberItem, { borderBottomColor: theme.divider }]}>
            <Image source={{ uri: item.avatar }} style={styles.memberAvatar} contentFit="cover" transition={200} />
            <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.memberStatus, { color: theme.textSecondary }]}>{item.status}</Text>
            </View>
            <RoleTag role={item.role} isDark={isDark} />
        </View>
    );

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Group Info</Text>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={theme.primary} />
                </TouchableOpacity>
            </BlurView>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={[styles.profileSection, { marginTop: 60 + insets.top }]}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-ocGmyOsg9QWyoZMQSASkdZyZtJnXjdvEJ9MQCyU1baMkUh_ThH_Li1nLwzvu84Va-1cGNuThWZ8Pxge48u1dUFUSgrkPqTaVn_hB9yCZRyAAR4bzl1pQsoG78t3qpe7PzbIGlVLFkAHD3qGce7qfvNOLLPVC9ge-_GxfpjqomjhZJ2Q40IYEoHPhQdNTf74KJND9YcMA9iT1T8g5B3lqYaQ1JcI-yVkVIxoWf7yWsOQHoOCGtZr7OaW9jLXNZ47f1Yjds99FKRyd' }}
                            style={[styles.profileAvatar, { borderColor: isDark ? 'rgba(9, 125, 70, 0.2)' : 'rgba(9, 125, 70, 0.1)' }]}
                            contentFit="cover"
                            transition={200}
                        />
                        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary, borderColor: theme.background }]}>
                            <Ionicons name="pencil" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.groupName, { color: theme.text }]}>Advanced Mathematics</Text>
                    <Text style={[styles.memberCount, { color: theme.primary }]}>128 Members</Text>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: isDark ? theme.surface : theme.surface, borderColor: theme.border }]}>
                        <Text style={styles.sectionTitle}>DESCRIPTION</Text>
                        <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                            A high-level course covering Calculus and Linear Algebra. Join us for weekly problem sets and peer discussions.
                        </Text>
                    </View>
                </View>

                {/* Resources */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: isDark ? theme.surface : theme.surface, borderColor: theme.border, padding: 0, overflow: 'hidden' }]}>
                        <TouchableOpacity style={[styles.resourceItem, { borderBottomColor: theme.divider }]}>
                            <Ionicons name="bookmark" size={24} color={theme.primary} />
                            <Text style={[styles.resourceText, { color: theme.text }]}>Pinned Messages</Text>
                            <Text style={[styles.resourceCount, { color: theme.textTertiary }]}>12</Text>
                            <Ionicons name={textAlign === 'right' ? "chevron-back" : "chevron-forward"} size={20} color={theme.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.resourceItem}>
                            <Ionicons name="images" size={24} color={theme.primary} />
                            <View style={styles.mediaContent}>
                                <Text style={[styles.resourceText, { color: theme.text }]}>Media, Links, and Docs</Text>
                                <View style={styles.mediaPreviews}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={[styles.mediaThumb, { backgroundColor: theme.surfaceVariant }]} />
                                    ))}
                                </View>
                            </View>
                            <Ionicons name={textAlign === 'right' ? "chevron-back" : "chevron-forward"} size={20} color={theme.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Members */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionHeading, { color: theme.text }]}>Members</Text>
                        <TouchableOpacity>
                            <Text style={[styles.addButton, { color: theme.primary }]}>Add Member</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, { backgroundColor: isDark ? theme.surface : theme.surface, borderColor: theme.border, padding: 0 }]}>
                        {MEMBERS.map((member) => (
                            <View key={member.id}>
                                {renderMember({ item: member })}
                            </View>
                        ))}
                        <TouchableOpacity style={styles.viewAllButton}>
                            <Text style={[styles.viewAllText, { color: theme.primary }]}>View All 128 Members</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Leave Group */}
                <View style={styles.section}>
                    <TouchableOpacity style={[styles.leaveButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
                        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                        <Text style={styles.leaveText}>Leave Group</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const RoleTag = ({ role, isDark }: { role: string, isDark: boolean }) => {
    let bg, color, border;

    switch (role) {
        case 'OWNER':
            bg = isDark ? '#097D46' : '#097D46'; // Solid primary
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
    resourceCount: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    mediaContent: {
        flex: 1,
    },
    mediaPreviews: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 8,
    },
    mediaThumb: {
        width: 40,
        height: 40,
        borderRadius: 4,
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
