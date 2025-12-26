import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';
import { checkUsername } from '@/services/ProfileService';
import { useToast } from '@/components/toast';
import { useProfile, useUpdateProfileMutation } from '@/hooks/useProfile';
import { INTERESTS_OPTIONS, GOALS_OPTIONS } from '@/libs/i18n/options';
import {
    FormInput,
    ChipSelector,
    CustomGoalInput,
    UsernameWarningModal,
} from '@/components/profile';

// Get keys (English) for storage/API
const INTERESTS = INTERESTS_OPTIONS.map(i => i.key);
const GOALS = GOALS_OPTIONS.map(g => g.key);

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const toast = useToast();

    // Use cached profile data
    const {
        profile,
        canChangeUsername: canChangeUsernameFromApi,
        nextUsernameChangeDate: nextChangeDate,
        isLoading: isFetchingProfile,
        isError,
    } = useProfile();
    const updateProfileMutation = useUpdateProfileMutation();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [customGoals, setCustomGoals] = useState<string[]>([]);
    const [customGoalInput, setCustomGoalInput] = useState('');
    const [showCustomGoalInput, setShowCustomGoalInput] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(false);
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
    const [showUsernameWarning, setShowUsernameWarning] = useState(false);

    const canChangeUsername = canChangeUsernameFromApi;
    const nextUsernameChangeDate = nextChangeDate;
    const hasPassword = profile?.hasPassword ?? true;

    // Initialize form with cached profile data
    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setUsername(profile.username || '');
            setBio(profile.bio || '');

            const userGoals = profile.goals || [];
            const predefinedGoals = userGoals.filter((g: string) => GOALS.includes(g));
            const customUserGoals = userGoals.filter((g: string) => !GOALS.includes(g));
            setSelectedGoals(customUserGoals.length > 0 ? [...predefinedGoals, 'Others'] : predefinedGoals);
            setCustomGoals(customUserGoals);
            setShowCustomGoalInput(customUserGoals.length > 0);

            const userInterests = profile.interests?.map((i: { id: string; name: string }) => i.name) || [];
            setSelectedInterests(userInterests);
        }
    }, [profile]);

    useEffect(() => {
        if (username && username !== profile?.username) {
            const timeoutId = setTimeout(() => handleCheckUsername(), 500);
            return () => clearTimeout(timeoutId);
        } else {
            setUsernameError('');
            setUsernameSuggestions([]);
        }
    }, [username, profile?.username]);

    const handleCheckUsername = async () => {
        if (!username || username === profile?.username) {
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
            } else if (selectedGoals.length < 3) {
                setSelectedGoals([...selectedGoals, goal]);
            } else {
                toast.warning(t('profile.limitReached'), t('profile.goalsLimitReached'));
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
        } else if (selectedInterests.length < 5) {
            setSelectedInterests([...selectedInterests, interest]);
        } else {
            toast.warning(t('profile.limitReached'), t('profile.interestsLimitReached'));
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return toast.error(t('common.error'), t('profile.nameRequired'));
        if (!username.trim()) return toast.error(t('common.error'), t('profile.usernameRequired'));
        if (usernameError) return toast.error(t('common.error'), t('profile.fixUsernameErrors'));
        if (bio && bio.length > 200) return toast.error(t('common.error'), t('profile.bioTooLong'));
        if (newPassword && newPassword !== confirmPassword) return toast.error(t('common.error'), t('profile.passwordsDoNotMatch'));
        if (newPassword && hasPassword && !currentPassword) {
            return toast.error(t('common.error'), t('profile.currentPasswordRequired'));
        }

        if (username !== profile?.username) {
            if (!canChangeUsername) {
                return toast.error(t('common.error'), t('profile.usernameChangeWarning', { date: nextUsernameChangeDate }));
            }
            setShowUsernameWarning(true);
            return;
        }

        await performSave();
    };

    const performSave = async () => {
        const updateData: any = {};

        if (name !== profile?.name) updateData.name = name;
        if (username !== profile?.username) updateData.username = username;
        if (bio !== (profile?.bio || '')) updateData.bio = bio;

        const finalGoals = [...selectedGoals.filter(g => g !== 'Others'), ...customGoals];
        const userGoals = profile?.goals || [];
        if (JSON.stringify(finalGoals) !== JSON.stringify(userGoals)) updateData.goals = finalGoals;

        const userInterests = profile?.interests?.map((i: { id: string; name: string }) => i.name) || [];
        if (JSON.stringify(selectedInterests) !== JSON.stringify(userInterests)) {
            updateData.interests = selectedInterests;
        }

        if (newPassword) {
            updateData.password = newPassword;
            if (hasPassword && currentPassword) updateData.currentPassword = currentPassword;
        }

        if (Object.keys(updateData).length === 0) {
            return toast.info(t('common.info') || 'Info', t('profile.noChangesToSave'));
        }

        updateProfileMutation.mutate(updateData, {
            onSuccess: (response) => {
                toast.success(t('common.success'), response.message || t('profile.profileUpdated'));
                setTimeout(() => router.back(), 1000);
            },
            onError: (error: any) => {
                toast.error(t('common.error'), error.message || t('profile.failedToUpdate'));
            },
        });
    };

    const backgroundColor = isDark ? theme.background : '#FFFFFF';
    const headerBorder = isDark ? theme.border : theme.gray[100];
    const headerTextColor = isDark ? theme.text : theme.gray[900];

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor, paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.header, { borderBottomColor: headerBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={headerTextColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: headerTextColor }]}>{t('profile.editProfile')}</Text>
                <View style={styles.placeholder} />
            </View>

            {isFetchingProfile ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: isDark ? theme.gray[600] : theme.gray[500] }]}>
                        {t('profile.loadingProfile')}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <FormInput label={t('profile.name')} value={name} onChangeText={setName} placeholder={t('profile.namePlaceholder')} />

                    <FormInput
                        label={t('profile.username')}
                        value={username}
                        onChangeText={setUsername}
                        placeholder={t('profile.usernamePlaceholder')}
                        autoCapitalize="none"
                        editable={canChangeUsername}
                        error={usernameError}
                        isSuccess={usernameAvailable && username !== profile?.username}
                        rightLabel={
                            isCheckingUsername ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : usernameAvailable && username !== profile?.username ? (
                                <View style={styles.availableBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.availableText}>{t('profile.usernameAvailable')}</Text>
                                </View>
                            ) : null
                        }
                    />
                    {!canChangeUsername && (
                        <Text style={[styles.warningText, { color: '#F59E0B' }]}>
                            {t('profile.usernameChangeWarning', { date: nextUsernameChangeDate })}
                        </Text>
                    )}
                    {usernameSuggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <Text style={[styles.suggestionsTitle, { color: isDark ? theme.gray[700] : theme.gray[600] }]}>
                                {t('profile.suggestions')}
                            </Text>
                            <View style={styles.suggestionsRow}>
                                {usernameSuggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.suggestionChip,
                                            {
                                                backgroundColor: isDark ? theme.csk[100] : theme.csk[50],
                                                borderColor: isDark ? theme.csk[300] : theme.csk[200],
                                            },
                                        ]}
                                        onPress={() => setUsername(suggestion)}
                                    >
                                        <Text style={[styles.suggestionText, { color: isDark ? theme.csk[700] : theme.csk[600] }]}>
                                            {suggestion}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <FormInput
                        label={t('profile.email')}
                        disabled
                        disabledValue={profile?.email}
                        helperText={t('profile.emailCannotChange')}
                    />

                    {!hasPassword && (
                        <View style={[styles.infoBox, { backgroundColor: isDark ? theme.csk[100] : theme.csk[50] }]}>
                            <Ionicons name="information-circle" size={20} color={theme.primary} />
                            <Text style={[styles.infoText, { color: isDark ? theme.gray[800] : theme.gray[700] }]}>
                                {t('profile.googleSignInInfo')}
                            </Text>
                        </View>
                    )}

                    {hasPassword && (
                        <FormInput
                            label={t('profile.currentPassword')}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder={t('profile.currentPasswordPlaceholder')}
                            secureTextEntry
                        />
                    )}

                    <FormInput
                        label={t('profile.newPassword')}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t('profile.newPasswordPlaceholder')}
                        secureTextEntry
                    />

                    <FormInput
                        label={t('profile.confirmNewPassword')}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('profile.confirmNewPasswordPlaceholder')}
                        secureTextEntry
                    />

                    <FormInput
                        label={t('profile.bio')}
                        value={bio}
                        onChangeText={setBio}
                        placeholder={t('profile.bioPlaceholder')}
                        multiline
                        numberOfLines={4}
                        maxLength={200}
                        style={styles.textArea}
                        rightLabel={
                            <Text style={[styles.charCount, { color: isDark ? theme.gray[600] : theme.gray[500] }]}>
                                {bio.length}/200
                            </Text>
                        }
                    />

                    <ChipSelector
                        label={t('profile.goalsLabel')}
                        items={GOALS}
                        selectedItems={selectedGoals}
                        onToggle={toggleGoal}
                        customItems={customGoals}
                        onRemoveCustom={removeCustomGoal}
                        type="goals"
                    />
                    {showCustomGoalInput && customGoals.length < 1 && (
                        <CustomGoalInput
                            value={customGoalInput}
                            onChangeText={setCustomGoalInput}
                            onSubmit={addCustomGoal}
                        />
                    )}

                    <ChipSelector
                        label={t('profile.interestsLabel')}
                        items={INTERESTS}
                        selectedItems={selectedInterests}
                        onToggle={toggleInterest}
                        type="interests"
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.primary }, updateProfileMutation.isPending && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={updateProfileMutation.isPending}
                    >
                        {updateProfileMutation.isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>{t('profile.saveChanges')}</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}

            <UsernameWarningModal
                visible={showUsernameWarning}
                onCancel={() => setShowUsernameWarning(false)}
                onConfirm={() => {
                    setShowUsernameWarning(false);
                    performSave();
                }}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 12,
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
        marginTop: -16,
        marginBottom: 16,
    },
    suggestionsContainer: {
        marginTop: -12,
        marginBottom: 16,
    },
    suggestionsTitle: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 8,
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestionChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    suggestionText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.regular,
        lineHeight: 18,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14,
    },
    charCount: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    saveButton: {
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
});
