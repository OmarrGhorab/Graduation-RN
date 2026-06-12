import { TeacherCard } from '@/components/course/TeacherCard';
import { Fonts } from '@/constants/theme';
import { useTopRatedTeachers } from '@/hooks/useTeachers';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeachersScreen() {
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { data, isLoading, error } = useTopRatedTeachers(20, 4.0);

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
                <Text style={[styles.errorText, { color: theme.gray[600] }]}>
                    Failed to load teachers
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                    Top Rated Teachers
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {data.data.map((teacher) => (
                    <TeacherCard
                        key={teacher.id}
                        id={teacher.id}
                        firstName={teacher.firstName}
                        lastName={teacher.lastName}
                        profilePicture={teacher.profilePicture}
                        averageRating={teacher.averageRating}
                        totalRatings={teacher.totalRatings}
                        totalCourses={teacher.totalCourses}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts.bold,
    },
    content: {
        padding: 16,
    },
    errorText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        textAlign: 'center',
    },
});
