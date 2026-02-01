import { Fonts, primaryGradient } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock Data matching the design
const MOCK_CONVERSATIONS = [
    {
        id: '1',
        name: 'Dr. Smith',
        role: 'INSTRUCTOR',
        message: 'Did you review the lecture notes from Monday?',
        time: '10:24 AM',
        unread: 2,
        online: true,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDBHf8JcT5Kma9zs_ymjYQ-oR__QQ0qc7rZorkyg8sR3cLJEO_ffqs4r6nYLRtNaRZiXMmHFW2XqK3Q96QP8BuH-zbh334WgHRavspRcMNUYC5f7GhlzXfoDqniIFqV6K3vCWe_W2na61kD7cWHmQzK-y00EyoV0zx_v5FZAOU-rvcHR3scd_c9dTH-Tb_6VqcY4N36jvChqbxVF1f8XwigSbMGYsm6VHUScA4lBNtejQC9UZSiUtxvPsb2dLetmceW_nLDilipIDQ'
    },
    {
        id: '2',
        name: 'Jane Doe',
        role: 'STUDENT',
        message: 'Thanks for the help! I finally get it.',
        time: 'Yesterday',
        unread: 0,
        online: false,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDis80btbCsAXOJ1pRJtEVOJC6uX9zyRX7vQ-U4Ohp2KAYZU7WdHfHRvUU70N5s7-pgRHRM1sx2ZaWSlDOq7VFNYfjjiBH-vRWVHaaZoQ5wRc17zze8v5csTBMwpY4PDm5zmGzeHyVcB46mMuJeSOL76-mYFWe0ar9uOX3BeyzThJv3NGSP2O7dfapU_FVuSRxJlwN68my6IUV2FcvLphsw69cHXquFmlQD-KSq47-Ow1SCoEOg2JVw9NxZrcK1_sxyfeCnM9C4a3lR'
    },
    {
        id: '3',
        name: 'Marcus Lee',
        role: 'TA',
        message: 'The assignment deadline has been extended.',
        time: 'Tue',
        unread: 0,
        online: true,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwfvAsYmmo5RlnEntkh2ZKoGe2AtP5q_IEiprgFUjNtX-a4kesCCij6w82VU4spMZyL8s0rQXpKneWuqMCsBwIeWzIfOu7EJF21ZX4eP1Kic3b0y4SxLrJdp1fS_afDX5ET67P_473dbefhVqxza9owOc1pFgvzE0RlhdnKL82YhskFeDbuE7Jwy4fGRm_Ox26wSfM00QsL2ocBT_fmX3iqvRGtEJbK2SdevmKzCGDIcjHLhBNJgARYaHmqONCKVE9jaPb7Q3bt43E'
    },
    {
        id: '4',
        name: 'Sarah Chen',
        role: 'STUDENT',
        message: 'Are you coming to the study group tonight?',
        time: 'Mon',
        unread: 0,
        online: false,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClnnflolhPCsPBLyWqoE1WTguKuPL9sgjoGF92fKKUwUDIU9nPivwc1zeCpL162CArPO0jp62LI9w7WI_SZvb9WyahTRV84ysdKZwwPI2l-jF2iJEb4KL5Fra9-1zQOuunk88EgezmeOdIFtjl2URgbZnpdn3K2D_exSfa8jiHc2h4HLY9mRzwgDDT9LqczoT0kZbFecBhFRrblOdOZ1vcAqP2S2jj4lLH9qvcnxOYtVk6YHJPVPFi5Dx7rNyGqqhwF2qADjrGMvhf'
    },
    {
        id: '5',
        name: 'Prof. Green',
        role: 'INSTRUCTOR',
        message: 'Excellent work on your research paper proposal.',
        time: 'Oct 24',
        unread: 0,
        online: false,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzwYYZnqneH5qXZ3FXf4PrAl-Dukg6XB_Dt-vY5Ug6co5SLUxoHCPhFkPNGx-Oa4Gg2I2rnJsgjcYARSNbr5k0JSYTpkJRvqzR7SkPLA-TahlYb7DEVwCFgI8i-E1gGo53ltp3feClSevVhAFJJvM5Bb246ZYZ38tATtPJoZtaxfb9DFm95PzFnjrD8exFX_NQAjKwJ2dIuFHYelyFIkMPfOpDJ8hV0TP_hKh9kgBPXxSeXO7WC5pI_-LwArTnqTe_kck290pmHd2L'
    }
];

const FILTERS = ['ALL', 'INSTRUCTORS', 'STUDENTS', 'GROUPS'];

export default function ChatScreen() {
    const { theme, isDark } = useTheme();
    const { t, textAlign } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const renderConversationItem = ({ item }: { item: typeof MOCK_CONVERSATIONS[0] }) => (
        <TouchableOpacity
            style={[styles.itemContainer, { borderBottomColor: theme.divider }]}
            activeOpacity={0.7}
            onPress={() => {
                // Navigate to chat detail
                router.push(`/conversation/${item.id}`);
            }}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: item.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                />
                {item.online && (
                    <View style={[styles.onlineIndicator, { borderColor: theme.background }]} />
                )}
            </View>

            <View style={styles.contentContainer}>
                <View style={[styles.headerRow, { direction: textAlign === 'right' ? 'rtl' : 'ltr' }]}>
                    <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <RoleBadge role={item.role} isDark={isDark} />
                </View>
                <Text
                    style={[styles.message, { color: theme.textSecondary, textAlign }]}
                    numberOfLines={1}
                >
                    {item.message}
                </Text>
            </View>

            <View style={styles.metaContainer}>
                <Text style={[styles.time, { color: theme.primary }]}>{item.time}</Text>
                {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

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
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDri1dSkSplychwQdo55IV_v5l94pfLv5_M6ZrTANBYsXc7qv43UPcj7NTxKLyPpl_e2T4Zilxk6lZYYwcjTGZ049kSzzsWsN6JimKDAPL7UN-ly80FQlXRwgCfC9zd8viS4tVZxCyALCeebmMv_Ii4Gt6D8EyiOXLHarW2QMNXr1-PLRIvLbvaL6BufhMRqcoIZlkbaB3zjOlzuQIEVvVXjEdpn6_aoPF-_QWS9Yge6WqGFetSVUdjuxOkPwIm2XFms5NVu5ETN1y' }}
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
            <FlatList
                data={MOCK_CONVERSATIONS}
                renderItem={renderConversationItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: insets.bottom + 20 }]}
                activeOpacity={0.8}
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
        case 'TEACHER': // Assuming Teacher uses same/similar color
            bg = isDark ? 'rgba(79, 191, 138, 0.2)' : 'rgba(9, 125, 70, 0.1)';
            color = isDark ? '#4FBF8A' : '#097D46';
            break;
        case 'STUDENT':
            bg = isDark ? 'rgba(66, 153, 225, 0.2)' : '#EBF8FF'; // Blue-ish
            color = isDark ? '#63B3ED' : '#3182CE';
            break;
        case 'TA':
        case 'ASSISTANT':
            bg = isDark ? 'rgba(79, 191, 138, 0.2)' : 'rgba(9, 125, 70, 0.1)'; // Using primary for TA as per design
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
});
