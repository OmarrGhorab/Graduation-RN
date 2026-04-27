import React, { useState } from 'react';
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
    StatusBar,
    FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    FadeInUp, 
    FadeInDown, 
    FadeIn,
    Layout
} from 'react-native-reanimated';
import { documentDirectory, createDownloadResumable } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useReportHistoryQuery } from '@/hooks/useReports';
import { getHistoryDownloadUrl, HistoryReport } from '@/services/ReportService';
import { Fonts } from '@/constants/theme';
import { getValidAccessToken } from '@/services/AuthService';
import { logger } from '@/libs/logger';

const { width } = Dimensions.get('window');

export default function ReportHistoryScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const { studentId, studentName } = useLocalSearchParams<{ studentId: string; studentName?: string }>();

    const { data: history, isLoading, refetch } = useReportHistoryQuery(studentId || null);
    const [selectedReport, setSelectedReport] = useState<HistoryReport | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    const handleDownload = async (report: HistoryReport) => {
        try {
            setIsDownloading(report.id);

            const token = await getValidAccessToken();
            if (!token) throw new Error('No authentication token found');

            const url = getHistoryDownloadUrl(report.id);
            const filename = `Report_${report.studentName.replace(/\s+/g, '_')}_${report.period}_${new Date(report.createdAt).getTime()}.pdf`;
            const fileUri = `${documentDirectory}${filename}`;

            logger.log('[ReportHistory] Starting download:', { url, fileUri });

            const downloadResumable = createDownloadResumable(
                url,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/pdf',
                    },
                }
            );

            const result = await downloadResumable.downloadAsync();
            logger.log('[ReportHistory] Download complete:', result?.uri);

            if (!result || !result.uri || result.status !== 200) {
                throw new Error(`Download failed with status ${result?.status || 'unknown'}`);
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(result.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Download Progress Report',
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert(t('common.success'), 'Report downloaded successfully');
            }
        } catch (error: any) {
            console.error('[ReportHistory] Download error:', error);
            Alert.alert(t('common.error'), error.message || 'Failed to download report');
        } finally {
            setIsDownloading(null);
        }
    };

    const DetailModal = () => (
        <View style={StyleSheet.absoluteFill}>
            {selectedReport && (
                <Animated.View entering={FadeIn} style={styles.modalOverlay}>
                    <TouchableOpacity 
                        style={StyleSheet.absoluteFill} 
                        onPress={() => setSelectedReport(null)} 
                    />
                    <Animated.View 
                        entering={FadeInDown.springify()} 
                        style={[styles.modalContent, { backgroundColor: theme.background }]}
                    >
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>AI Report Details</Text>
                                <Text style={styles.modalSubtitle}>
                                    {selectedReport.period.toUpperCase()} • {new Date(selectedReport.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            <View style={[styles.summaryTextWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                                <Ionicons name="sparkles" size={20} color={theme.primary} style={{ marginBottom: 10 }} />
                                <Text style={[styles.fullSummary, { color: theme.text }]}>
                                    {selectedReport.summary}
                                </Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity 
                            style={[styles.modalDownloadBtn, { backgroundColor: theme.primary }]}
                            onPress={() => {
                                handleDownload(selectedReport);
                                setSelectedReport(null);
                            }}
                        >
                            <Ionicons name="cloud-download" size={20} color="#fff" />
                            <Text style={styles.modalDownloadText}>Download PDF Version</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    );

    const renderReportItem = ({ item, index }: { item: HistoryReport; index: number }) => (
        <Animated.View 
            entering={FadeInUp.delay(index * 100).duration(600)}
            style={styles.cardWrapper}
        >
            <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.reportCard}>
                <View style={styles.cardHeader}>
                    <View style={[styles.periodBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.periodText, { color: theme.primary }]}>
                            {item.period.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.dateText, { color: theme.text + '80' }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                <Text style={[styles.summaryPreview, { color: theme.text }]} numberOfLines={3}>
                    {item.summary}
                </Text>

                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={[styles.btnAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                        onPress={() => setSelectedReport(item)}
                    >
                        <Ionicons name="eye-outline" size={18} color={theme.text} />
                        <Text style={[styles.btnActionText, { color: theme.text }]}>View Full</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.btnAction, { backgroundColor: theme.primary + '15' }]}
                        onPress={() => handleDownload(item)}
                        disabled={isDownloading === item.id}
                    >
                        {isDownloading === item.id ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <>
                                <Ionicons name="cloud-download-outline" size={18} color={theme.primary} />
                                <Text style={[styles.btnActionText, { color: theme.primary }]}>PDF</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </BlurView>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <LinearGradient
                colors={isDark ? ['#0d1b15', '#050a08'] : ['#E8F5E9', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.title, { color: theme.text }]}>Report History</Text>
                    {studentName && <Text style={styles.subtitle}>{studentName}</Text>}
                </View>
                <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : history?.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="history" size={64} color={theme.text + '20'} />
                    <Text style={[styles.emptyText, { color: theme.text + '50' }]}>No reports found for this student.</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderReportItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <DetailModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 10,
    },
    title: {
        fontSize: 22,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        fontFamily: Fonts.medium,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    reportCard: {
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    periodBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    periodText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
    dateText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    summaryPreview: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: Fonts.medium,
        marginBottom: 15,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
    },
    btnAction: {
        flex: 1,
        flexDirection: 'row',
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    btnActionText: {
        fontSize: 13,
        fontFamily: Fonts.bold,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginTop: 16,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
        zIndex: 1000,
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#64748b',
        fontFamily: Fonts.medium,
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        paddingBottom: 20,
    },
    summaryTextWrapper: {
        padding: 20,
        borderRadius: 20,
    },
    fullSummary: {
        fontSize: 16,
        lineHeight: 26,
        fontFamily: Fonts.medium,
    },
    modalDownloadBtn: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
    },
    modalDownloadText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: Fonts.bold,
    }
});
