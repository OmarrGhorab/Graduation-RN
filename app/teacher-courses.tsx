import CourseMarketplaceCard from '@/components/course/CourseMarketplaceCard';
import { Fonts, cskColors } from '@/constants/theme';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiCourse, deleteCourse, searchTeacherCourses, TeacherCourseSearchParams } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortOption = TeacherCourseSearchParams['sort'];
type DeliveryFilter = TeacherCourseSearchParams['delivery_type'];
type StatusFilter = TeacherCourseSearchParams['status'];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Most Enrolled', value: 'enrollment_desc' },
    { label: 'Least Enrolled', value: 'enrollment_asc' },
    { label: 'Top Rated', value: 'rating_desc' },
    { label: 'Lowest Rated', value: 'rating_asc' },
];

const DELIVERY_OPTIONS: { label: string; value: DeliveryFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Online', value: 'ONLINE' },
    { label: 'Offline', value: 'OFFLINE' },
];

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: '' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Draft', value: 'DRAFT' },
];

export default function TeacherCoursesScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);

    // Search / filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [sort, setSort] = useState<SortOption>('newest');
    const [delivery, setDelivery] = useState<DeliveryFilter>('');
    const [status, setStatus] = useState<StatusFilter>('');
    const [showFilters, setShowFilters] = useState(false);

    // Server-side search results
    const [searchResults, setSearchResults] = useState<ApiCourse[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (user && user.role !== 'TEACHER') router.replace('/home');
    }, [user, router]);

    if (!user || user.role !== 'TEACHER') return null;

    // Base data (unfiltered list for stats)
    const { data: coursesData, isLoading, refetch } = useTeacherCourses();
    const allCourses: ApiCourse[] = coursesData?.success ? coursesData.data : [];

    // Fetch from server whenever any filter changes
    const fetchFiltered = useCallback(async () => {
        const hasFilters = debouncedQuery || delivery || status || sort !== 'newest';
        if (!hasFilters) {
            setSearchResults(null);
            return;
        }
        setIsSearching(true);
        try {
            const res = await searchTeacherCourses({
                q: debouncedQuery || undefined,
                delivery_type: delivery || undefined,
                status: status || undefined,
                sort,
            });
            setSearchResults(res.success ? res.data : []);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [debouncedQuery, delivery, status, sort]);

    useEffect(() => { fetchFiltered(); }, [fetchFiltered]);

    const courses = searchResults ?? allCourses;
    const isFiltered = searchResults !== null;

    const handleCoursePress = (courseId: string) => {
        router.push({ pathname: '/teacher-course-details', params: { id: courseId } });
    };

    const handleEditCourse = (course: ApiCourse) => {
        router.push({ pathname: '/create-course', params: { editId: course.id } });
    };

    const handleDeleteCourse = (courseId: string) => {
        Alert.alert(
            t('teacher.deleteCourse'),
            t('teacher.deleteConfirm'),
            [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('common.delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await deleteCourse(courseId);
                            if (response.success) {
                                Alert.alert(t('common.success') || 'Success', t('teacher.deleteSuccess'));
                                refetch();
                                fetchFiltered();
                            } else {
                                Alert.alert(t('common.error') || 'Error', t('teacher.deleteError'));
                            }
                        } catch {
                            Alert.alert(t('common.error') || 'Error', t('common.unexpectedError') || 'An unexpected error occurred');
                        }
                    },
                },
            ]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDebouncedQuery('');
        setSort('newest');
        setDelivery('');
        setStatus('');
        setSearchResults(null);
    };

    const renderHeader = () => (
        <View style={[styles.header, {
            backgroundColor: isDark ? '#183327' : '#FFFFFF',
            paddingTop: insets.top + 12,
        }]}>
            {/* Top row */}
            <View style={styles.headerTopRow}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? cskColors[500] : '#0d1b15'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                    {t('teacher.myCourses')}
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/create-course')}
                    style={[styles.addButton, { backgroundColor: cskColors[500] }]}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: cskColors[500] }]}>{allCourses.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>{t('course.totalCourses') || 'Total Courses'}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.gray[200] }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: cskColors[500] }]}>
                        {coursesData?.summary ? coursesData.summary.totalUniqueStudents : allCourses.reduce((acc, c) => acc + (c.enrollmentCount || c.enrolledStudents || 0), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>{t('common.students') || 'Total Students'}</Text>
                </View>
            </View>

            {/* Search bar */}
            <View style={[styles.searchBar, {
                backgroundColor: isDark ? '#1f3b2e' : '#F0F2F5',
                borderColor: isDark ? '#2a4a38' : 'transparent',
            }]}>
                <Ionicons name="search" size={18} color={theme.gray[400]} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: isDark ? '#ffffff' : '#0d1b15' }]}
                    placeholder={t('common.search') || 'Search courses...'}
                    placeholderTextColor={theme.gray[400]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={theme.gray[400]} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={() => setShowFilters(v => !v)}
                    style={[styles.filterToggle, showFilters && { backgroundColor: cskColors[500] + '20' }]}
                >
                    <Ionicons name="options-outline" size={20} color={showFilters ? cskColors[500] : theme.gray[400]} />
                </TouchableOpacity>
            </View>

            {/* Expandable filters */}
            {showFilters && (
                <View style={styles.filtersPanel}>
                    {/* Sort */}
                    <Text style={[styles.filterLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Sort by</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.chip, sort === opt.value && { backgroundColor: cskColors[500] }]}
                                    onPress={() => setSort(opt.value)}
                                >
                                    <Text style={[styles.chipText, { color: sort === opt.value ? '#fff' : (isDark ? '#cbd5e1' : '#334155') }]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Delivery */}
                    <Text style={[styles.filterLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Delivery</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                        {DELIVERY_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value ?? 'all'}
                                style={[styles.chip, delivery === opt.value && { backgroundColor: cskColors[500] }]}
                                onPress={() => setDelivery(opt.value)}
                            >
                                <Text style={[styles.chipText, { color: delivery === opt.value ? '#fff' : (isDark ? '#cbd5e1' : '#334155') }]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Status */}
                    <Text style={[styles.filterLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Status</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                        {STATUS_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value ?? 'all'}
                                style={[styles.chip, status === opt.value && { backgroundColor: cskColors[500] }]}
                                onPress={() => setStatus(opt.value)}
                            >
                                <Text style={[styles.chipText, { color: status === opt.value ? '#fff' : (isDark ? '#cbd5e1' : '#334155') }]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {isFiltered && (
                        <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                            <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                            <Text style={styles.clearBtnText}>Clear all filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {renderHeader()}

            {isSearching ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={cskColors[500]} />
                </View>
            ) : (
                <FlatList
                    data={courses}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={() => { refetch(); fetchFiltered(); }}
                            tintColor={cskColors[500]}
                            colors={[cskColors[500]]}
                        />
                    }
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
                            <CourseMarketplaceCard
                                course={item}
                                onPress={handleCoursePress}
                                isManagement={true}
                                onEdit={handleEditCourse}
                                onDelete={handleDeleteCourse}
                            />
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        !isLoading ? (
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#183327' : '#FFF' }]}>
                                    <Ionicons name={isFiltered ? 'search-outline' : 'book-outline'} size={64} color={theme.gray[300]} />
                                </View>
                                <Text style={[styles.emptyText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                    {isFiltered ? `No courses match your filters` : t('teacher.noCoursesYet')}
                                </Text>
                                <Text style={[styles.emptySubtext, { color: theme.gray[500] }]}>
                                    {isFiltered ? 'Try adjusting your search or filters' : t('teacher.createFirstCourse')}
                                </Text>
                                {isFiltered ? (
                                    <TouchableOpacity style={[styles.createBtn, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]} onPress={clearFilters}>
                                        <Text style={[styles.createBtnText, { color: cskColors[500] }]}>Clear filters</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.createBtn, { backgroundColor: cskColors[500] }]}
                                        onPress={() => router.push('/create-course')}
                                    >
                                        <Text style={styles.createBtnText}>{t('teacher.createNewCourse')}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={cskColors[500]} />
                            </View>
                        )
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 2 },
    headerTitle: { fontSize: 20, fontFamily: Fonts.bold, flex: 1, textAlign: 'center' },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 22, fontFamily: Fonts.bold },
    statLabel: { fontSize: 12, fontFamily: Fonts.medium, marginTop: 4 },
    statDivider: { width: 1, height: 30 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 15, fontFamily: Fonts.regular, padding: 0 },
    filterToggle: { padding: 4, borderRadius: 8, marginLeft: 6 },
    filtersPanel: { marginTop: 14 },
    filterLabel: { fontSize: 11, fontFamily: Fonts.semiBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    chipText: { fontSize: 13, fontFamily: Fonts.medium },
    clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start' },
    clearBtnText: { fontSize: 12, fontFamily: Fonts.semiBold, color: '#ef4444' },
    listContent: { padding: 16, paddingBottom: 40 },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconContainer: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    emptyText: { fontSize: 20, fontFamily: Fonts.bold, marginBottom: 12, textAlign: 'center' },
    emptySubtext: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
    createBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, elevation: 4 },
    createBtnText: { color: '#FFF', fontFamily: Fonts.bold, fontSize: 16 },
    loadingContainer: { marginTop: 100, alignItems: 'center' },
});
