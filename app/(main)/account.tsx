import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '@/libs/auth';
import { uploadProfileImage } from '@/services/ProfileService';
import { logout } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { usePrefetchPreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import { 
    ProfileHeader, 
    MenuItem, 
    LogoutButton, 
    ImageOptionsModal 
} from '@/components/account';

export default function AccountScreen() {
    const { user, updateUser } = useAuthStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const toast = useToast();
    const { theme, isDark } = useTheme();
    const [isUploading, setIsUploading] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);
    const { prefetch: prefetchPreferences } = usePrefetchPreferences();

    const displayName = user?.name || user?.username || 'User';
    const profileImage = user?.profileImg;

    useEffect(() => {
        prefetchPreferences();
    }, []);

    const handleLogout = async () => {
        router.replace('/login');
        try {
            await logout();
        } catch (error) {
            console.error('Logout cleanup error:', error);
        }
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

            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 400, height: 400 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            if (!manipResult.base64) {
                throw new Error('Failed to convert image to base64');
            }

            const base64Image = `data:image/jpeg;base64,${manipResult.base64}`;
            const response = await uploadProfileImage(base64Image);

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
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                <ProfileHeader
                    displayName={displayName}
                    email={user?.email ?? undefined}
                    profileImage={profileImage ?? undefined}
                    isUploading={isUploading}
                    onEditPress={() => setShowImageOptions(true)}
                />

                <View style={styles.menuContainer}>
                    <MenuItem icon="person-outline" label="Profile" />
                    <MenuItem icon="create-outline" label="Edit Profile" onPress={handleEditProfile} />
                    <MenuItem icon="grid-outline" label="Dashboard" />
                    <MenuItem icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
                    <MenuItem icon="location-outline" label="Location" onPress={() => router.push('/location')} />
                    <MenuItem icon="help-circle-outline" label="Help & Support" />
                </View>

                <LogoutButton onPress={handleLogout} />
            </ScrollView>

            <ImageOptionsModal
                visible={showImageOptions}
                onClose={() => setShowImageOptions(false)}
                onTakePhoto={handleTakePhoto}
                onPickImage={handleImagePick}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    menuContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
});
