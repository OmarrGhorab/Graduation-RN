import { EnrollmentList } from '@/components/course/EnrollmentList';
import { Fonts } from '@/constants/theme';
import { useCourseEnrollments } from '@/hooks/useEnrollments';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CourseEnrollmentsScreen() {
    const { id: courseId } = useLocalSearchParams();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (user && user.role !== 'TEACHER') {
            router.replace('/home');
        }
    }, [user, router]);

    const { data, isLoading, error } = useCourseEnrollments(courseId as string);

    if (!user || user.role !== 'TEACHER') return null;

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
                    Failed to load enrollments
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
                    Enrollments ({data.data.length})
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <EnrollmentList enrollments={data.data} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
