import { AbsenceRequestCard } from '@/components/course/AbsenceRequestCard';
import { Fonts } from '@/constants/theme';
import { useRespondToAbsence, useStudentAbsences, useKidsAbsences } from '@/hooks/useAbsences';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/libs/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AbsenceHistoryScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { profile } = useProfile();
    const user = useAuthStore(state => state.user);
    
    const role = user?.role?.toUpperCase();
    const isTeacher = role === 'TEACHER' || role === 'INSTRUCTOR' || role === 'ADMIN';
    const isParent = role === 'PARENT';
    const canApprove = isTeacher; // Only teachers/admins can approve/reject

    const studentQuery = useStudentAbsences(profile?.id || '', { enabled: !isParent });
    const parentQuery = useKidsAbsences({ enabled: isParent });

    const { data: response, isLoading, error, refetch } = isParent ? parentQuery : studentQuery;
    const requests = response?.data || [];

    const respondMutation = useRespondToAbsence();

    const handleRespond = async (requestId: string, approve: boolean) => {
        try {
            await respondMutation.mutateAsync({ requestId, approve });
            Alert.alert('Success', `Request ${approve ? 'approved' : 'rejected'} successfully`);
            refetch(); // Refresh list
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to respond to request');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !response) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.gray[400]} />
                <Text style={[styles.errorText, { color: theme.gray[600] }]}>
                    Failed to load absence requests
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                    Absence Requests
                </Text>
                <TouchableOpacity onPress={() => router.push('/absence-request')}>
                    <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {requests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color={theme.gray[300]} />
                        <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                            {isParent ? 'No absence history found for your children' : 'No absence requests'}
                        </Text>
                    </View>
                ) : (
                    requests.map((request) => (
                        <AbsenceRequestCard
                            key={request.id}
                            request={request}
                            showActions={canApprove}
                            onRespond={(approve) => handleRespond(request.id, approve)}
                        />
                    ))
                )}
            </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    content: {
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    errorText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    backButton: {
        marginTop: 20,
    },
    backText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
});
