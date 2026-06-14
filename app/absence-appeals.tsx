import { cskColors, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, RefreshControl,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getTeacherPendingAbsences, getLessonAbsenceRequests,
    respondToAbsenceRequest, ApiAbsenceRequest
} from '@/services/CourseService';

const REASON_LABELS: Record<string, string> = {
    MEDICAL: 'Medical',
    FAMILY_EMERGENCY: 'Family Emergency',
    TECHNICAL_ISSUE: 'Technical Issue',
    PERSONAL: 'Personal',
    OTHER: 'Other',
};

function AppealCard({
    appeal, onApprove, onReject, isDark, theme,
}: {
    appeal: ApiAbsenceRequest;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isDark: boolean;
    theme: any;
}) {
    const lessonTitle = appeal.lessonTitle || appeal.lesson_title || appeal.lesson?.title || 'Lesson';
    const courseTitle = appeal.courseTitle || appeal.course_title || appeal.course?.title || '';
    const submittedAt = new Date(appeal.requestedAt || appeal.createdAt).toLocaleDateString('en-EG', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Africa/Cairo',
    });

    return (
        <View style={[styles.card, {
            backgroundColor: isDark ? '#1a332a' : '#fff',
            borderColor: isDark ? '#2a4a3a' : '#e5e7eb',
        }]}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.lessonTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]} numberOfLines={1}>
                        {lessonTitle}
                    </Text>
                    {courseTitle ? (
                        <Text style={[styles.courseTitle, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
                            {courseTitle}
                        </Text>
                    ) : null}
                </View>
                <View style={[styles.reasonBadge, { backgroundColor: `${cskColors[500]}18` }]}>
                    <Text style={[styles.reasonText, { color: cskColors[500] }]}>
                        {REASON_LABELS[appeal.reasonType] || appeal.reasonType}
                    </Text>
                </View>
            </View>

            {/* Student + date */}
            <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={13} color={theme.gray[400]} />
                <Text style={[styles.metaText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {appeal.studentName || 'Student'}
                </Text>
                <Ionicons name="calendar-outline" size={13} color={theme.gray[400]} style={{ marginLeft: 10 }} />
                <Text style={[styles.metaText, { color: isDark ? '#cbd5e1' : '#475569' }]}>{submittedAt}</Text>
            </View>

            {/* Reason text */}
            {appeal.reasonText ? (
                <View style={[styles.reasonBox, { backgroundColor: isDark ? '#0f1f17' : '#f8fafc' }]}>
                    <Text style={[styles.reasonBoxText, { color: isDark ? '#94a3b8' : '#475569' }]}>
                        {appeal.reasonText}
                    </Text>
                </View>
            ) : null}

            {/* Actions */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.rejectBtn, { borderColor: '#ef4444' }]}
                    onPress={() => onReject(appeal.id)}
                >
                    <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                    <Text style={[styles.rejectBtnText, { color: '#ef4444' }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.approveBtn, { backgroundColor: cskColors[500] }]}
                    onPress={() => onApprove(appeal.id)}
                >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function AbsenceAppealsScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams<{ lessonId?: string; courseId?: string }>();
    const qc = useQueryClient();

    const [responseNote, setResponseNote] = useState('');
    const [pendingAction, setPendingAction] = useState<{ id: string; approve: boolean } | null>(null);

    // If opened from a specific lesson, fetch that lesson's requests; else fetch all pending
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['teacher-absences', params.lessonId],
        queryFn: () => params.lessonId
            ? getLessonAbsenceRequests(params.lessonId)
            : getTeacherPendingAbsences(),
        staleTime: 30_000,
    });

    const appeals: ApiAbsenceRequest[] = data?.data || [];
    const pendingAppeals = params.lessonId ? appeals.filter(a => a.status === 'PENDING') : appeals;

    const { mutate: respond, isPending: isResponding } = useMutation({
        mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note?: string }) =>
            respondToAbsenceRequest(id, { approve, responseNote: note }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['teacher-absences'] });
            refetch();
            setPendingAction(null);
            setResponseNote('');
        },
        onError: (e: any) => {
            Alert.alert('Error', e.message || 'Failed to respond to appeal');
        },
    });

    const handleApprove = (id: string) => {
        setPendingAction({ id, approve: true });
    };

    const handleReject = (id: string) => {
        setPendingAction({ id, approve: false });
    };

    const handleConfirm = () => {
        if (!pendingAction) return;
        respond({ id: pendingAction.id, approve: pendingAction.approve, note: responseNote || undefined });
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7' }]}>
            {/* Header */}
            <View style={[styles.header, {
                backgroundColor: isDark ? '#183327' : '#fff',
                paddingTop: insets.top + 12,
                borderBottomColor: isDark ? '#1f3b2e' : '#f1f5f9',
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? '#f1f5f9' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
                    Absence Appeals
                </Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Confirmation panel */}
            {pendingAction && (
                <View style={[styles.confirmPanel, {
                    backgroundColor: isDark ? '#183327' : '#fff',
                    borderBottomColor: isDark ? '#2a4a3a' : '#e5e7eb',
                }]}>
                    <Text style={[styles.confirmTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
                        {pendingAction.approve ? '✅ Approve' : '❌ Reject'} — Add a note (optional)
                    </Text>
                    <TextInput
                        style={[styles.noteInput, {
                            backgroundColor: isDark ? '#0f1f17' : '#f8fafc',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                            borderColor: isDark ? '#2a4a3a' : '#e2e8f0',
                        }]}
                        placeholder="Leave a note for the student/parent..."
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={responseNote}
                        onChangeText={setResponseNote}
                        multiline
                        numberOfLines={2}
                    />
                    <View style={styles.confirmBtns}>
                        <TouchableOpacity
                            style={[styles.cancelConfirmBtn, { borderColor: isDark ? '#2a4a3a' : '#e2e8f0' }]}
                            onPress={() => { setPendingAction(null); setResponseNote(''); }}
                        >
                            <Text style={[styles.cancelConfirmText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitConfirmBtn, {
                                backgroundColor: pendingAction.approve ? cskColors[500] : '#ef4444',
                            }]}
                            onPress={handleConfirm}
                            disabled={isResponding}
                        >
                            {isResponding
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Text style={styles.submitConfirmText}>
                                    {pendingAction.approve ? 'Approve' : 'Reject'}
                                </Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FlatList
                data={pendingAppeals}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={cskColors[500]} colors={[cskColors[500]]} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-circle-outline" size={56} color={theme.gray[300]} />
                            <Text style={[styles.emptyTitle, { color: isDark ? theme.gray[300] : theme.gray[600] }]}>
                                No pending appeals
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: theme.gray[400] }]}>
                                All absence requests have been reviewed
                            </Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color={cskColors[500]} style={{ marginTop: 60 }} />
                    )
                }
                renderItem={({ item }) => (
                    <AppealCard
                        appeal={item}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        isDark={isDark}
                        theme={theme}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    },
    backBtn: { padding: 4, width: 32 },
    headerTitle: { fontSize: 18, fontFamily: Fonts.bold, flex: 1, textAlign: 'center' },
    confirmPanel: {
        padding: 16, borderBottomWidth: 1,
    },
    confirmTitle: { fontSize: 14, fontFamily: Fonts.semiBold, marginBottom: 10 },
    noteInput: {
        borderRadius: 10, borderWidth: 1, padding: 12,
        fontSize: 14, fontFamily: Fonts.regular, minHeight: 64,
        textAlignVertical: 'top', marginBottom: 12,
    },
    confirmBtns: { flexDirection: 'row', gap: 10 },
    cancelConfirmBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    cancelConfirmText: { fontSize: 14, fontFamily: Fonts.semiBold },
    submitConfirmBtn: { flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    submitConfirmText: { fontSize: 14, fontFamily: Fonts.bold, color: '#fff' },
    list: { padding: 16, paddingBottom: 40 },
    card: {
        borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    lessonTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 2 },
    courseTitle: { fontSize: 12, fontFamily: Fonts.regular },
    reasonBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
    reasonText: { fontSize: 11, fontFamily: Fonts.semiBold },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
    metaText: { fontSize: 12, fontFamily: Fonts.regular },
    reasonBox: { padding: 10, borderRadius: 8, marginBottom: 12 },
    reasonBoxText: { fontSize: 13, fontFamily: Fonts.regular, lineHeight: 18 },
    actionRow: { flexDirection: 'row', gap: 10 },
    rejectBtn: {
        flex: 1, height: 38, borderRadius: 8, borderWidth: 1.5,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    },
    rejectBtnText: { fontSize: 13, fontFamily: Fonts.semiBold },
    approveBtn: {
        flex: 1, height: 38, borderRadius: 8,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    },
    approveBtnText: { fontSize: 13, fontFamily: Fonts.bold, color: '#fff' },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 17, fontFamily: Fonts.semiBold, marginTop: 16, marginBottom: 6 },
    emptySubtitle: { fontSize: 13, fontFamily: Fonts.regular },
});
