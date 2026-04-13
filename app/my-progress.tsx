import { ProgressCard } from '@/components/course/ProgressCard';
import { Fonts } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useStudentProgress } from '@/hooks/useProgress';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyProgressScreen() {
    const { courseId } = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { profile } = useProfile();
    const { data, isLoading, error } = useStudentProgress(courseId as string, profile?.id || '');

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.gray[400]} />
                <Text style={[styles.errorText, { color: theme.gray[600] }]}>
                    Failed to load progress
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backText, { color: theme.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const progress = data.data;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                    My Progress
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <ProgressCard
                    attendanceRate={progress.attendanceRate}
                    completionRate={progress.completionRate}
                    status={progress.status}
                    totalLessons={progress.totalLessons}
                    attendedLessons={progress.attendedLessons}
                />

                <View style={[styles.infoCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
                    <Text style={[styles.infoTitle, { color: isDark ? theme.text : '#000' }]}>
                        Last Updated
                    </Text>
                    <Text style={[styles.infoText, { color: theme.gray[600] }]}>
                        {new Date(progress.lastUpdated).toLocaleString()}
                    </Text>
                </View>
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
    infoCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
    },
});
