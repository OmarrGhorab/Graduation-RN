import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import { cskColors, grayColors, Fonts } from '@/constants/theme';

export default function AccountScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const displayName = user?.name || user?.username || 'User';
    const profileImage = user?.profileImg;

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                    <Ionicons name="person-outline" size={24} color={grayColors[700]} />
                    <Text style={styles.menuText}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                    <Ionicons name="settings-outline" size={24} color={grayColors[700]} />
                    <Text style={styles.menuText}>Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                    <Ionicons name="help-circle-outline" size={24} color={grayColors[700]} />
                    <Text style={styles.menuText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={24} color="#FF4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    avatarContainer: {
        marginBottom: 16,
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
        backgroundColor: cskColors[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontFamily: Fonts.bold,
        color: cskColors[500],
    },
    userName: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        color: grayColors[900],
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    menuContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: grayColors[900],
        marginLeft: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 40,
        paddingVertical: 16,
        marginHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
    },
    logoutText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FF4444',
        marginLeft: 8,
    },
});
