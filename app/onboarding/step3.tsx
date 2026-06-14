import React, { useState, useEffect, useCallback } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import { useToast } from '@/components/toast';
import { ParentSearchSection } from '@/components/onboarding/ParentSearchSection';
import { GoalsSection } from '@/components/onboarding/GoalsSection';
import { PreferenceToggle } from '@/components/onboarding/PreferenceToggle';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';
import { useOnboardingStore } from '@/libs/onboarding';
import { GOALS_OPTIONS } from '@/libs/i18n/options';
import { submitOnboarding, searchParents } from '@/services/AuthService';
import { completeOnboarding } from '@/services/OnboardingService';
import { useAuthStore } from '@/libs/auth';
import { ProfileCompletionBody } from '@/types/auth';

type Parent = { id: string; username: string; name: string; profileImg?: string };

export default function OnboardingStep3() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const { formData, setStep3Data } = useOnboardingStore();
    const toast = useToast();

    // Get goal keys (English) for storage
    const GOALS = GOALS_OPTIONS.map(g => g.key);

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
    const [newsletter, setNewsletter] = useState(formData.newsletterEnabled ?? false);
    const [notifications, setNotifications] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Search functionality with debouncing
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

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
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Save data to Zustand when component unmounts or data changes
    useEffect(() => {
        return () => {
            const finalGoals = [...selectedGoals.filter(g => g !== 'Others'), ...customGoals];
            const parentIds = selectedParents.length > 0 ? selectedParents.map(p => p.id) : undefined;
            
            setStep3Data({
                goals: finalGoals,
                parentIds: parentIds,
                newsletterEnabled: newsletter,
            });
        };
    }, [selectedGoals, customGoals, selectedParents, newsletter, setStep3Data]);

    const handleSelectParent = useCallback((parent: Parent) => {
        if (selectedParents.some(p => p.id === parent.id)) {
            toast.warning(t('onboarding.alreadySelected'), `${parent.name} ${t('onboarding.isAlreadyInList')}`);
            return;
        }
        
        setSelectedParents(prev => [...prev, parent]);
        setSearchResults(prev => prev.filter(p => p.id !== parent.id));
        toast.success(t('onboarding.parentSelected'), `${parent.name} ${t('onboarding.hasBeenAdded')}`);
    }, [toast, selectedParents, t]);

    const handleRemoveParent = useCallback((parentId: string) => {
        setSelectedParents(prev => prev.filter(p => p.id !== parentId));
    }, []);

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
        }
    }, []);

    const addCustomGoal = useCallback(() => {
        if (customGoalInput.trim()) {
            setCustomGoals([customGoalInput.trim()]);
            setCustomGoalInput('');
            setShowCustomInput(false);
        }
    }, [customGoalInput]);

    const removeCustomGoal = useCallback((goal: string) => {
        setCustomGoals(customGoals.filter(g => g !== goal));
        setSelectedGoals(selectedGoals.filter(g => g !== 'Others'));
    }, [customGoals, selectedGoals]);

    const toggleGoal = useCallback((goal: string) => {
        if (goal === t('onboarding.others')) {
            setShowCustomInput(!showCustomInput);
            if (!selectedGoals.includes(t('onboarding.others'))) {
                setSelectedGoals([...selectedGoals, t('onboarding.others')]);
            } else {
                setSelectedGoals(selectedGoals.filter(g => g !== t('onboarding.others')));
                setCustomGoals([]);
            }
        } else {
            if (selectedGoals.includes(goal)) {
                setSelectedGoals(selectedGoals.filter(g => g !== goal));
            } else {
                if (selectedGoals.length < 3) {
                    setSelectedGoals([...selectedGoals, goal]);
                } else {
                    toast.error(t('onboarding.limitReached'), t('onboarding.maxGoals'));
                }
            }
        }
    }, [selectedGoals, showCustomInput, toast, t]);

    const handleComplete = async () => {
        if (selectedGoals.length === 0) {
            toast.error(t('onboarding.required'), t('onboarding.selectGoal'));
            return;
        }

        const finalGoals = [...selectedGoals.filter(g => g !== t('onboarding.others')), ...customGoals];
        const parentIds = selectedParents.length > 0 ? selectedParents.map(p => p.id) : undefined;

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

            if (response.success && response.user) {
                useAuthStore.getState().updateUser(response.user);
            }

            await completeOnboarding();
            useOnboardingStore.getState().resetForm();

            setStep3Data({
                goals: finalGoals,
                parentIds: parentIds,
                newsletterEnabled: newsletter,
            });

            toast.success(t('onboarding.success'), t('onboarding.profileSetupComplete'));
            router.replace('/home' as Href);
        } catch (err: any) {
            console.error('Onboarding submission error:', err);
            toast.error(t('onboarding.submissionFailed'), err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar 
                barStyle={isDark ? 'light-content' : 'dark-content'} 
                backgroundColor={theme.background} 
            />

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
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('onboarding.almostDone')}</Text>
                    <Text style={[styles.subtitle, { color: theme.gray[500] }]}>
                        {t('onboarding.customizeExperience')}
                    </Text>
                </View>

                {/* Parent Search Section */}
                <ParentSearchSection
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    searchResults={searchResults}
                    selectedParents={selectedParents}
                    isSearching={isSearching}
                    onSelectParent={handleSelectParent}
                    onRemoveParent={handleRemoveParent}
                />

                {/* Goals Section */}
                <GoalsSection
                    goals={GOALS}
                    selectedGoals={selectedGoals}
                    customGoals={customGoals}
                    customGoalInput={customGoalInput}
                    showCustomInput={showCustomInput}
                    onToggleGoal={toggleGoal}
                    onRemoveCustomGoal={removeCustomGoal}
                    onCustomGoalInputChange={setCustomGoalInput}
                    onAddCustomGoal={addCustomGoal}
                />

                {/* Preferences Section */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('onboarding.preferences')}</Text>

                    <PreferenceToggle
                        title={t('onboarding.pushNotifications')}
                        description={t('onboarding.pushNotificationsDesc')}
                        value={notifications}
                        onToggle={() => setNotifications(!notifications)}
                    />

                    <PreferenceToggle
                        title={t('onboarding.newsletter')}
                        description={t('onboarding.newsletterDesc')}
                        value={newsletter}
                        onToggle={() => setNewsletter(!newsletter)}
                    />
                </View>

                {/* Complete Button */}
                <TouchableOpacity
                    style={[styles.completeButton, { backgroundColor: theme.primary }]}
                    onPress={handleComplete}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.completeButtonText}>{t('onboarding.completeSetup')}</Text>
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    sectionContainer: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        marginBottom: 6,
    },
    completeButton: {
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
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
