import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/libs/auth';
import { cskColors, grayColors, Fonts } from '@/constants/theme';
import { updateProfile, checkUsername, getProfile } from '@/services/ProfileService';
import { useToast } from '@/components/toast';

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, updateUser } = useAuthStore();
    const toast = useToast();

    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    // Profile data from API
    const [canChangeUsername, setCanChangeUsername] = useState(true);
    const [nextUsernameChangeDate, setNextUsernameChangeDate] = useState<string | null>(null);

    // Fetch profile data on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsFetchingProfile(true);
            const response = await getProfile();
            
            // Update local state with fresh data
            setName(response.user.name);
            setUsername(response.user.username);
            setCanChangeUsername(response.canChangeUsername);
            setNextUsernameChangeDate(response.nextUsernameChangeDate);
            
            // Update auth store with fresh user data
            updateUser(response.user);
        } catch (error: any) {
            console.error('Fetch profile error:', error);
            toast.error('Error', 'Failed to load profile data');
        } finally {
            setIsFetchingProfile(false);
        }
    };

    useEffect(() => {
        // Debounce username check
        if (username && username !== user?.username) {
            const timeoutId = setTimeout(() => {
                handleCheckUsername();
            }, 500);
            return () => clearTimeout(timeoutId);
        } else {
            setUsernameError('');
            setUsernameSuggestions([]);
        }
    }, [username]);

    const handleCheckUsername = async () => {
        if (!username || username === user?.username) return;

        try {
            setIsCheckingUsername(true);
            const result = await checkUsername(username);
            
            if (!result.available) {
                setUsernameError('Username is already taken');
                setUsernameSuggestions(result.suggestions || []);
            } else {
                setUsernameError('');
                setUsernameSuggestions([]);
            }
        } catch (error: any) {
            console.error('Username check error:', error);
        } finally {
            setIsCheckingUsername(false);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!name.trim()) {
            toast.error('Error', 'Name is required');
            return;
        }

        if (!username.trim()) {
            toast.error('Error', 'Username is required');
            return;
        }

        if (usernameError) {
            toast.error('Error', 'Please fix username errors');
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            toast.error('Error', 'Passwords do not match');
            return;
        }

        if (newPassword && !currentPassword) {
            toast.error('Error', 'Current password is required to change password');
            return;
        }

        try {
            setIsLoading(true);

            const updateData: any = {};
            
            if (name !== user?.name) {
                updateData.name = name;
            }

            if (username !== user?.username) {
                if (!canChangeUsername) {
                    toast.error('Error', `You can change your username again on ${nextUsernameChangeDate}`);
                    return;
                }
                updateData.username = username;
            }

            if (newPassword) {
                updateData.password = newPassword;
                updateData.currentPassword = currentPassword;
            }

            if (Object.keys(updateData).length === 0) {
                toast.info('Info', 'No changes to save');
                return;
            }

            const response = await updateProfile(updateData);

            // Update user state
            updateUser(response.user);

            toast.success('Success', response.message || 'Profile updated successfully');
            
            // Navigate back after a short delay
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error: any) {
            console.error('Update profile error:', error);
            toast.error('Error', error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={grayColors[900]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={styles.placeholder} />
            </View>

            {isFetchingProfile ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={cskColors[500]} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                {/* Name Input */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor={grayColors[400]}
                    />
                </View>

                {/* Username Input */}
                <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Username</Text>
                        {isCheckingUsername && (
                            <ActivityIndicator size="small" color={cskColors[500]} />
                        )}
                    </View>
                    <TextInput
                        style={[styles.input, usernameError && styles.inputError]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor={grayColors[400]}
                        autoCapitalize="none"
                    />
                    {usernameError && (
                        <Text style={styles.errorText}>{usernameError}</Text>
                    )}
                    {!canChangeUsername && (
                        <Text style={styles.warningText}>
                            You can change your username again on {nextUsernameChangeDate}
                        </Text>
                    )}
                    {usernameSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                            <View style={styles.suggestionsRow}>
                                {usernameSuggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionChip}
                                        onPress={() => setUsername(suggestion)}
                                    >
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Email (Read-only) */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <View style={[styles.input, styles.disabledInput]}>
                        <Text style={styles.disabledText}>{user?.email}</Text>
                    </View>
                    <Text style={styles.helperText}>Email cannot be changed</Text>
                </View>

                {/* Change Password Section */}
                <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPasswordSection(!showPasswordSection)}
                >
                    <Text style={styles.passwordToggleText}>Change Password</Text>
                    <Ionicons
                        name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={grayColors[600]}
                    />
                </TouchableOpacity>

                {showPasswordSection && (
                    <>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Current Password</Text>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                placeholderTextColor={grayColors[400]}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor={grayColors[400]}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor={grayColors[400]}
                                secureTextEntry
                            />
                        </View>
                    </>
                )}

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[700],
        marginBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: grayColors[200],
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[900],
    },
    inputError: {
        borderColor: '#EF4444',
    },
    disabledInput: {
        backgroundColor: grayColors[50],
    },
    disabledText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    errorText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#EF4444',
        marginTop: 4,
    },
    warningText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#F59E0B',
        marginTop: 4,
    },
    helperText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 4,
    },
    suggestionsContainer: {
        marginTop: 8,
    },
    suggestionsTitle: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: grayColors[600],
        marginBottom: 8,
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        backgroundColor: cskColors[50],
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: cskColors[200],
    },
    suggestionText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: cskColors[600],
    },
    passwordToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: grayColors[50],
        borderRadius: 12,
        marginBottom: 20,
    },
    passwordToggleText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: grayColors[700],
    },
    saveButton: {
        backgroundColor: cskColors[500],
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 12,
    },
});
