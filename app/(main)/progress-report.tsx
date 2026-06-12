import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
    Dimensions,
    Platform,
    StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeIn,
    Layout,
    SlideInRight
} from 'react-native-reanimated';
import { documentDirectory, createDownloadResumable } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Image } from 'expo-image';

import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useTriggerReportMutation, useReportSummaryQuery } from '@/hooks/useReports';
import { getReportDownloadUrl } from '@/services/ReportService';
import { useKidsQuery } from '@/hooks/useParentLinks';
import { Fonts } from '@/constants/theme';
import { getValidAccessToken } from '@/services/AuthService';
import { logger } from '@/libs/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProgressReportScreen() {
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ studentId: string; period?: string }>();

    const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>(
        (params.period as 'weekly' | 'monthly') || 'weekly'
    );
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const { data: kidsData, isLoading: isLoadingKids } = useKidsQuery();
    const kids = kidsData?.data || [];
    
    const [selectedKidId, setSelectedKidId] = useState<string | null>(params.studentId || null);

    // Update selectedKidId if params change or if first kid is available and nothing selected
    useEffect(() => {
        if (params.studentId) {
            setSelectedKidId(params.studentId);
        } else if (kids.length > 0 && !selectedKidId) {
            setSelectedKidId(kids[0].id);
        }
    }, [params.studentId, kids]);

    const selectedKid = useMemo(() => kids.find(k => k.id === selectedKidId), [kids, selectedKidId]);
    const triggerMutation = useTriggerReportMutation();
    const { data: summaryData, isLoading: isLoadingSummary, refetch: refetchSummary } = useReportSummaryQuery(selectedKidId, selectedPeriod);

    const handleGenerate = () => {
        if (!selectedKidId) {
            Alert.alert(t('common.error'), 'No student selected');
            return;
        }

        triggerMutation.mutate({
            studentId: selectedKidId,
            period: selectedPeriod,
            language: locale
        });
    };

    const handleDownload = async () => {
        if (!selectedKidId) return;

        try {
            setIsDownloading(true);
            setDownloadProgress(0);

            const token = await getValidAccessToken();
            if (!token) throw new Error('No authentication token found');

            const url = getReportDownloadUrl(selectedKidId, selectedPeriod);
            const filename = `Report_${selectedKid?.name.replace(/\s+/g, '_') || 'Student'}_${selectedPeriod}_${new Date().getTime()}.pdf`;
            const fileUri = `${documentDirectory}${filename}`;

            logger.log('[ProgressReport] Starting download:', { url, fileUri });

            const downloadResumable = createDownloadResumable(
                url,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/pdf',
                    },
                },
                (progress) => {
                    if (progress.totalBytesExpectedToWrite > 0) {
                        const frac = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
                        setDownloadProgress(frac);
                    }
                }
            );

            const result = await downloadResumable.downloadAsync();
            logger.log('[ProgressReport] Download complete:', result?.uri);

            if (!result || !result.uri || result.status !== 200) {
                throw new Error(`Download failed with status ${result?.status || 'unknown'}`);
            }
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(result.uri, {
                        mimeType: 'application/pdf',
                        dialogTitle: t('reports.downloadTitle') || 'Download Progress Report',
                        UTI: 'com.adobe.pdf'
                    });
                } else {
                    Alert.alert(t('common.success'), t('reports.downloadSuccess') || 'Report downloaded successfully');
                }
        } catch (error: any) {
            console.error('[ProgressReport] Download error:', error);
            Alert.alert(t('common.error'), error.message || 'Failed to download report');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    if (isLoadingKids) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <LinearGradient
                colors={isDark ? ['#0d1b15', '#050a08'] : ['#E8F5E9', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            {/* Custom Header */}
            <View style={[styles.topNav, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: theme.text }]}>
                    {t('reports.title') || 'AI Progress Report'}
                </Text>
                <TouchableOpacity 
                    onPress={() => router.push({
                        pathname: '/report-history' as any,
                        params: { 
                            studentId: selectedKidId, 
                            studentName: selectedKid?.name 
                        }
                    })} 
                    style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                >
                    <MaterialCommunityIcons name="history" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Child Selection Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        {t('reports.selectChild') || 'Select Child'}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        {kids.length} {kids.length === 1 ? 'child' : 'children'} linked
                    </Text>
                </View>

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.kidsScroll}
                    decelerationRate="fast"
                >
                    {kids.map((kid, index) => (
                        <Animated.View 
                            key={kid.id}
                            entering={FadeInUp.delay(index * 100).duration(500)}
                            layout={Layout.springify()}
                        >
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                style={[
                                    styles.kidCard,
                                    { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fff' },
                                    selectedKidId === kid.id && [styles.selectedKidCard, { borderColor: theme.primary }]
                                ]}
                                onPress={() => setSelectedKidId(kid.id)}
                            >
                                <View style={styles.avatarContainer}>
                                    <Image
                                        source={kid.profileImg ? { uri: kid.profileImg } : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(kid.name)}&background=random` }}
                                        style={styles.kidAvatar}
                                    />
                                    {selectedKidId === kid.id && (
                                        <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <Text 
                                    numberOfLines={1} 
                                    style={[
                                        styles.kidName, 
                                        { color: theme.text },
                                        selectedKidId === kid.id && { fontFamily: Fonts.bold, color: theme.primary }
                                    ]}
                                >
                                    {kid.name.split(' ')[0]}
                                </Text>
                                <Text style={styles.kidRelation}>{kid.relation || 'Student'}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>

                {/* Main Action Card */}
                <Animated.View 
                    entering={FadeInDown.delay(300).duration(800)}
                    style={styles.mainCardWrapper}
                >
                    <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.mainCard}>
                        <View style={styles.aiHeader}>
                            <View style={[styles.robotIcon, { backgroundColor: theme.primary + '15' }]}>
                                <MaterialCommunityIcons name="robot-outline" size={32} color={theme.primary} />
                            </View>
                            <View style={styles.aiHeaderText}>
                                <Text style={[styles.aiTitle, { color: theme.text }]}>
                                    {t('reports.aiAnalysis') || 'AI Summary'}
                                </Text>
                                <Text style={styles.aiTagline}>Pathify-AI</Text>
                            </View>
                        </View>

                        <Text style={styles.cardDesc}>
                            {t('reports.description') || 'Our AI generates a comprehensive summary of attendance, performance, and behavioral insights for your child.'}
                        </Text>

                        {/* AI Summary Content */}
                        {isLoadingSummary ? (
                            <View style={styles.summaryLoading}>
                                <ActivityIndicator size="small" color={theme.primary} />
                                <Text style={[styles.loadingText, { color: theme.text + '80' }]}>Loading latest insights...</Text>
                            </View>
                        ) : summaryData?.summary ? (
                            <Animated.View entering={FadeIn.duration(600)} style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.03)' }]}>
                                <View style={styles.summaryHeader}>
                                    <Ionicons name="sparkles" size={16} color={theme.primary} />
                                    <Text style={[styles.summaryTitle, { color: theme.primary }]}>Latest Insights</Text>
                                </View>
                                <Text style={[styles.summaryText, { color: theme.text }]}>
                                    {summaryData.summary}
                                </Text>
                                <Text style={styles.generatedAt}>
                                    Generated on {new Date(summaryData.generatedAt).toLocaleDateString()}
                                </Text>
                            </Animated.View>
                        ) : null}

                        {/* Period Selection */}
                        <View style={styles.periodBox}>
                            <Text style={[styles.label, { color: theme.text + '80' }]}>
                                {t('reports.selectPeriod') || 'Report Period'}
                            </Text>
                            <View style={[styles.periodToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                <TouchableOpacity 
                                    style={[styles.periodBtn, selectedPeriod === 'weekly' && [styles.activePeriodBtn, { backgroundColor: theme.primary }]]}
                                    onPress={() => setSelectedPeriod('weekly')}
                                >
                                    <Text style={[styles.periodBtnText, { color: selectedPeriod === 'weekly' ? '#fff' : theme.text + '60' }]}>
                                        {t('reports.weekly') || 'Weekly'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.periodBtn, selectedPeriod === 'monthly' && [styles.activePeriodBtn, { backgroundColor: theme.primary }]]}
                                    onPress={() => setSelectedPeriod('monthly')}
                                >
                                    <Text style={[styles.periodBtnText, { color: selectedPeriod === 'monthly' ? '#fff' : theme.text + '60' }]}>
                                        {t('reports.monthly') || 'Monthly'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionStack}>
                            <TouchableOpacity 
                                style={[styles.btnPrimary, { backgroundColor: theme.primary }]}
                                onPress={handleGenerate}
                                disabled={triggerMutation.isPending}
                            >
                                {triggerMutation.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <FontAwesome5 name="magic" size={16} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.btnTextPrimary}>{t('reports.generate') || 'Generate Report'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.btnSecondary, { borderColor: theme.primary + '30' }]}
                                onPress={handleDownload}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <View style={styles.downloadStatus}>
                                        <ActivityIndicator size="small" color={theme.primary} />
                                        <Text style={[styles.btnTextSecondary, { color: theme.primary, marginLeft: 10 }]}>
                                            {Math.round(downloadProgress * 100)}%
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <Ionicons name="cloud-download-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                                        <Text style={[styles.btnTextSecondary, { color: theme.primary }]}>
                                            {t('reports.download') || 'Download PDF'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Footer Tip */}
                <Animated.View entering={FadeIn.delay(1000)} style={styles.footerTip}>
                    <Ionicons name="bulb" size={18} color="#FFB020" />
                    <Text style={styles.tipText}>
                        {t('reports.infoNote') || 'Generation takes 1-2 minutes. We\'ll notify you when ready.'}
                    </Text>
                </Animated.View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        zIndex: 10,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    kidsScroll: {
        paddingHorizontal: 24,
        paddingBottom: 10,
        gap: 15,
    },
    kidCard: {
        width: 100,
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    selectedKidCard: {
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    kidAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f1f5f9',
    },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    kidName: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
    kidRelation: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 1,
    },
    mainCardWrapper: {
        paddingHorizontal: 24,
        marginTop: 15,
    },
    mainCard: {
        borderRadius: 32,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    robotIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiHeaderText: {
        marginLeft: 15,
    },
    aiTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    aiTagline: {
        fontSize: 12,
        color: '#10B981',
        fontFamily: Fonts.medium,
        marginTop: 1,
    },
    cardDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 22,
        marginBottom: 25,
    },
    periodBox: {
        marginBottom: 30,
    },
    label: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        marginBottom: 12,
    },
    periodToggle: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 14,
    },
    periodBtn: {
        flex: 1,
        height: 40,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activePeriodBtn: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    periodBtnText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    actionStack: {
        gap: 12,
    },
    btnPrimary: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    btnTextPrimary: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    btnSecondary: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    btnTextSecondary: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    downloadStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerTip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        paddingHorizontal: 40,
        gap: 8,
    },
    tipText: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 18,
    },
    summaryLoading: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    loadingText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    summaryBox: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    summaryTitle: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 24,
        fontFamily: Fonts.medium,
    },
    generatedAt: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 15,
        textAlign: 'right',
        fontStyle: 'italic',
    },
});
