import Avatar from '@/components/common/Avatar';
import { Fonts } from '@/constants/theme';
import { useTeacherSearch } from '@/hooks/useTeachers';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { TeacherProfile } from '@/services/ProfileService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TeachersScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: teachersData, isLoading } = useTeacherSearch(searchQuery);
    const teachers = teachersData?.data || [];

    const handleTeacherPress = (teacherId: string) => {
        // router.push({ pathname: '/teacher-profile', params: { id: teacherId } });
        console.log('Teacher pressed:', teacherId);
    };

    const renderTeacherItem = ({ item, index }: { item: TeacherProfile; index: number }) => (
        <Animated.View 
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={[styles.teacherCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF' }]}
        >
            <TouchableOpacity 
                style={styles.teacherContent}
                onPress={() => handleTeacherPress(item.id)}
            >
                <Avatar 
                    uri={item.profileImg} 
                    name={item.name} 
                    size={60} 
                />
                <View style={styles.teacherInfo}>
                    <Text style={[styles.teacherName, { color: isDark ? theme.text : '#1F2937' }]}>{item.name}</Text>
                    <Text style={[styles.teacherUsername, { color: theme.gray[500] }]}>@{item.username}</Text>
                    {item.bio && (
                        <Text 
                            style={[styles.teacherBio, { color: isDark ? theme.gray[400] : theme.gray[600] }]}
                            numberOfLines={1}
                        >
                            {item.bio}
                        </Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.gray[300]} />
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? theme.surface : '#FFFFFF', paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 48 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#1F2937'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                        {t('teachers.findTeachers') || 'Find Teachers'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.background : '#F3F4F6' }]}>
                    <Ionicons name="search-outline" size={20} color={theme.gray[400]} />
                    <TextInput
                        style={[styles.searchInput, { color: isDark ? theme.text : '#1F2937' }]}
                        placeholder={t('teachers.searchPlaceholder') || 'Search by name or username...'}
                        placeholderTextColor={theme.gray[400]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={theme.gray[400]} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={teachers}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderTeacherItem}
                    ListEmptyComponent={
                        searchQuery.length < 2 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="search" size={64} color={theme.gray[200]} />
                                <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                                    {t('teachers.typeToSearch') || 'Type at least 2 characters to search'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={64} color={theme.gray[200]} />
                                <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                                    {t('teachers.noTeachersFound') || 'No teachers found'}
                                </Text>
                            </View>
                        )
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontFamily: Fonts.regular,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    teacherCard: {
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    teacherContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    teacherInfo: {
        flex: 1,
        marginLeft: 12,
    },
    teacherName: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    teacherUsername: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 2,
    },
    teacherBio: {
        fontSize: 13,
        fontFamily: Fonts.regular,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
