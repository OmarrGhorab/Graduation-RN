import CourseMarketplaceCard from '@/components/course/CourseMarketplaceCard';
import { Fonts } from '@/constants/theme';
import { useAllCourses, useRecommendedCourses, useTrendingCourses, useAllSubjects, useCourseAutocomplete, useCourseSearchFeedback } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiCourse, CourseAutocompleteSuggestion, RecommendationCourseItem, Subject } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const FILTERS = ['all', 'math', 'science', 'physics', 'chemistry', 'english', 'cs'];

function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeout = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timeout);
    }, [value, delay]);

    return debounced;
}

export default function CoursesScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [deliveryType, setDeliveryType] = useState<string | undefined>(undefined);
    const [billingType, setBillingType] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState<'ACTIVE' | 'PAUSED' | 'ARCHIVED' | undefined>('ACTIVE');
    const [isPaid, setIsPaid] = useState<boolean | undefined>(undefined);
    const [tempDeliveryType, setTempDeliveryType] = useState<string | undefined>(undefined);
    const [tempBillingType, setTempBillingType] = useState<string | undefined>(undefined);
    const [tempIsPaid, setTempIsPaid] = useState<boolean | undefined>(undefined);
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

    const { data: subjectsData } = useAllSubjects();
    const subjects = useMemo(() => subjectsData?.data || [], [subjectsData]);

    const filterParams = useMemo(() => ({
        search: debouncedSearchQuery,
        subjectName: activeFilter === 'all' ? undefined : activeFilter,
        deliveryType: deliveryType as 'OFFLINE' | 'ONLINE' | undefined,
        billingType: billingType as 'ONE_TIME' | 'MONTHLY' | undefined,
        status,
        isPaid,
        page,
        limit,
    }), [debouncedSearchQuery, activeFilter, deliveryType, billingType, status, isPaid, page, limit]);

    const { data: coursesData, isLoading, isFetching, refetch } = useAllCourses(filterParams);
    const { data: autocompleteData, isFetching: autocompleteLoading } = useCourseAutocomplete(searchQuery, 8);
    const searchFeedback = useCourseSearchFeedback();
    const { data: trendingData, isLoading: trendingLoading, refetch: refetchTrending } = useTrendingCourses();
    const { data: recommendedData, isLoading: recommendedLoading, refetch: refetchRecommended } = useRecommendedCourses();

    const courses = coursesData?.success ? coursesData.data : [];
    const meta = coursesData?.meta;
    const totalPages = useMemo(() => {
        if (!meta) return 0;
        return Math.ceil(meta.total / (meta.limit || 10));
    }, [meta]);
    const skeletonColor = isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';

    const mapRecommendationToCourse = (item: RecommendationCourseItem): ApiCourse => ({
        id: item.courseId,
        title: item.title,
        description: '',
        subjectId: '',
        subjectName: item.subjectName || '',
        teacherId: '',
        teacherName: item.teacher?.name || null,
        teacherProfileImg: item.teacher?.avatar || null,
        courseImage: item.courseImage,
        enrolledStudents: item.enrolledCount,
        deliveryType: 'ONLINE',
        locationName: '',
        geofenceRadiusM: 0,
        totalLessons: 0,
        attendanceWindowMinutes: 0,
        price: item.price,
        currency: item.currency,
        isPaid: item.price > 0,
        billingType: 'ONE_TIME',
        status: 'ACTIVE',
        attendanceWeight: 0,
        createdAt: '',
        updatedAt: '',
    });

    const trendingCourses = useMemo(
        () => (trendingData?.data || []).map(mapRecommendationToCourse),
        [trendingData]
    );

    const recommendedCourses = useMemo(
        () => (recommendedData?.data || []).map(mapRecommendationToCourse),
        [recommendedData]
    );

    const autocompleteSuggestions = useMemo(
        () => autocompleteData?.data || [],
        [autocompleteData]
    );
    const hasActiveSearch = debouncedSearchQuery.trim().length > 0;

    const handleCoursePress = (courseId: string) => {
        const normalizedQuery = searchQuery.trim();
        if (normalizedQuery) {
            searchFeedback.mutate({
                query: normalizedQuery,
                courseId,
                eventType: 'click',
            });
        }
        setShowAutocomplete(false);
        router.push({ pathname: '/course-details', params: { id: courseId } });
    };

    const handleSuggestionPress = (suggestion: CourseAutocompleteSuggestion) => {
        if (suggestion.type === 'course' && suggestion.courseId) {
            setSearchQuery(suggestion.title || searchQuery);
            handleCoursePress(suggestion.courseId);
            return;
        }

        if (suggestion.type === 'subject' && suggestion.subjectName) {
            setSearchQuery(suggestion.subjectName);
            setPage(1);
            setActiveFilter('all');
            setShowAutocomplete(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setPage(1);
        try {
            await Promise.all([
                refetch(),
                refetchTrending(),
                refetchRecommended(),
            ]);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLoadMore = () => {
        // Disabled for numeric pagination
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && meta && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleApply = () => {
        setDeliveryType(tempDeliveryType);
        setBillingType(tempBillingType);
        setIsPaid(tempIsPaid);
        setPage(1);
        setShowFiltersModal(false);
    };

    const handleReset = () => {
        setTempDeliveryType(undefined);
        setTempBillingType(undefined);
        setTempIsPaid(undefined);
    };

    const openFilters = () => {
        setTempDeliveryType(deliveryType);
        setTempBillingType(billingType);
        setTempIsPaid(isPaid);
        setShowFiltersModal(true);
    };

    const resetFilters = () => {
        setDeliveryType(undefined);
        setBillingType(undefined);
        setIsPaid(undefined);
        setTempDeliveryType(undefined);
        setTempBillingType(undefined);
        setTempIsPaid(undefined);
        setPage(1);
    };

    const renderSliderSection = (title: string, icon: keyof typeof Ionicons.glyphMap, data: ApiCourse[], loading: boolean) => {
        if (!loading && data.length === 0) {
            return null;
        }

        return (
            <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                    <View style={styles.sliderTitleRow}>
                        <View style={[styles.sliderIconWrap, { backgroundColor: `${theme.primary}12` }]}>
                            <Ionicons name={icon} size={16} color={theme.primary} />
                        </View>
                        <Text style={[styles.sliderTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                            {title}
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <FlatList
                        data={[0, 1, 2]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.toString()}
                        contentContainerStyle={styles.sliderList}
                        renderItem={() => (
                            <View style={[styles.sliderCardWrap, styles.skeletonCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : '#EEF2F7' }]}>
                                <View style={[styles.skeletonImage, { backgroundColor: skeletonColor }]} />
                                <View style={styles.skeletonBody}>
                                    <View style={[styles.skeletonLineShort, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonLine, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonLineMedium, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonAvatar, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonDivider, { backgroundColor: skeletonColor }]} />
                                    <View style={styles.skeletonFooter}>
                                        <View>
                                            <View style={[styles.skeletonTinyLine, { backgroundColor: skeletonColor }]} />
                                            <View style={[styles.skeletonTinyLineWide, { backgroundColor: skeletonColor }]} />
                                        </View>
                                        <View style={[styles.skeletonPrice, { backgroundColor: skeletonColor }]} />
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                ) : (
                    <FlatList
                        data={data}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.sliderList}
                        renderItem={({ item }) => (
                            <View style={styles.sliderCardWrap}>
                                <CourseMarketplaceCard
                                    course={item}
                                    onPress={handleCoursePress}
                                />
                            </View>
                        )}
                    />
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Header Area */}
            <View style={[styles.header, { backgroundColor: isDark ? theme.surface : '#FFFFFF', paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 48 }]}>
                <View style={styles.headerTopRow}>
                    <Text style={[styles.headerTitle, { color: theme.primary }]}>
                        {t('courses.exploreTitle')}
                    </Text>
                </View>

                {/* Search Bar & Filters */}
                <View style={styles.searchFilterRow}>
                    <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.background : '#F3F4F6' }]}>
                        <Ionicons name="search-outline" size={20} color={theme.gray[400]} />
                        <TextInput
                            style={[styles.searchInput, { color: isDark ? theme.text : '#1F2937' }]}
                            placeholder={t('courses.searchPlaceholder')}
                            placeholderTextColor={theme.gray[400]}
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                setPage(1);
                                setShowAutocomplete(text.trim().length >= 2);
                            }}
                            onFocus={() => setShowAutocomplete(searchQuery.trim().length >= 2)}
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.headerFilterBtn, { 
                            backgroundColor: deliveryType || billingType || isPaid !== undefined ? theme.primary : (isDark ? theme.surface : '#FFF'),
                            borderColor: (deliveryType || billingType || isPaid !== undefined) ? theme.primary : (isDark ? '#374151' : '#E5E7EB'),
                        }]}
                        onPress={openFilters}
                    >
                        <Ionicons name="options-outline" size={20} color={deliveryType || billingType || isPaid !== undefined ? '#FFF' : theme.primary} />
                        {(deliveryType || billingType || isPaid !== undefined) && (
                            <View style={styles.filterBadge} />
                        )}
                    </TouchableOpacity>
                </View>

                {showAutocomplete && searchQuery.trim().length >= 2 && (
                    <View style={[styles.autocompleteContainer, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : '#E5E7EB' }]}>
                        {autocompleteLoading ? (
                            <View style={styles.autocompleteLoadingRow}>
                                <ActivityIndicator size="small" color={theme.primary} />
                            </View>
                        ) : autocompleteSuggestions.length > 0 ? (
                            autocompleteSuggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={`${suggestion.type}-${suggestion.courseId || suggestion.subjectName || index}`}
                                    style={[
                                        styles.autocompleteItem,
                                        index < autocompleteSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? theme.border : '#F3F4F6' }
                                    ]}
                                    onPress={() => handleSuggestionPress(suggestion)}
                                >
                                    <Ionicons
                                        name={suggestion.type === 'course' ? 'school-outline' : 'search-outline'}
                                        size={18}
                                        color={theme.gray[500]}
                                    />
                                    <View style={styles.autocompleteTextWrap}>
                                        <Text style={[styles.autocompletePrimaryText, { color: isDark ? theme.text : '#111827' }]} numberOfLines={1}>
                                            {suggestion.type === 'course' ? suggestion.title : suggestion.subjectName}
                                        </Text>
                                        {suggestion.type === 'course' && !!suggestion.subjectName && (
                                            <Text style={[styles.autocompleteSecondaryText, { color: theme.gray[500] }]} numberOfLines={1}>
                                                {suggestion.subjectName}
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.autocompleteEmptyRow}>
                                <Text style={[styles.autocompleteSecondaryText, { color: theme.gray[500] }]}>
                                    {t('courses.noCoursesFound')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor: activeFilter === 'all' ? theme.primary : (isDark ? theme.background : '#F3F4F6'),
                                borderColor: activeFilter === 'all' ? theme.primary : (isDark ? theme.border : 'transparent'),
                                borderWidth: 1,
                            }
                        ]}
                        onPress={() => {
                            setPage(1);
                            setActiveFilter('all');
                        }}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: activeFilter === 'all' ? '#FFFFFF' : (isDark ? theme.gray[400] : theme.gray[600]) }
                            ]}
                        >
                            {t('courses.all')}
                        </Text>
                    </TouchableOpacity>

                    {subjects.map((subject) => (
                        <TouchableOpacity
                            key={subject.id}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: activeFilter === subject.name ? theme.primary : (isDark ? theme.background : '#F3F4F6'),
                                    borderColor: activeFilter === subject.name ? theme.primary : (isDark ? theme.border : 'transparent'),
                                    borderWidth: 1,
                                }
                            ]}
                            onPress={() => {
                                setPage(1);
                                setActiveFilter(subject.name);
                            }}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: activeFilter === subject.name ? '#FFFFFF' : (isDark ? theme.gray[400] : theme.gray[600]) }
                                ]}
                            >
                                {subject.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Course List */}
            <FlatList
                data={courses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        {!hasActiveSearch && renderSliderSection(
                            t('courses.recommendedForYou'),
                            'sparkles-outline',
                            recommendedCourses,
                            recommendedLoading
                        )}
                        {!hasActiveSearch && renderSliderSection(
                            t('courses.trendingNow'),
                            'flame-outline',
                            trendingCourses,
                            trendingLoading
                        )}
                        
                        {/* Section Title */}
                        <View style={styles.allCoursesTitleRow}>
                            <Text style={[styles.filterOptionsTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                                {hasActiveSearch ? (t('courses.searchResults') || 'Search Results') : t('courses.allCourses')}
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index % limit * 100).duration(500)}>
                        <CourseMarketplaceCard
                            course={item}
                            onPress={handleCoursePress}
                        />
                    </Animated.View>
                )}
                ListFooterComponent={
                    <View style={styles.footerContainer}>
                        {isFetching && !showAutocomplete ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ marginBottom: 20 }} />
                        ) : null}
                        
                        {totalPages >= 1 && (
                            <>
                                <Text style={[styles.paginationInfoText, { color: theme.gray[500], marginBottom: 12 }]}>
                                    {t('courses.showing')} {((page - 1) * limit) + 1} - {Math.min(page * limit, (meta?.total || 0))} {t('courses.of')} {meta?.total || 0} {t('courses.courses')}
                                </Text>
                                <View style={styles.modernPaginationContainer}>
                                    <TouchableOpacity 
                                        disabled={page === 1} 
                                        onPress={() => handlePageChange(page - 1)}
                                        style={[styles.paginationNavBtn, page === 1 && styles.paginationNavBtnDisabled]}
                                    >
                                        <Ionicons name="chevron-back" size={18} color={page === 1 ? '#9CA3AF' : theme.primary} />
                                        <Text style={[styles.paginationNavText, { color: page === 1 ? '#9CA3AF' : theme.primary }]}>{t('courses.prev') || 'Prev'}</Text>
                                    </TouchableOpacity>

                                    <View style={styles.modernPageNumbers}>
                                        {[...Array(totalPages)].map((_, i) => {
                                            const p = i + 1;
                                            if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                                                return (
                                                    <TouchableOpacity 
                                                        key={p} 
                                                        onPress={() => handlePageChange(p)}
                                                        style={[styles.modernPageNumber, page === p && { backgroundColor: theme.primary, elevation: 4, shadowColor: theme.primary, shadowOpacity: 0.3 }]}
                                                >
                                                        <Text style={[styles.modernPageText, page === p && { color: '#FFF' }]}>{p}</Text>
                                                    </TouchableOpacity>
                                                );
                                            }
                                            if (p === 2 || p === totalPages - 1) {
                                                return <Text key={p} style={{ color: theme.gray[400], marginHorizontal: 2 }}>...</Text>;
                                            }
                                            return null;
                                        })}
                                    </View>

                                    <TouchableOpacity 
                                        disabled={page === totalPages} 
                                        onPress={() => handlePageChange(page + 1)}
                                        style={[styles.paginationNavBtn, page === totalPages && styles.paginationNavBtnDisabled]}
                                    >
                                        <Text style={[styles.paginationNavText, { color: page === totalPages ? '#9CA3AF' : theme.primary }]}>{t('courses.next') || 'Next'}</Text>
                                        <Ionicons name="chevron-forward" size={18} color={page === totalPages ? '#9CA3AF' : theme.primary} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search" size={48} color={theme.gray[300]} />
                            <Text style={[styles.emptyText, { color: theme.gray[500] }]}>{t('courses.noCoursesFound')}</Text>
                        </View>
                    ) : null
                }
            />

            {/* Advanced Filters Modal */}
            <Modal
                visible={showFiltersModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFiltersModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDark ? theme.text : '#1F2937' }]}>{t('courses.filters') || 'Filters'}</Text>
                            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                                <Ionicons name="close" size={24} color={isDark ? theme.text : '#1F2937'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Delivery Type */}
                            <Text style={[styles.filterLabel, { color: isDark ? theme.text : '#1F2937' }]}>{t('courses.deliveryType') || 'Delivery Type'}</Text>
                            <View style={styles.filterOptions}>
                                <TouchableOpacity 
                                    onPress={() => setTempDeliveryType(undefined)}
                                    style={[styles.filterOption, !tempDeliveryType && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, !tempDeliveryType && { color: '#FFF' }]}>{t('courses.all')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setTempDeliveryType('ONLINE')}
                                    style={[styles.filterOption, tempDeliveryType === 'ONLINE' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, tempDeliveryType === 'ONLINE' && { color: '#FFF' }]}>{t('courses.online')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setTempDeliveryType('OFFLINE')}
                                    style={[styles.filterOption, tempDeliveryType === 'OFFLINE' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, tempDeliveryType === 'OFFLINE' && { color: '#FFF' }]}>{t('courses.offline')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Billing Type */}
                            <Text style={[styles.filterLabel, { color: isDark ? theme.text : '#1F2937' }]}>{t('courses.billingType') || 'Billing Type'}</Text>
                            <View style={styles.filterOptions}>
                                <TouchableOpacity 
                                    onPress={() => setTempBillingType(undefined)}
                                    style={[styles.filterOption, !tempBillingType && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, !tempBillingType && { color: '#FFF' }]}>{t('courses.all')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setTempBillingType('ONE_TIME')}
                                    style={[styles.filterOption, tempBillingType === 'ONE_TIME' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, tempBillingType === 'ONE_TIME' && { color: '#FFF' }]}>{t('courses.oneTime')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setTempBillingType('MONTHLY')}
                                    style={[styles.filterOption, tempBillingType === 'MONTHLY' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, tempBillingType === 'MONTHLY' && { color: '#FFF' }]}>{t('courses.monthly')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Pricing */}
                            <Text style={[styles.filterLabel, { color: isDark ? theme.text : '#1F2937' }]}>{t('courses.pricing') || 'Pricing'}</Text>
                            <View style={styles.filterOptions}>
                                <TouchableOpacity 
                                    onPress={() => setTempIsPaid(undefined)}
                                    style={[styles.filterOption, tempIsPaid === undefined && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, tempIsPaid === undefined && { color: '#FFF' }]}>{t('courses.all')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setTempIsPaid(true)}
                                    style={[styles.filterOption, tempIsPaid === true && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, tempIsPaid === true && { color: '#FFF' }]}>{t('courses.paid')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={() => setTempIsPaid(false)}
                                    style={[styles.filterOption, tempIsPaid === false && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                >
                                    <Text style={[styles.filterOptionText, tempIsPaid === false && { color: '#FFF' }]}>{t('courses.free_modal')}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.resetBtn}
                                onPress={handleReset}
                            >
                                <Text style={[styles.resetText, { color: theme.gray[600] }]}>{t('courses.reset')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                                onPress={handleApply}
                            >
                                <Text style={styles.applyText}>{t('courses.apply')}</Text>
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
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        paddingHorizontal: 20,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 20,
        marginBottom: 16,
    },
    teachersSearchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    teachersSearchBtnText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
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
    filtersContainer: {
        paddingHorizontal: 20,
        paddingRight: 8,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    filterText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listHeader: {
        gap: 8,
        marginBottom: 8,
    },
    sliderSection: {
        marginBottom: 12,
    },
    sliderHeader: {
        marginBottom: 12,
    },
    sliderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sliderIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sliderTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    sliderList: {
        paddingRight: 4,
    },
    sliderCardWrap: {
        width: 280,
        marginRight: 14,
    },
    sliderLoading: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skeletonCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    skeletonImage: {
        height: 140,
        width: '100%',
    },
    skeletonBody: {
        padding: 16,
    },
    skeletonLineShort: {
        width: 84,
        height: 10,
        borderRadius: 5,
        marginBottom: 12,
    },
    skeletonLine: {
        width: '92%',
        height: 16,
        borderRadius: 8,
        marginBottom: 10,
    },
    skeletonLineMedium: {
        width: '68%',
        height: 14,
        borderRadius: 7,
        marginBottom: 16,
    },
    skeletonAvatar: {
        width: 110,
        height: 24,
        borderRadius: 12,
        marginBottom: 16,
    },
    skeletonDivider: {
        width: '100%',
        height: 1,
        marginBottom: 14,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    skeletonTinyLine: {
        width: 90,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    skeletonTinyLineWide: {
        width: 110,
        height: 12,
        borderRadius: 6,
    },
    skeletonPrice: {
        width: 64,
        height: 18,
        borderRadius: 9,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: 16,
    },
    filterOptionsTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    searchFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        gap: 12,
        marginTop: 16,
        marginBottom: 8,
        zIndex: 20,
    },
    autocompleteContainer: {
        marginHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 8,
        zIndex: 19,
    },
    autocompleteLoadingRow: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    autocompleteEmptyRow: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    autocompleteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    autocompleteTextWrap: {
        flex: 1,
    },
    autocompletePrimaryText: {
        fontFamily: Fonts.medium,
        fontSize: 14,
    },
    autocompleteSecondaryText: {
        fontFamily: Fonts.regular,
        fontSize: 12,
        marginTop: 2,
    },
    headerFilterBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    filterBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF4B55',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    allCoursesTitleRow: {
        marginTop: 24,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    advancedFilterBtnModern: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    advancedFilterBtnText: {
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    footerContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    paginationInfoText: {
        fontFamily: Fonts.medium,
        fontSize: 13,
    },
    modernPaginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 8,
    },
    paginationNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 4,
        elevation: 1,
    },
    paginationNavBtnDisabled: {
        backgroundColor: '#F9FAFB',
        borderColor: '#F3F4F6',
        elevation: 0,
    },
    paginationNavText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    modernPageNumbers: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modernPageNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    },
    modernPageText: {
        fontFamily: Fonts.bold,
        fontSize: 15,
        color: '#4B5563',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    modalBody: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        marginBottom: 12,
        marginTop: 16,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    filterOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterOptionText: {
        fontFamily: Fonts.medium,
        fontSize: 14,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    resetBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    applyBtn: {
        flex: 2,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetText: {
        fontFamily: Fonts.bold,
        fontSize: 16,
    },
    applyText: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: '#FFF',
    },
});
