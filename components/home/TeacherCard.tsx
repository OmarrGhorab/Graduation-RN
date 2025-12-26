import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';

interface TeacherCardProps {
    id: string;
    name: string;
    subject: string;
    image: string | null;
    onPress?: () => void;
}

export default function TeacherCard({ name, subject, image, onPress }: TeacherCardProps) {
    const { theme, isDark } = useTheme();

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.avatarContainer}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <View
                        style={[
                            styles.placeholder,
                            { backgroundColor: isDark ? theme.surfaceVariant : theme.gray[100] },
                        ]}
                    >
                        <Ionicons
                            name="person"
                            size={24}
                            color={isDark ? theme.gray[500] : theme.gray[400]}
                        />
                    </View>
                )}
            </View>
            <Text
                style={[styles.name, { color: isDark ? theme.text : theme.gray[900] }]}
                numberOfLines={1}
            >
                {name}
            </Text>
            <Text style={[styles.subject, { color: isDark ? theme.gray[600] : theme.gray[500] }]}>
                {subject}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginRight: 16,
        width: 80,
    },
    avatarContainer: {
        marginBottom: 8,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    placeholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
    subject: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        textAlign: 'center',
    },
});
