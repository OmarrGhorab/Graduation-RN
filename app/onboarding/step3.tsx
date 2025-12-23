import { useToast } from '@/components/toast';
import { Colors, Fonts, cskColors, grayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    useColorScheme,
} from 'react-native';
import { useOnboardingStore } from '@/libs/onboarding';
import { submitOnboarding, searchParents, requestParentLink } from '@/services/AuthService';
import { completeOnboarding } from '@/services/OnboardingService';
import { useAuthStore } from '@/libs/auth';
import { ProfileCompletionBody } from '@/types/auth';

const { width } = Dimensions.get('window');

// Define Parent type based on actual structure if possible
type Parent = { id: string; username: string; name: string; profileImg?: string };

const GOALS = [
    'Career Advancement', 'Personal Growth', 'Skill Development', 'Hobby',
    'Start a Business', 'Get Certified', 'Teach Others', 'Stay Updated', 'Others',
];


export default function OnboardingStep3() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const { formData, setStep3Data } = useOnboardingStore();
    const toast = useToast();

    // Initialize from Zustand store
    const storedGoals = formData.goals || [];
    const predefinedGoals = storedGoals.filter(g => GOALS.includes(g));
    const customStoredGoals = storedGoals.filter(g => !GOALS.includes(g));
    
    const [selectedGoals, setSelectedGoals] = useState<string[]>(
        customStoredGoals.length > 0 ? [...predefinedGoals, 'Others'] : predefinedGoals
    );
    const [customGoalInput, setCustomGoalInput] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(customStoredGoals.length > 0);
    const [customGoals, setCustomGoals] = useState<string[]>(customStoredGoals);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Parent[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedParents, setSelectedParents] = useState<Parent[]>([]);
    const [newsletter, setNewsletter] = useState(
        formData.newsletterEnabled ?? false
    );
    const [notifications, setNotifications] = useState(true);
    const [isLoading, setIsLoading] = useState(false);


    // Search functionality with debouncing
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        // IMPORTANT: Set searching to true immediately to avoid flickering "No users found"
        setIsSearching(true);

        const timeoutId = setTimeout(async () => {
            try {
                const result = await searchParents(searchQuery);
                setSearchResults(result.data as Parent[]);
            } catch (err) {
                console.error('Search error:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300); // Debounce for smoother UX

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Save data to Zustand when component unmounts or data changes
    useEffect(() => {
        return () => {
            // Save current state when navigating away
            const finalGoals = [...selectedGoals.filter(g => g !== 'Others'), ...customGoals];
            const parentIds = selectedParents.length > 0 ? selectedParents.map(p => p.id) : undefined;
            
            setStep3Data({
                goals: finalGoals,
                parentIds: parentIds,
                newsletterEnabled: newsletter,
            });
        };
    }, [selectedGoals, customGoals, selectedParents, newsletter, setStep3Data]);

    const handleSendRequest = useCallback((parent: Parent) => {
        // Check if already selected
        if (selectedParents.some(p => p.id === parent.id)) {
            toast.warning('Already Selected', `${parent.name} is already in your list`);
            return;
        }
        
        setSelectedParents(prev => [...prev, parent]);
        // Remove the selected parent from search results but keep the search active
        setSearchResults(prev => prev.filter(p => p.id !== parent.id));
        toast.success('Parent Selected', `${parent.name} has been added`);
    }, [toast, selectedParents]);

    const handleRemoveParent = useCallback((parentId: string) => {
        setSelectedParents(prev => prev.filter(p => p.id !== parentId));
    }, []);

    const addCustomGoal = useCallback(() => {
        if (customGoalInput.trim()) {
            setCustomGoals([customGoalInput.trim()]); // Only allow one custom goal
            setCustomGoalInput('');
            setShowCustomInput(false);
        }
    }, [customGoalInput]);

    const removeCustomGoal = useCallback((goal: string) => {
        setCustomGoals(customGoals.filter(g => g !== goal));
        // Also remove 'Others' from selected goals when custom goal is removed
        setSelectedGoals(selectedGoals.filter(g => g !== 'Others'));
    }, [customGoals, selectedGoals]);

    const toggleGoal = (goal: string) => {
        if (goal === 'Others') {
            setShowCustomInput(!showCustomInput);
            if (!selectedGoals.includes('Others')) {
                setSelectedGoals([...selectedGoals, 'Others']);
            } else {
                setSelectedGoals(selectedGoals.filter(g => g !== 'Others'));
                setCustomGoals([]);
            }
        } else {
            // Handle regular goals
            if (selectedGoals.includes(goal)) {
                setSelectedGoals(selectedGoals.filter(g => g !== goal));
            } else {
                if (selectedGoals.length < 3) {
                    setSelectedGoals([...selectedGoals, goal]);
                } else {
                    toast.error('Limit Reached', 'You can select up to 3 goals');
                }
            }
        }
    };

    const handleComplete = async () => {
        if (selectedGoals.length === 0) {
            toast.error('Required', 'Please select at least one goal');
            return;
        }

        const finalGoals = [...selectedGoals.filter(g => g !== 'Others'), ...customGoals];
        const parentIds = selectedParents.length > 0 ? selectedParents.map(p => p.id) : undefined;

        // Prepare full data for submission
        const completeData = {
            ...formData,
            goals: finalGoals,
            parentIds: parentIds,
            newsletterEnabled: newsletter,
            preferences: {
                ...formData.preferences,
                notifications: notifications,
            }
        } as ProfileCompletionBody;

        setIsLoading(true);
        try {
            const response = await submitOnboarding(completeData);

            // CRITICAL: Update the auth store so index.tsx knows onboarding is done
            if (response.success && response.user) {
                useAuthStore.getState().updateUser(response.user);
            }

            // Mark app onboarding as completed in local storage (intro bypass)
            await completeOnboarding();

            // Update local onboarding store (UI purposes)
            setStep3Data({
                goals: finalGoals,
                parentIds: parentIds,
                newsletterEnabled: newsletter,
            });

            toast.success('Success', 'Profile setup complete!');
            router.replace('/home' as Href);
        } catch (err: any) {
            console.error('Onboarding submission error:', err);
            toast.error('Submission Failed', err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={cskColors[500]} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Almost done!</Text>
                    <Text style={styles.subtitle}>Let's customize your learning experience</Text>
                </View>

                {/* Parent Search Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Search Parent</Text>
                    <Text style={styles.sectionSubtitle}>Search for parent or guardian by name or username</Text>

                    <View style={styles.searchInputContainer}>
                        <Ionicons name="search" size={20} color={grayColors[500]} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or username..."
                            placeholderTextColor={grayColors[500]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                style={styles.clearButton}
                            >
                                <Ionicons name="close-circle" size={20} color={grayColors[400]} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Selected Parents Display */}
                    {selectedParents.length > 0 && (
                        <View style={styles.selectedParentsContainer}>
                            <Text style={styles.selectedParentLabel}>Selected Parents ({selectedParents.length}):</Text>
                            {selectedParents.map((parent) => (
                                <View key={parent.id} style={styles.selectedParentInfo}>
                                    {parent.profileImg ? (
                                        <Image source={{ uri: parent.profileImg }} style={styles.selectedParentAvatar} />
                                    ) : (
                                        <View style={[styles.selectedParentAvatar, styles.avatarPlaceholder]}>
                                            <Ionicons name="person" size={20} color={grayColors[400]} />
                                        </View>
                                    )}
                                    <View style={styles.selectedParentDetails}>
                                        <Text style={styles.selectedParentName}>{parent.name}</Text>
                                        <Text style={styles.selectedParentUsername}>@{parent.username}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveParent(parent.id)}
                                    >
                                        <Ionicons name="close-circle" size={22} color={grayColors[400]} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Search Results / Loading / Empty State */}
                    {isSearching ? (
                        <View style={styles.searchingLoader}>
                            <ActivityIndicator size="small" color={cskColors[500]} />
                            <Text style={styles.searchingText}>Searching...</Text>
                        </View>
                    ) : (
                        <>
                            {(() => {
                                // Filter out already selected parents
                                const selectedIds = new Set(selectedParents.map(p => p.id));
                                const filteredResults = searchResults.filter(user => !selectedIds.has(user.id));
                                
                                return filteredResults.length > 0 ? (
                                    <View style={styles.searchResultsContainer}>
                                        {filteredResults.map((user) => (
                                            <View key={user.id} style={styles.searchResultItem}>
                                                {user.profileImg ? (
                                                    <Image source={{ uri: user.profileImg }} style={styles.resultAvatar} />
                                                ) : (
                                                    <View style={[styles.resultAvatar, styles.avatarPlaceholder]}>
                                                        <Ionicons name="person" size={20} color={grayColors[400]} />
                                                    </View>
                                                )}
                                                <View style={styles.resultDetails}>
                                                    <Text style={styles.resultName}>{user.name}</Text>
                                                    <Text style={styles.resultUsername}>@{user.username}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.requestButton}
                                                    onPress={() => handleSendRequest(user)}
                                                >
                                                    <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                                                    <Text style={styles.requestButtonText}>Select</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    !isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                                        <View style={styles.emptySearchContainer}>
                                            <Ionicons name="search-outline" size={40} color={grayColors[300]} />
                                            <Text style={styles.emptySearchText}>No users found for "{searchQuery}"</Text>
                                        </View>
                                    )
                                );
                            })()}
                        </>
                    )}
                </View>

                {/* Goals Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Your Goals</Text>
                    <Text style={styles.sectionSubtitle}>What do you want to achieve? (Select up to 3)</Text>

                    <View style={styles.goalsGrid}>
                        {GOALS.map((goal) => (
                            <TouchableOpacity
                                key={goal}
                                style={[
                                    styles.goalChip,
                                    selectedGoals.includes(goal) && styles.goalChipSelected,
                                ]}
                                onPress={() => toggleGoal(goal)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.goalChipText,
                                    selectedGoals.includes(goal) && styles.goalChipTextSelected,
                                ]}>
                                    {goal}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {customGoals.map((goal, index) => (
                            <TouchableOpacity
                                key={`custom-${index}`}
                                style={[
                                    styles.goalChip,
                                    styles.customGoalChip,
                                ]}
                                onPress={() => removeCustomGoal(goal)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.goalChipText,
                                    styles.customGoalChipText,
                                ]}>
                                    {goal}
                                </Text>
                                <Ionicons name="close" size={14} color={cskColors[500]} style={styles.customGoalRemoveIcon} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Goal Input */}
                    {showCustomInput && customGoals.length < 1 && (
                        <View style={styles.customGoalInputContainer}>
                            <TextInput
                                style={styles.customGoalInput}
                                placeholder="Enter your custom goal..."
                                placeholderTextColor={grayColors[500]}
                                value={customGoalInput}
                                onChangeText={setCustomGoalInput}
                                onSubmitEditing={addCustomGoal}
                                maxLength={30}
                                autoFocus={true}
                            />
                            <TouchableOpacity
                                style={styles.addGoalButton}
                                onPress={addCustomGoal}
                                disabled={!customGoalInput.trim()}
                            >
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Preferences Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceItemTitle}>Push Notifications</Text>
                            <Text style={styles.preferenceItemDescription}>Get updates about your courses</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggle, notifications && styles.toggleActive]}
                            onPress={() => setNotifications(!notifications)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.toggleCircle, notifications && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceItemTitle}>Newsletter</Text>
                            <Text style={styles.preferenceItemDescription}>Receive tips and updates via email</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggle, newsletter && styles.toggleActive]}
                            onPress={() => setNewsletter(!newsletter)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.toggleCircle, newsletter && styles.toggleCircleActive]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Complete Button */}
                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={handleComplete}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.completeButtonText}>Complete Setup</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        color: Colors.light.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    sectionContainer: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: Colors.light.text,
        marginBottom: 6,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 12,
    },
    clearButton: {
        padding: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    selectedParentsContainer: {
        backgroundColor: grayColors[50],
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    selectedParentLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: grayColors[500],
        marginBottom: 4,
    },
    selectedParentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 8,
    },
    selectedParentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    selectedParentDetails: {
        flex: 1,
    },
    selectedParentName: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: Colors.light.text,
    },
    selectedParentUsername: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    removeButton: {
        padding: 4,
    },
    searchResultsContainer: {
        marginTop: 8,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    resultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: grayColors[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchingLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    searchingText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[500],
    },
    emptySearchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        backgroundColor: grayColors[50],
        borderRadius: 12,
        marginTop: 10,
    },
    emptySearchText: {
        marginTop: 10,
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[400],
    },
    resultDetails: {
        flex: 1,
    },
    resultName: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: Colors.light.text,
    },
    resultUsername: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: cskColors[500],
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    requestButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    preferenceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    preferenceInfo: {
        flex: 1,
        marginBottom: 8,
    },
    preferenceItemTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: Colors.light.text,
        marginBottom: 2,
    },
    preferenceItemDescription: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    preferenceInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    preferenceInputText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
        flex: 1,
    },
    customGoalChip: {
        backgroundColor: cskColors[50],
        borderColor: cskColors[500],
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    customGoalChipText: {
        color: cskColors[500],
        marginRight: 4,
    },
    customGoalRemoveIcon: {
        marginLeft: 4,
    },
    customGoalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    customGoalInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    addGoalButton: {
        backgroundColor: cskColors[500],
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        color: grayColors[500],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.light.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: Colors.light.text,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    modalOptionText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    themeOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    themeOptionIcon: {
        marginRight: 12,
    },
    goalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    goalChip: {
        backgroundColor: grayColors[50],
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 6,
        marginBottom: 12,
    },
    goalChipSelected: {
        backgroundColor: cskColors[500],
        borderColor: cskColors[500],
    },
    goalChipText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.light.text,
    },
    goalChipTextSelected: {
        color: '#FFFFFF',
    },
    hoursContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    hourChip: {
        flex: 1,
        backgroundColor: grayColors[50],
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    hourChipSelected: {
        backgroundColor: cskColors[500],
        borderColor: cskColors[500],
    },
    hourChipText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.light.text,
        textAlign: 'center',
    },
    hourChipTextSelected: {
        color: '#FFFFFF',
    },
    toggle: {
        width: 48,
        height: 28,
        backgroundColor: '#E5E5E5',
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleActive: {
        backgroundColor: cskColors[500],
    },
    toggleCircle: {
        width: 24,
        height: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleCircleActive: {
        alignSelf: 'flex-end',
    },
    completeButton: {
        backgroundColor: cskColors[500],
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: cskColors[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButtonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
        marginRight: 8,
    },
    buttonIcon: {
        marginLeft: 8,
    },
});
