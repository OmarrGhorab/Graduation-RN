import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { CourseAssistant } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AssistantsSectionProps {
    assistants: CourseAssistant[];
    isTeacher: boolean;
    onAddAssistant?: () => void;
    onRemoveAssistant?: (assistantId: string) => void;
}

export function AssistantsSection({ 
    assistants, 
    isTeacher, 
    onAddAssistant, 
    onRemoveAssistant 
}: AssistantsSectionProps) {
    const { theme, isDark } = useTheme();

    if (!isTeacher && (!assistants || assistants.length === 0)) {
        return null;
    }

    const handleRemove = (assistant: CourseAssistant) => {
        Alert.alert(
            'Remove Assistant',
            `Are you sure you want to remove ${assistant.assistantName} as an assistant?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => onRemoveAssistant?.(assistant.assistantId),
                },
            ]
        );
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>
                    Course Assistants
                </Text>
                {isTeacher && (
                    <TouchableOpacity onPress={onAddAssistant}>
                        <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {assistants && assistants.length > 0 ? (
                <View style={styles.assistantsList}>
                    {assistants.map((assistant) => (
                        <View
                            key={assistant.id}
                            style={[
                                styles.assistantCard,
                                {
                                    backgroundColor: isDark ? theme.surface : '#FFFFFF',
                                    borderColor: isDark ? theme.border : theme.gray[100],
                                },
                            ]}
                        >
                            <Image
                                source={{
                                    uri: assistant.assistantProfileImg || 'https://i.pravatar.cc/300',
                                }}
                                style={[styles.assistantAvatar, { borderColor: `${theme.primary}30` }]}
                            />
                            <View style={styles.assistantInfo}>
                                <Text style={[styles.assistantName, { color: isDark ? theme.text : '#000' }]}>
                                    {assistant.assistantName}
                                </Text>
                                <View style={styles.permissionsBadges}>
                                    {assistant.canStartLesson && (
                                        <View style={[styles.permissionBadge, { backgroundColor: `${cskColors[500]}15` }]}>
                                            <Text style={[styles.permissionText, { color: cskColors[500] }]}>
                                                Start
                                            </Text>
                                        </View>
                                    )}
                                    {assistant.canEndLesson && (
                                        <View style={[styles.permissionBadge, { backgroundColor: `${cskColors[500]}15` }]}>
                                            <Text style={[styles.permissionText, { color: cskColors[500] }]}>
                                                End
                                            </Text>
                                        </View>
                                    )}
                                    {assistant.canViewAttendance && (
                                        <View style={[styles.permissionBadge, { backgroundColor: `${cskColors[500]}15` }]}>
                                            <Text style={[styles.permissionText, { color: cskColors[500] }]}>
                                                View
                                            </Text>
                                        </View>
                                    )}
                                    {assistant.canEditAttendance && (
                                        <View style={[styles.permissionBadge, { backgroundColor: `${cskColors[500]}15` }]}>
                                            <Text style={[styles.permissionText, { color: cskColors[500] }]}>
                                                Edit
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            {isTeacher && (
                                <TouchableOpacity
                                    onPress={() => handleRemove(assistant)}
                                    style={styles.removeButton}
                                >
                                    <Ionicons name="close-circle" size={24} color={theme.gray[400]} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            ) : (
                <View style={[styles.emptyState, { backgroundColor: isDark ? theme.surface : '#F6F8F7' }]}>
                    <Ionicons name="people-outline" size={32} color={theme.gray[400]} />
                    <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                        No assistants assigned yet
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    assistantsList: {
        gap: 12,
    },
    assistantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    assistantAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
    },
    assistantInfo: {
        flex: 1,
        marginLeft: 12,
    },
    assistantName: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        marginBottom: 6,
    },
    permissionsBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    permissionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    permissionText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
    },
    removeButton: {
        padding: 4,
    },
    emptyState: {
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 8,
    },
});
