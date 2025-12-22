import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, StatusBar, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '@/libs/auth';
import { cskColors, grayColors, Fonts } from '@/constants/theme';
import { uploadProfileImage } from '@/services/ProfileService';
import { useToast } from '@/components/toast';
import { usePrefetchPreferences } from '@/hooks/usePreferences';

export default function AccountScreen() {
    const { user, logout, updateUser } = useAuthStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const toast = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);
    const { prefetch: prefetchPreferences } = usePrefetchPreferences();

    const displayName = user?.name || user?.username || 'User';
    const profileImage = user?.profileImg;

    // Prefetch preferences when account tab is viewed
    useEffect(() => {
        prefetchPreferences();
    }, []);

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    const handleEditProfile = () => {
        router.push('/edit-profile');
    };

    const handleImagePick = async () => {
        setShowImageOptions(false);
        
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                toast.error('Permission Denied', 'We need camera roll permissions to select a profile image');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await processAndUploadImage(result.assets[0].uri);
            }
        } catch (error: any) {
            console.error('Error picking image:', error);
            toast.error('Error', error.message || 'Failed to pick image');
        }
    };

    const handleTakePhoto = async () => {
        setShowImageOptions(false);
        
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                toast.error('Permission Denied', 'We need camera permissions to take a photo');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await processAndUploadImage(result.assets[0].uri);
            }
        } catch (error: any) {
            console.error('Error taking photo:', error);
            toast.error('Error', error.message || 'Failed to take photo');
        }
    };

    const processAndUploadImage = async (uri: string) => {
        try {
            setIsUploading(true);

            // Resize image to 400x400
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 400, height: 400 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            if (!manipResult.base64) {
                throw new Error('Failed to convert image to base64');
            }

            const base64Image = `data:image/jpeg;base64,${manipResult.base64}`;

            // Upload to server
            const response = await uploadProfileImage(base64Image);

            console.log('[Profile] Upload response:', response);

            // Update user state with the new image URL from server
            if (response.user && response.user.profileImg) {
                updateUser({ profileImg: response.user.profileImg });
                toast.success('Success', 'Profile image updated successfully');
            } else {
                throw new Error('No profile image URL in response');
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Error', error.message || 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {isUploading ? (
                            <View style={styles.avatarPlaceholder}>
                                <ActivityIndicator size="large" color={cskColors[500]} />
                            </View>
                        ) : profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {displayName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {/* Edit Icon */}
                        <TouchableOpacity 
                            style={styles.editIconButton} 
                            onPress={() => setShowImageOptions(true)}
                            disabled={isUploading}
                        >
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
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => router.push('/settings')}>
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

            {/* Image Options Modal */}
            <Modal
                visible={showImageOptions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageOptions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowImageOptions(false)}
                >
                    <View style={styles.imageOptionsContainer}>
                        <View style={styles.imageOptionsContent}>
                            <Text style={styles.imageOptionsTitle}>Change Profile Picture</Text>
                            
                            <TouchableOpacity
                                style={styles.imageOptionButton}
                                onPress={handleTakePhoto}
                            >
                                <Ionicons name="camera-outline" size={24} color={grayColors[700]} />
                                <Text style={styles.imageOptionText}>Take Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.imageOptionButton}
                                onPress={handleImagePick}
                            >
                                <Ionicons name="images-outline" size={24} color={grayColors[700]} />
                                <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.imageOptionButton, styles.cancelButton]}
                                onPress={() => setShowImageOptions(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    imageOptionsContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    imageOptionsContent: {
        padding: 20,
    },
    imageOptionsTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
        marginBottom: 20,
        textAlign: 'center',
    },
    imageOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: grayColors[50],
        marginBottom: 12,
    },
    imageOptionText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: grayColors[700],
        marginLeft: 16,
    },
    cancelButton: {
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FF4444',
        textAlign: 'center',
    },
});
