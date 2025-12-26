import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts, warningColors } from '@/constants/theme';

interface ScheduleCardProps {
    id: string;
    title: string;
    lessons: number;
    rating: number;
    duration: string;
    teacher: string;
    image: string | null;
    color: string;
    isHighlighted?: boolean;
    onPress?: () => void;
}

export default function ScheduleCard({
    title,
    lessons,
    rating,
    duration,
    teacher,
    color,
    isHighlighted,
    onPress,
}: ScheduleCardProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();

    const cardBg = isHighlighted
        ? theme.primary
        : isDark
        ? theme.surface
        : '#FFFFFF';

    const cardBorder = isHighlighted
        ? theme.primary
        : isDark
        ? theme.border
        : theme.gray[200];

    const iconBg = isHighlighted
        ? 'rgba(255,255,255,0.2)'
        : isDark
        ? theme.surfaceVariant
        : color;

    const iconColor = isHighlighted ? '#FFFFFF' : theme.primary;

    const titleColor = isHighlighted ? '#FFFFFF' : isDark ? theme.text : theme.gray[900];
    const lessonsColor = isHighlighted
        ? 'rgba(255, 255, 255, 0.8)'
        : isDark
        ? theme.gray[700]
        : theme.gray[500];
    const ratingColor = isHighlighted ? '#FFFFFF' : isDark ? theme.text : theme.gray[900];
    const durationColor = isHighlighted
        ? 'rgba(255, 255, 255, 0.8)'
        : isDark
        ? theme.gray[600]
        : theme.gray[400];
    const teacherIconColor = isHighlighted
        ? '#FFFFFF'
        : isDark
        ? theme.gray[600]
        : theme.gray[500];
    const teacherTextColor = isHighlighted
        ? 'rgba(255, 255, 255, 0.8)'
        : isDark
        ? theme.gray[700]
        : theme.gray[500];

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[styles.imageContainer, { backgroundColor: iconBg }]}>
                <Ionicons
                    name={title === 'Mathematics' ? 'calculator' : 'flask'}
                    size={40}
                    color={iconColor}
                />
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
                <Text style={[styles.lessons, { color: lessonsColor }]}>{t('home.lessons', { count: lessons })}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={warningColors[500]} />
                    <Text style={[styles.ratingText, { color: ratingColor }]}>{rating}</Text>
                    <Text style={[styles.durationText, { color: durationColor }]}>· {duration}</Text>
                </View>
                <View style={styles.teacherRow}>
                    <Ionicons name="person-outline" size={14} color={teacherIconColor} />
                    <Text style={[styles.teacherText, { color: teacherTextColor }]}>{teacher}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    lessons: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginLeft: 4,
    },
    durationText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginLeft: 4,
    },
    teacherRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teacherText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginLeft: 4,
    },
});
