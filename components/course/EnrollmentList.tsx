import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { CourseEnrollment } from '@/services/CourseService';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

interface EnrollmentListProps {
    enrollments: CourseEnrollment[];
}

export function EnrollmentList({ enrollments }: EnrollmentListProps) {
    const { theme, isDark } = useTheme();

    const renderItem = ({ item }: { item: CourseEnrollment }) => (
        <View style={[styles.item, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
            <Image
                source={{ uri: item.student.profilePicture || 'https://i.pravatar.cc/300' }}
                style={styles.avatar}
            />
            <View style={styles.info}>
                <Text style={[styles.name, { color: isDark ? theme.text : '#000' }]}>
                    {item.student.firstName} {item.student.lastName}
                </Text>
                <Text style={[styles.email, { color: theme.gray[500] }]}>
                    {item.student.email}
                </Text>
                <Text style={[styles.date, { color: theme.gray[400] }]}>
                    Enrolled: {new Date(item.enrolledAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}15` }]}>
                <Text style={[styles.statusText, { color: theme.primary }]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );

    return (
        <FlatList
            data={enrollments}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
    },
    item: {
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
        marginBottom: 2,
    },
    email: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginBottom: 2,
    },
    date: {
        fontSize: 11,
        fontFamily: Fonts.regular,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'capitalize',
    },
});
