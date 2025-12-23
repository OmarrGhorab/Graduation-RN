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
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/libs/auth';
import { cskColors, grayColors, Fonts } from '@/constants/theme';
import { updateProfile, checkUsername, getProfile } from '@/services/ProfileService';
import { useToast } from '@/components/toast';

const INTERESTS = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'Artificial Intelligence', 'Cloud Computing', 'DevOps', 'Cybersecurity',
    'Blockchain', 'Game Development', 'UI/UX Design', 'Digital Marketing',
    'Business', 'Finance', 'Photography', 'Music Production', 'Writing',
    'Language Learning', 'Fitness', 'Nutrition', 'Psychology', 'Philosophy',
];

const GOALS = [
    'Career Advancement', 'Personal Growth', 'Skill Development', 'Hobby',
    'Start a Business', 'Get Certified', 'Teach Others', 'Stay Updated', 'Others',
];

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, updateUser } = useAuthStore();
    const toast = useToast();

    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Goals state
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [customGoals, setCustomGoals] = useState<string[]>([]);
    const [customGoalInput, setCustomGoalInput] = useState('');
    const [showCustomGoalInput, setShowCustomGoalInput] = useState(false);
    
    // Interests state
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(false);
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
    const [showUsernameWarning, setShowUsernameWarning] = useState(false);

    // Profile data from API
    const [canChangeUsername, setCanChangeUsername] = useState(true);
    const [nextUsernameChangeDate, setNextUsernameChangeDate] = useState<string | null>(null);
    const [hasPassword, setHasPassword] = useState(true);

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
            setBio(response.user.bio || '');
            
            // Process goals
            const userGoals = response.user.goals || [];
            const predefinedGoals = userGoals.filter((g: string) => GOALS.includes(g));
            const customUserGoals = userGoals.filter((g: string) => !GOALS.includes(g));
            setSelectedGoals(customUserGoals.length > 0 ? [...predefinedGoals, 'Others'] : predefinedGoals);
            setCustomGoals(customUserGoals);
            setShowCustomGoalInput(customUserGoals.length > 0);
            
            // Process interests
            const userInterests = response.user.interests?.map((i: { id: string; name: string }) => i.name) || [];
            setSelectedInterests(userInterests);
            
            setCanChangeUsername(response.canChangeUsername);
            setNextUsernameChangeDate(response.nextUsernameChangeDate);
            
            // Check if user has password (for Google login users)
            const userHasPassword = response.user.hasPassword ?? true;
            console.log('User hasPassword:', userHasPassword, 'Raw value:', response.user.hasPassword);
            setHasPassword(userHasPassword);
            
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
        if (!username || username === user?.username) {
            setUsernameError('');
            setUsernameAvailable(false);
            setUsernameSuggestions([]);
            return;
        }

        try {
            setIsCheckingUsername(true);
            const result = await checkUsername(username);
            
            if (!result.available) {
                setUsernameError(result.message || 'Username is not available');
                setUsernameAvailable(false);
                setUsernameSuggestions(result.suggestions || []);
            } else {
                setUsernameError('');
                setUsernameAvailable(true);
                setUsernameSuggestions([]);
            }
        } catch (error: any) {
            console.error('Username check error:', error);
            // Don't show error toast for validation errors, just show in the field
            setUsernameError(error.message || 'Failed to check username');
            setUsernameAvailable(false);
            setUsernameSuggestions([]);
        } finally {
            setIsCheckingUsername(false);
        }
    };

    const toggleGoal = (goal: string) => {
        if (goal === 'Others') {
            setShowCustomGoalInput(!showCustomGoalInput);
            if (!selectedGoals.includes('Others')) {
                setSelectedGoals([...selectedGoals, 'Others']);
            } else {
                setSelectedGoals(selectedGoals.filter(g => g !== 'Others'));
                setCustomGoals([]);
            }
        } else {
            if (selectedGoals.includes(goal)) {
                setSelectedGoals(selectedGoals.filter(g => g !== goal));
            } else {
                if (selectedGoals.length < 3) {
                    setSelectedGoals([...selectedGoals, goal]);
                } else {
                    toast.warning('Limit Reached', 'You can select up to 3 goals');
                }
            }
        }
    };

    const addCustomGoal = () => {
        if (customGoalInput.trim()) {
            setCustomGoals([customGoalInput.trim()]);
            setCustomGoalInput('');
            setShowCustomGoalInput(false);
        }
    };

    const removeCustomGoal = (goal: string) => {
        setCustomGoals(customGoals.filter(g => g !== goal));
        setSelectedGoals(selectedGoals.filter(g => g !== 'Others'));
    };

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            if (selectedInterests.length < 5) {
                setSelectedInterests([...selectedInterests, interest]);
            } else {
                toast.warning('Limit Reached', 'You can select up to 5 interests');
            }
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

        if (bio && bio.length > 200) {
            toast.error('Error', 'Bio must be 200 characters or less');
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            toast.error('Error', 'Passwords do not match');
            return;
        }

        if (newPassword && hasPassword && !currentPassword) {
            console.log('Password validation failed - hasPassword:', hasPassword, 'currentPassword:', currentPassword);
            toast.error('Error', 'Current password is required to change password');
            return;
        }

        // Check if username is being changed and show warning
        if (username !== user?.username) {
            if (!canChangeUsername) {
                toast.error('Error', `You can change your username again on ${nextUsernameChangeDate}`);
                return;
            }
            // Show warning modal before proceeding
            setShowUsernameWarning(true);
            return;
        }

        // If no username change, proceed with save
        await performSave();
    };

    const performSave = async () => {
        try {
            setIsLoading(true);

            const updateData: any = {};
            
            if (name !== user?.name) {
                updateData.name = name;
            }

            if (username !== user?.username) {
                updateData.username = username;
            }

            if (bio !== (user?.bio || '')) {
                updateData.bio = bio;
            }

            // Combine predefined and custom goals
            const finalGoals = [...selectedGoals.filter(g => g !== 'Others'), ...customGoals];
            const userGoals = user?.goals || [];
            if (JSON.stringify(finalGoals) !== JSON.stringify(userGoals)) {
                updateData.goals = finalGoals;
            }

            const userInterests = user?.interests?.map((i: { id: string; name: string }) => i.name) || [];
            if (JSON.stringify(selectedInterests) !== JSON.stringify(userInterests)) {
                updateData.interests = selectedInterests;
            }

            if (newPassword) {
                updateData.password = newPassword;
                // Only send currentPassword if user has an existing password
                if (hasPassword && currentPassword) {
                    updateData.currentPassword = currentPassword;
                }
                console.log('Sending password update - hasPassword:', hasPassword, 'including currentPassword:', hasPassword && currentPassword);
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
                        {!isCheckingUsername && usernameAvailable && username !== user?.username && (
                            <View style={styles.availableBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.availableText}>Available</Text>
                            </View>
                        )}
                    </View>
                    <TextInput
                        style={[
                            styles.input,
                            usernameError && styles.inputError,
                            usernameAvailable && username !== user?.username && styles.inputSuccess,
                        ]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor={grayColors[400]}
                        autoCapitalize="none"
                        editable={canChangeUsername}
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

                {/* Password Section */}
                {!hasPassword && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={cskColors[500]} />
                        <Text style={styles.infoText}>
                            You signed in with Google. Set a password to enable email login. No current password required.
                        </Text>
                    </View>
                )}
                
                {hasPassword && (
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
                )}

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

                {/* Bio */}
                <View style={styles.inputContainer}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Bio</Text>
                        <Text style={styles.charCount}>{bio.length}/200</Text>
                    </View>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about yourself..."
                        placeholderTextColor={grayColors[400]}
                        multiline
                        numberOfLines={4}
                        maxLength={200}
                    />
                </View>

                {/* Goals */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Goals (Select up to 3)</Text>
                    <View style={styles.chipsGrid}>
                        {GOALS.map((goal) => (
                            <TouchableOpacity
                                key={goal}
                                style={[
                                    styles.selectableChip,
                                    selectedGoals.includes(goal) && styles.selectableChipSelected,
                                ]}
                                onPress={() => toggleGoal(goal)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.selectableChipText,
                                    selectedGoals.includes(goal) && styles.selectableChipTextSelected,
                                ]}>
                                    {goal}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {customGoals.map((goal, index) => (
                            <TouchableOpacity
                                key={`custom-${index}`}
                                style={[styles.selectableChip, styles.customChipSelected]}
                                onPress={() => removeCustomGoal(goal)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.selectableChipTextSelected}>
                                    {goal}
                                </Text>
                                <Ionicons name="close" size={14} color="#FFFFFF" style={styles.customChipRemoveIcon} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {showCustomGoalInput && customGoals.length < 1 && (
                        <View style={styles.customInputContainer}>
                            <TextInput
                                style={styles.customInput}
                                placeholder="Enter your custom goal..."
                                placeholderTextColor={grayColors[400]}
                                value={customGoalInput}
                                onChangeText={setCustomGoalInput}
                                onSubmitEditing={addCustomGoal}
                                maxLength={30}
                                autoFocus={true}
                            />
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={addCustomGoal}
                                disabled={!customGoalInput.trim()}
                            >
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Interests */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Interests (Select up to 5)</Text>
                    <View style={styles.chipsGrid}>
                        {INTERESTS.map((interest) => (
                            <TouchableOpacity
                                key={interest}
                                style={[
                                    styles.selectableChip,
                                    selectedInterests.includes(interest) && styles.selectableChipSelected,
                                ]}
                                onPress={() => toggleInterest(interest)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.selectableChipText,
                                    selectedInterests.includes(interest) && styles.selectableChipTextSelected,
                                ]}>
                                    {interest}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

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

            {/* Username Change Warning Modal */}
            <Modal
                visible={showUsernameWarning}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUsernameWarning(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name="warning" size={48} color="#F59E0B" />
                        <Text style={styles.modalTitle}>Change Username?</Text>
                        <Text style={styles.modalText}>
                            You can only change your username once every 7 days. After changing it, you won't be able to change it again until the cooldown period ends.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowUsernameWarning(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={() => {
                                    setShowUsernameWarning(false);
                                    performSave();
                                }}
                            >
                                <Text style={styles.confirmButtonText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    inputSuccess: {
        borderColor: '#10B981',
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
    availableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    availableText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#10B981',
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
    charCount: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    chipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    selectableChip: {
        backgroundColor: grayColors[50],
        borderWidth: 1,
        borderColor: grayColors[200],
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 6,
        marginBottom: 12,
    },
    selectableChipSelected: {
        backgroundColor: cskColors[500],
        borderColor: cskColors[500],
    },
    selectableChipText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[700],
    },
    selectableChipTextSelected: {
        color: '#FFFFFF',
    },
    customChipSelected: {
        backgroundColor: cskColors[500],
        borderColor: cskColors[500],
        flexDirection: 'row',
        alignItems: 'center',
    },
    customChipRemoveIcon: {
        marginLeft: 4,
    },
    customInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    customInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: grayColors[200],
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[900],
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: cskColors[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: cskColors[50],
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[700],
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: grayColors[900],
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: grayColors[100],
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: grayColors[700],
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
});
