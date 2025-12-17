import { useToast } from '@/components/toast';
import { Colors, Fonts, cskColors, grayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
} from 'react-native';

const { width } = Dimensions.get('window');

// Mock user data for parent search
const MOCK_USERS = [
    { id: '1', username: 'john_doe', name: 'John Doe', avatar: 'https://picsum.photos/seed/john/50/50.jpg' },
    { id: '2', username: 'jane_smith', name: 'Jane Smith', avatar: 'https://picsum.photos/seed/jane/50/50.jpg' },
    { id: '3', username: 'mike_wilson', name: 'Mike Wilson', avatar: 'https://picsum.photos/seed/mike/50/50.jpg' },
    { id: '4', username: 'sarah_jones', name: 'Sarah Jones', avatar: 'https://picsum.photos/seed/sarah/50/50.jpg' },
    { id: '5', username: 'david_brown', name: 'David Brown', avatar: 'https://picsum.photos/seed/david/50/50.jpg' },
];

const GOALS = [
    'Career Advancement', 'Personal Growth', 'Skill Development', 'Hobby',
    'Start a Business', 'Get Certified', 'Teach Others', 'Stay Updated', 'Others',
];

const LANGUAGES = [
    { id: 'english', label: 'English' },
    { id: 'arabic', label: 'Arabic' },
];

const THEMES = [
    { id: 'light', label: 'Light', icon: 'sunny-outline' },
    { id: 'dark', label: 'Dark', icon: 'moon-outline' },
    { id: 'system', label: 'System', icon: 'settings-outline' },
];

export default function OnboardingStep3() {
    const router = useRouter();
    const toast = useToast();
    
    const [parentEmail, setParentEmail] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<typeof MOCK_USERS>([]);
    const [selectedParent, setSelectedParent] = useState<typeof MOCK_USERS[0] | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
    const [selectedTheme, setSelectedTheme] = useState<string>('system');
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [customGoals, setCustomGoals] = useState<string[]>([]);
    const [customGoalInput, setCustomGoalInput] = useState<string>('');
    const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<boolean>(true);
    const [newsletter, setNewsletter] = useState<boolean>(false);


    // Search functionality with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                const filtered = MOCK_USERS.filter(
                    user => 
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.username.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setSearchResults(filtered);
            } else {
                setSearchResults([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSendRequest = useCallback((parent: typeof MOCK_USERS[0]) => {
        toast.success('Request Sent', `Invitation sent to ${parent.name}`);
        setSelectedParent(parent);
        setSearchQuery('');
        setSearchResults([]);
    }, [toast]);

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
            // Toggle the Others selection and show/hide custom input
            if (selectedGoals.includes('Others')) {
                setSelectedGoals(selectedGoals.filter(g => g !== 'Others'));
                setShowCustomInput(false);
            } else {
                if (selectedGoals.length < 3) {
                    setSelectedGoals([...selectedGoals, 'Others']);
                    setShowCustomInput(true);
                } else {
                    toast.error('Limit Reached', 'You can select up to 3 goals');
                }
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

    const handleComplete = () => {
        if (!selectedParent) {
            toast.error('Required', 'Please search and select a parent');
            return;
        }
        if (selectedGoals.length === 0) {
            toast.error('Required', 'Please select at least one goal');
            return;
        }

        // Store all onboarding data locally (you can use AsyncStorage or context provider)
        // For now, just navigate to home page
        router.replace('/');
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
                    </View>
                    
                    {/* Selected Parent Display */}
                    {selectedParent && (
                        <View style={styles.selectedParentContainer}>
                            <Text style={styles.selectedParentLabel}>Selected Parent:</Text>
                            <View style={styles.selectedParentInfo}>
                                <Image source={{ uri: selectedParent.avatar }} style={styles.selectedParentAvatar} />
                                <View style={styles.selectedParentDetails}>
                                    <Text style={styles.selectedParentName}>{selectedParent.name}</Text>
                                    <Text style={styles.selectedParentUsername}>@{selectedParent.username}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.removeButton}
                                    onPress={() => setSelectedParent(null)}
                                >
                                    <Ionicons name="close" size={20} color={grayColors[500]} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <View style={styles.searchResultsContainer}>
                            {searchResults.map((user) => (
                                <View key={user.id} style={styles.searchResultItem}>
                                    <Image source={{ uri: user.avatar }} style={styles.resultAvatar} />
                                    <View style={styles.resultDetails}>
                                        <Text style={styles.resultName}>{user.name}</Text>
                                        <Text style={styles.resultUsername}>@{user.username}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.requestButton}
                                        onPress={() => handleSendRequest(user)}
                                    >
                                        <Ionicons name="person-add" size={16} color="#FFFFFF" />
                                        <Text style={styles.requestButtonText}>Send</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
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
                    
                    {/* Language */}
                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceItemTitle}>Language</Text>
                            <Text style={styles.preferenceItemDescription}>Choose your preferred language</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.preferenceInput}
                            onPress={() => setShowLanguagePicker(true)}
                        >
                            <Text style={[styles.preferenceInputText, !selectedLanguage && styles.placeholder]}>
                                {selectedLanguage ? LANGUAGES.find(l => l.id === selectedLanguage)?.label : 'Select language'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Theme */}
                    <View style={styles.preferenceItem}>
                        <View style={styles.preferenceInfo}>
                            <Text style={styles.preferenceItemTitle}>Theme</Text>
                            <Text style={styles.preferenceItemDescription}>Choose your app theme</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.preferenceInput}
                            onPress={() => setShowThemePicker(true)}
                        >
                            <Text style={[styles.preferenceInputText, !selectedTheme && styles.placeholder]}>
                                {selectedTheme ? THEMES.find(t => t.id === selectedTheme)?.label : 'Select theme'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>
                    
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
                >
                    <Text style={styles.completeButtonText}>Complete Setup</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={showLanguagePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLanguagePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Language</Text>
                            <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedLanguage('english');
                                setShowLanguagePicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>English</Text>
                            {selectedLanguage === 'english' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedLanguage('arabic');
                                setShowLanguagePicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>Arabic</Text>
                            {selectedLanguage === 'arabic' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showThemePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowThemePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Theme</Text>
                            <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedTheme('light');
                                setShowThemePicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>Light</Text>
                            {selectedTheme === 'light' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedTheme('dark');
                                setShowThemePicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>Dark</Text>
                            {selectedTheme === 'dark' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setSelectedTheme('system');
                                setShowThemePicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>System</Text>
                            {selectedTheme === 'system' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    selectedParentContainer: {
        backgroundColor: grayColors[50],
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    selectedParentLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: grayColors[500],
        marginBottom: 8,
    },
    selectedParentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
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
