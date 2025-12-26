import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ProfileHeaderProps {
    displayName: string;
    email?: string;
    profileImage?: string;
    isUploading: boolean;
    onEditPress: () => void;
}

export function ProfileHeader({ 
    displayName, 
    email, 
    profileImage, 
    isUploading, 
    onEditPress 
}: ProfileHeaderProps) {
    const { theme, isDark } = useTheme();

    return (
        <View style={[styles.container, { borderBottomColor: theme.border }]}>
            <View style={styles.avatarContainer}>
                {isUploading ? (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.csk[100] }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.csk[100] }]}>
                        <Text style={[styles.avatarText, { color: theme.primary }]}>
                            {displayName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                <TouchableOpacity 
                    style={[
                        styles.editIconButton, 
                        { 
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                        }
                    ]} 
                    onPress={onEditPress}
                    disabled={isUploading}
                >
                    <Ionicons name="camera" size={18} color={theme.gray[600]} />
                </TouchableOpacity>
            </View>
            <Text style={[styles.userName, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.userEmail, { color: theme.gray[500] }]}>{email}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 24,
        borderBottomWidth: 1,
    },
    avatarContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontFamily: Fonts.bold,
    },
    editIconButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userName: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
});
