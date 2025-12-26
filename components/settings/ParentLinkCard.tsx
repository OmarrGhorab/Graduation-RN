import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ParentLinkCardProps {
    name: string;
    username: string;
    profileImg?: string;
    isPending?: boolean;
    pendingTime?: string;
    isProcessing?: boolean;
    showUnlink?: boolean;
    showActions?: boolean;
    onUnlink?: () => void;
    onAccept?: () => void;
    onDecline?: () => void;
}

export function ParentLinkCard({
    name,
    username,
    profileImg,
    isPending,
    pendingTime,
    isProcessing,
    showUnlink,
    showActions,
    onUnlink,
    onAccept,
    onDecline,
}: ParentLinkCardProps) {
    const { theme, isDark } = useTheme();

    const bgColor = isPending 
        ? (isDark ? '#3D2A11' : '#FEF3C7')
        : theme.surface;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            {profileImg ? (
                <Image source={{ uri: profileImg }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.csk[100] }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                        {name?.charAt(0) || '?'}
                    </Text>
                </View>
            )}
            <View style={styles.info}>
                <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
                <Text style={[styles.username, { color: theme.gray[500] }]}>@{username}</Text>
                {pendingTime && (
                    <Text style={[styles.time, { color: theme.gray[400] }]}>{pendingTime}</Text>
                )}
            </View>
            
            {showUnlink && (
                <TouchableOpacity
                    style={[styles.unlinkButton, { backgroundColor: isDark ? theme.error[50] : '#FEE2E2' }]}
                    onPress={onUnlink}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator size="small" color={theme.error[500]} />
                    ) : (
                        <Ionicons name="unlink-outline" size={20} color={theme.error[500]} />
                    )}
                </TouchableOpacity>
            )}

            {showActions && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.acceptButton, { backgroundColor: theme.primary }]}
                        onPress={onAccept}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.declineButton, { backgroundColor: isDark ? theme.error[50] : '#FEE2E2' }]}
                        onPress={onDecline}
                        disabled={isProcessing}
                    >
                        <Ionicons name="close" size={18} color={theme.error[500]} />
                    </TouchableOpacity>
                </View>
            )}

            {isPending && !showActions && (
                <View style={[styles.pendingBadge, { 
                    backgroundColor: isDark ? '#3D2A11' : '#FEF3C7',
                    borderColor: '#F59E0B' 
                }]}>
                    <Text style={[styles.pendingText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                        Pending
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    username: {
        fontSize: 13,
        fontFamily: Fonts.regular,
    },
    time: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    unlinkButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    pendingText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
});
