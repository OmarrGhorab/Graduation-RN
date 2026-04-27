import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TeacherCardProps {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    averageRating: number;
    totalRatings: number;
    totalCourses: number;
}

export function TeacherCard({ id, firstName, lastName, profilePicture, averageRating, totalRatings, totalCourses }: TeacherCardProps) {
    const { theme, isDark } = useTheme();
    const router = useRouter();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}
            onPress={() => router.push(`/teacher-profile/${id}`)}
        >
            <Image
                source={{ uri: profilePicture || 'https://i.pravatar.cc/300' }}
                style={styles.avatar}
            />
            <View style={styles.info}>
                <Text style={[styles.name, { color: isDark ? theme.text : '#000' }]}>
                    {firstName} {lastName}
                </Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Text style={[styles.rating, { color: theme.gray[600] }]}>
                        {averageRating.toFixed(1)}
                    </Text>
                    <Text style={[styles.ratingCount, { color: theme.gray[400] }]}>
                        ({totalRatings})
                    </Text>
                </View>
                <Text style={[styles.courses, { color: theme.gray[500] }]}>
                    {totalCourses} {totalCourses === 1 ? 'course' : 'courses'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.gray[400]} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    rating: {
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    ratingCount: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    courses: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
});
