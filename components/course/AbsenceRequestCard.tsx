import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ApiAbsenceRequest } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AbsenceRequestCardProps {
    request: ApiAbsenceRequest;
    onRespond?: (approve: boolean) => void;
    showActions?: boolean;
}

export function AbsenceRequestCard({ request, onRespond, showActions = false }: AbsenceRequestCardProps) {
    const { theme, isDark } = useTheme();

    const getStatusColor = () => {
        switch (request.status) {
            case 'APPROVED': return theme.primary;
            case 'REJECTED': return '#FF4444';
            case 'PENDING': return '#FFA500';
            default: return theme.gray[400];
        }
    };

    const getReasonIcon = () => {
        switch (request.reasonType) {
            case 'MEDICAL': return 'medical';
            case 'EMERGENCY': return 'alert-circle';
            case 'PARENT_EXCUSE': return 'document-text';
            default: return 'document-text';
        }
    };

    const statusColor = getStatusColor();

    return (
        <View style={[styles.card, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons name={getReasonIcon() as any} size={20} color={theme.primary} />
                    <Text style={[styles.reasonType, { color: isDark ? theme.text : '#000' }]}>
                        {request.reasonType}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {request.status}
                    </Text>
                </View>
            </View>

            <Text style={[styles.reasonText, { color: theme.gray[600] }]}>
                {request.reasonText}
            </Text>

            <View style={styles.meta}>
                <Text style={[styles.metaText, { color: theme.gray[400] }]}>
                    Submitted: {new Date(request.createdAt).toLocaleDateString()}
                </Text>
            </View>

            {request.responseNote && (
                <View style={[styles.responseNote, { backgroundColor: `${statusColor}10` }]}>
                    <Text style={[styles.responseLabel, { color: theme.gray[500] }]}>Response:</Text>
                    <Text style={[styles.responseText, { color: theme.gray[700] }]}>
                        {request.responseNote}
                    </Text>
                </View>
            )}

            {showActions && request.status === 'PENDING' && onRespond && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF444415' }]}
                        onPress={() => onRespond(false)}
                    >
                        <Ionicons name="close-circle" size={18} color="#FF4444" />
                        <Text style={[styles.actionText, { color: '#FF4444' }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: `${theme.primary}15` }]}
                        onPress={() => onRespond(true)}
                    >
                        <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                        <Text style={[styles.actionText, { color: theme.primary }]}>Approve</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reasonType: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        textTransform: 'capitalize',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'uppercase',
    },
    reasonText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 20,
        marginBottom: 8,
    },
    meta: {
        marginTop: 4,
    },
    metaText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    responseNote: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
    },
    responseLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    responseText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
});
