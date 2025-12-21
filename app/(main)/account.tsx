import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/libs/auth';
import { cskColors, grayColors, Fonts } from '@/constants/theme';

export default function AccountScreen() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const displayName = user?.name || user?.username || 'User';
    const profileImage = user?.profileImg;

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    const handleEditProfile = () => {
        // Navigate to edit profile
        console.log('Edit profile');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
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
                        {/* Edit Icon */}
                        <TouchableOpacity style={styles.editIconButton} onPress={handleEditProfile}>
                            <Ionicons name="camera" size={18} color={grayColors[600]} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {/* Profile */}
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="person-outline" size={22} color={grayColors[600]} />
                        </View>
                        <Text style={styles.menuText}>Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                    </TouchableOpacity>

                    {/* Edit Profile */}
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleEditProfile}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="create-outline" size={22} color={grayColors[600]} />
                        </View>
                        <Text style={styles.menuText}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                    </TouchableOpacity>

                    {/* Dashboard */}
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="grid-outline" size={22} color={grayColors[600]} />
                        </View>
                        <Text style={styles.menuText}>Dashboard</Text>
                        <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                    </TouchableOpacity>

                    {/* Settings */}
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="settings-outline" size={22} color={grayColors[600]} />
                        </View>
                        <Text style={styles.menuText}>Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                    </TouchableOpacity>

                    {/* Help & Support */}
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="help-circle-outline" size={22} color={grayColors[600]} />
                        </View>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={24} color="#FF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
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
        backgroundColor: cskColors[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        fontFamily: Fonts.bold,
        color: cskColors[500],
    },
    editIconButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: grayColors[200],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
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
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: grayColors[900],
        marginLeft: 14,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
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
