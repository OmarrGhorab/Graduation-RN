import React, { useState, useEffect, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useKidsQuery, useChildProgress, useChildAttendance } from '../../hooks/useParentLinks';
import { usePendingParentAbsences } from '@/hooks/useAbsences';
import { ChildUser, ChildProgress, AttendanceRecord } from '@/services/ParentLinkService';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export function ParentMonitoringSuite() {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    
    // Add logic to include Absence Appeals in the main view
    const renderContent = () => (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {renderKidSelector()}
            {renderAbsenceAppeals()}
            {renderStats()}
            {renderCourses()}
            {renderAttendanceHistory()}
        </ScrollView>
    );

    const { data: kidsData, isLoading: isLoadingKids } = useKidsQuery();
    const kids = kidsData?.data || [];
    
    useEffect(() => {
        console.log('[ParentMonitoringSuite] Kids fetched:', kids.length, kids);
    }, [kids]);

    const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

    // Set initial selected kid
    useEffect(() => {
        if (kids.length > 0 && !selectedKidId) {
            setSelectedKidId(kids[0].id);
        }
    }, [kids]);

    const { data: progressData, isLoading: isLoadingProgress } = useChildProgress(selectedKidId);
    const { data: attendanceData, isLoading: isLoadingAttendance } = useChildAttendance(selectedKidId);

    const progress = progressData?.data;
    const courses = progress?.courses || [];
    const attendance = attendanceData?.data || [];

    // Calculate aggregated stats from courses
    const aggregateStats = useMemo(() => {
        if (!courses.length) return null;
        
        const total = courses.length;
        const sumProgress = courses.reduce((acc, c) => acc + c.overallProgress, 0);
        const sumAttendance = courses.reduce((acc, c) => acc + c.attendanceRate, 0);
        
        const sumDetailed = courses.reduce((acc, c) => ({
            present: acc.present + c.presentCount,
            absent: acc.absent + c.absentCount,
            late: acc.late + c.lateCount,
            excused: acc.excused + c.excusedCount,
        }), { present: 0, absent: 0, late: 0, excused: 0 });

        return {
            overallProgress: Math.round(sumProgress / total),
            attendanceRate: Math.round(sumAttendance / total),
            detailedBreakdown: sumDetailed
        };
    }, [courses]);

    const { data: pendingAppeals } = usePendingParentAbsences();
    const appeals = pendingAppeals?.data || [];

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const renderKidSelector = () => (
        <View style={styles.kidSelectorContainer}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Linked Children</Text>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.kidsList}
            >
                {kids.map((kid) => (
                    <TouchableOpacity 
                        key={kid.id} 
                        style={styles.kidItem}
                        onPress={() => setSelectedKidId(kid.id)}
                        activeOpacity={0.8}
                    >
                        <View style={[
                            styles.imageContainer,
                            selectedKidId === kid.id && styles.imageContainerSelected
                        ]}>
                            {kid.profileImg ? (
                                <Image source={{ uri: kid.profileImg }} style={styles.childImage} />
                            ) : (
                                <View style={[styles.childImagePlaceholder, { backgroundColor: isDark ? '#1a332a' : '#f0fdf7' }]}>
                                    <Text style={[styles.initialsText, { color: theme.primary }]}>
                                        {getInitials(kid.name)}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={[
                            styles.kidName, 
                            { color: isDark ? '#f0fdf7' : '#0d1b15' },
                            selectedKidId === kid.id && { fontFamily: Fonts.bold, color: theme.primary }
                        ]} numberOfLines={1}>
                            {kid.name.split(' ')[0]}
                        </Text>
                        {kid.relation && (
                            <Text style={styles.kidRelation}>{kid.relation}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderAbsenceAppeals = () => {
        return (
            <View style={styles.appealsSection}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Absence Appeals</Text>
                    <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => router.push({
                            pathname: '/absence-request',
                            params: { 
                                studentId: selectedKidId,
                                studentName: kids.find(k => k.id === selectedKidId)?.name
                            }
                        })}
                    >
                        <Ionicons name="add-circle" size={18} color={theme.primary} />
                        <Text style={[styles.actionButtonText, { color: theme.primary }]}>Submit</Text>
                    </TouchableOpacity>
                </View>

                {appeals.length > 0 ? (
                    appeals.slice(0, 3).map((appeal: any) => (
                        <TouchableOpacity 
                            key={appeal.id} 
                            style={[styles.appealCard, { backgroundColor: isDark ? '#1a332a' : '#fff' }]}
                            onPress={() => router.push('/absence-history')}
                        >
                            <View style={styles.appealHeader}>
                                <View style={styles.appealKidInfo}>
                                    <View style={[styles.appealDot, { backgroundColor: '#FFA500' }]} />
                                    <Text style={[styles.appealKidName, { color: isDark ? '#fff' : '#0d1b15' }]}>
                                        Child: {appeal.studentName || appeal.student?.name || 'Unknown'}
                                    </Text>
                                </View>
                                <View style={[styles.pendingBadge, { backgroundColor: appeal.status === 'APPROVED' ? 'rgba(18, 237, 135, 0.1)' : appeal.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 165, 0, 0.1)' }]}>
                                    <Text style={[styles.pendingBadgeText, { color: appeal.status === 'APPROVED' ? '#12ED87' : appeal.status === 'REJECTED' ? '#ef4444' : '#FFA500' }]}>
                                        {appeal.status.charAt(0) + appeal.status.slice(1).toLowerCase()}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.appealContentRow}>
                                <Text style={[styles.appealReasonType, { color: theme.primary }]}>
                                    {appeal.reasonType.charAt(0) + appeal.reasonType.slice(1).toLowerCase()}:
                                </Text>
                                <Text style={[styles.appealReason, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
                                    {appeal.reasonText || appeal.reason || 'No details provided'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={[styles.emptyAppeals, { backgroundColor: isDark ? '#1a332a40' : '#f9f9f9' }]}>
                        <Text style={styles.emptyAppealsText}>No pending appeals</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderStats = () => {
        if (isLoadingProgress) return <ActivityIndicator color={theme.primary} style={{ margin: 20 }} />;
        if (!aggregateStats) return null;

        return (
            <Animated.View entering={FadeInUp.duration(500)} style={styles.statsContainer}>
                <View style={styles.mainStatsRow}>
                    <StatCard 
                        title="Overall Progress" 
                        value={`${Math.round(aggregateStats.overallProgress)}%`} 
                        icon="trending-up" 
                        color={theme.primary}
                        isDark={isDark}
                    />
                    <StatCard 
                        title="Attendance Rate" 
                        value={`${Math.round(aggregateStats.attendanceRate)}%`} 
                        icon="calendar-check" 
                        color="#4A90E2"
                        isDark={isDark}
                    />
                </View>

                <View style={[styles.breakdownCard, { backgroundColor: isDark ? '#1a332a' : '#fff', borderColor: isDark ? '#2a4a3c' : '#cfe7dc' }]}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Attendance Breakdown</Text>
                    <View style={styles.breakdownGrid}>
                        <BreakdownItem label="Present" value={aggregateStats.detailedBreakdown.present} color="#12ED87" />
                        <BreakdownItem label="Absent" value={aggregateStats.detailedBreakdown.absent} color="#FF4444" />
                        <BreakdownItem label="Late" value={aggregateStats.detailedBreakdown.late} color="#FFA500" />
                        <BreakdownItem label="Excused" value={aggregateStats.detailedBreakdown.excused} color="#A0AEC0" />
                    </View>
                </View>
            </Animated.View>
        );
    };

    const renderCourses = () => {
        if (!courses.length) return null;

        return (
            <View style={styles.coursesSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Enrolled Courses</Text>
                {courses.map((course, index) => (
                    <Animated.View 
                        key={course.courseId} 
                        entering={FadeInRight.delay(index * 100)}
                        style={[styles.courseCard, { backgroundColor: isDark ? '#1a332a' : '#fff' }]}
                    >
                        <View style={styles.courseHeader}>
                            <View style={styles.courseIcon}>
                                <Ionicons name="book" size={20} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.courseName, { color: isDark ? '#fff' : '#0d1b15' }]}>{course.courseTitle}</Text>
                                <Text style={styles.teacherName}>{course.teacherName ? `Instructor: ${course.teacherName}` : 'No Instructor Assigned'}</Text>
                            </View>
                            <View style={styles.progressBadge}>
                                <Text style={styles.progressText}>{Math.round(course.overallProgress)}%</Text>
                            </View>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, course.overallProgress))}%`, backgroundColor: theme.primary }]} />
                        </View>
                        <View style={styles.courseStats}>
                            <Text style={styles.courseStatsText}>Attendance: {Math.round(course.attendanceRate)}%</Text>
                            <Text style={styles.courseStatsText}>{course.presentCount}/{course.totalLessons} Lessons</Text>
                        </View>
                    </Animated.View>
                ))}
            </View>
        );
    };

    const renderAttendanceHistory = () => {
        return (
            <View style={styles.historySection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Recent Attendance Activity</Text>
                {isLoadingAttendance ? (
                    <ActivityIndicator color={theme.primary} />
                ) : attendance.length === 0 ? (
                    <Text style={styles.emptyText}>No attendance records found.</Text>
                ) : (
                    attendance.slice(0, 10).map((record) => (
                        <View key={record.id} style={[styles.historyItem, { borderBottomColor: isDark ? '#2a4a3c' : '#eee' }]}>
                            <View style={styles.historyLeft}>
                                <View style={styles.historyLessonRow}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(record.status) }]} />
                                    <Text style={[styles.historyLesson, { color: isDark ? '#fff' : '#0d1b15' }]}>
                                        {record.lessonId.substring(0, 8).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.historyTime}>
                                    {(() => {
                                        const d = record.scannedAt || record.createdAt;
                                        if (!d) return 'N/A';
                                        const dateObj = new Date(d);
                                        return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleString();
                                    })()}
                                </Text>
                            </View>
                            <View style={[styles.statusTag, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                                <Text style={[styles.statusTagText, { color: getStatusColor(record.status) }]}>{record.status}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
        );
    };

    return (
        <ScrollView 
            style={styles.container} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 140, paddingBottom: 100 }}
        >
            <View style={styles.monitoringHeader}>
                <Text style={[styles.suiteTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Parent-Student Monitoring Suite</Text>
                <Text style={styles.suiteSubtitle}>Oversee your children's academic performance</Text>
            </View>

            {isLoadingKids ? (
                <ActivityIndicator color={theme.primary} style={{ marginTop: 50 }} />
            ) : (
                <>
                    {renderKidSelector()}
                    {renderAbsenceAppeals()}
                    {selectedKidId && (
                        <View style={styles.kidContent}>
                            {renderStats()}
                            {renderCourses()}
                            {renderAttendanceHistory()}
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
}

function StatCard({ title, value, icon, color, isDark }: any) {
    return (
        <View style={[styles.statCard, { backgroundColor: isDark ? '#1a332a' : '#fff' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#0d1b15' }]}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );
}

function BreakdownItem({ label, value, color }: any) {
    return (
        <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownValue, { color }]}>{value}</Text>
            <Text style={styles.breakdownLabel}>{label}</Text>
        </View>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PRESENT': return '#12ED87';
        case 'ABSENT': return '#FF4444';
        case 'LATE': return '#FFA500';
        case 'EXCUSED': return '#A0AEC0';
        default: return '#A0AEC0';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    monitoringHeader: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    suiteTitle: {
        fontSize: 22,
        fontFamily: Fonts.bold,
    },
    suiteSubtitle: {
        fontSize: 14,
        color: '#88cba8',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    kidSelectorContainer: {
        marginBottom: 24,
    },
    kidsList: {
        paddingHorizontal: 16,
        gap: 16,
    },
    kidItem: {
        alignItems: 'center',
        width: 80,
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 0,
    },
    imageContainerSelected: {
        borderWidth: 2,
        borderColor: '#12ED87', // Using fixed hex for green to be safe
    },
    initialsText: {
        fontSize: 24,
        fontFamily: Fonts.bold,
    },
    childImage: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
    },
    childImagePlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    kidName: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        marginTop: 8,
        textAlign: 'center',
    },
    kidRelation: {
        fontSize: 10,
        fontFamily: Fonts.regular,
        color: '#88cba8',
        textAlign: 'center',
        marginTop: 2,
    },
    appealsSection: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(18, 237, 135, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    actionButtonText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    appealCard: {
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    appealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    appealKidInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    appealDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    appealKidName: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    pendingBadge: {
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pendingBadgeText: {
        fontSize: 10,
        color: '#FFA500',
        fontFamily: Fonts.bold,
    },
    appealContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    appealReasonType: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    appealReason: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        flex: 1,
    },
    emptyAppeals: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    emptyAppealsText: {
        fontSize: 12,
        color: '#888',
        fontFamily: Fonts.medium,
    },
    kidContent: {
        paddingHorizontal: 16,
    },
    statsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    mainStatsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 22,
        fontFamily: Fonts.bold,
    },
    statTitle: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#88cba8',
        marginTop: 4,
    },
    breakdownCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        marginBottom: 20,
    },
    breakdownGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownItem: {
        alignItems: 'center',
    },
    breakdownValue: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    breakdownLabel: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: '#888',
        marginTop: 4,
    },
    coursesSection: {
        marginBottom: 24,
    },
    courseCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 1,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    courseIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(18, 237, 135, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    courseName: {
        fontSize: 15,
        fontFamily: Fonts.bold,
    },
    teacherName: {
        fontSize: 12,
        color: '#88cba8',
    },
    progressBadge: {
        backgroundColor: 'rgba(18, 237, 135, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    progressText: {
        fontSize: 12,
        color: '#12ED87',
        fontFamily: Fonts.bold,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    historySection: {
        marginBottom: 20,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    historyLeft: {
        flex: 1,
    },
    historyLessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    historyLesson: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    historyTime: {
        fontSize: 11,
        color: '#888',
    },
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusTagText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
        fontFamily: Fonts.medium,
    },
    courseStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    courseStatsText: {
        fontSize: 11,
        color: '#888',
        fontFamily: Fonts.medium,
    }
});
