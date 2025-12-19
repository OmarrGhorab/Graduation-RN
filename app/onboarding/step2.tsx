import { useToast } from '@/components/toast';
import { Colors, Fonts, cskColors, grayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import React, { useState } from 'react';
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
import { useOnboardingStore } from '@/libs/onboarding';

const { width } = Dimensions.get('window');

const INTERESTS = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'Artificial Intelligence', 'Cloud Computing', 'DevOps', 'Cybersecurity',
    'Blockchain', 'Game Development', 'UI/UX Design', 'Digital Marketing',
    'Business', 'Finance', 'Photography', 'Music Production', 'Writing',
    'Language Learning', 'Fitness', 'Nutrition', 'Psychology', 'Philosophy',
];

const ROLES = [
    { id: 'student', label: 'Student', description: 'Learning and growing' },
    { id: 'teacher', label: 'Teacher', description: 'Educating others' },
    { id: 'parent', label: 'Parent', description: 'Supporting learning' },
    { id: 'instructor', label: 'Instructor', description: 'Teaching specific skills' },
    { id: 'assistant', label: 'Assistant', description: 'Helping teachers and instractors' },
];

export default function OnboardingStep2() {
    const router = useRouter();
    const toast = useToast();

    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [bio, setBio] = useState<string>('');
    const [showRolePicker, setShowRolePicker] = useState(false);


    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            if (selectedInterests.length < 5) {
                setSelectedInterests([...selectedInterests, interest]);
            } else {
                toast.error('Limit Reached', 'You can select up to 5 interests');
            }
        }
    };

    const handleContinue = () => {
        if (selectedInterests.length === 0) {
            toast.error('Required', 'Please select at least one interest');
            return;
        }
        if (!selectedRole) {
            toast.error('Required', 'Please select your role');
            return;
        }

        // Bio is now optional
        if (bio.length > 0 && bio.length < 10) {
            toast.error('Short Bio', 'Bio should be at least 10 characters if provided');
            return;
        }

        // Map UI roles to backend enum
        let mappedRole: 'STUDENT' | 'TEACHER' | 'PARENT' = 'STUDENT';
        const roleLower = selectedRole.toLowerCase();
        if (roleLower === 'teacher' || roleLower === 'instructor' || roleLower === 'assistant') {
            mappedRole = 'TEACHER';
        } else if (roleLower === 'parent') {
            mappedRole = 'PARENT';
        }

        // Save data to store
        useOnboardingStore.getState().setStep2Data({
            role: mappedRole,
            interests: selectedInterests,
            bio: bio || undefined,
        });

        router.push('/onboarding/step3' as Href);
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
                    <Text style={styles.title}>Tell us about yourself</Text>
                    <Text style={styles.subtitle}>This helps us personalize your experience</Text>
                </View>

                {/* Interests Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Select Your Interests</Text>
                    <Text style={styles.sectionSubtitle}>Choose up to 5 topics you're interested in</Text>

                    <View style={styles.interestsGrid}>
                        {INTERESTS.map((interest) => (
                            <TouchableOpacity
                                key={interest}
                                style={[
                                    styles.interestChip,
                                    selectedInterests.includes(interest) && styles.interestChipSelected,
                                ]}
                                onPress={() => toggleInterest(interest)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.interestChipText,
                                    selectedInterests.includes(interest) && styles.interestChipTextSelected,
                                ]}>
                                    {interest}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Role Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Select Your Role</Text>
                    <Text style={styles.sectionSubtitle}>Choose the role that best describes you</Text>

                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowRolePicker(true)}
                    >
                        <Text style={[styles.inputText, !selectedRole && styles.placeholder]}>
                            {selectedRole ? ROLES.find(r => r.id === selectedRole)?.label : 'Select role'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={Colors.light.text} />
                    </TouchableOpacity>
                </View>

                {/* Bio Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Bio (Optional)</Text>
                    <Text style={styles.sectionSubtitle}>Tell us a little about yourself</Text>

                    <TextInput
                        style={styles.bioInput}
                        placeholder="Share something about yourself..."
                        placeholderTextColor={grayColors[500]}
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={4}
                        maxLength={200}
                        textAlignVertical="top"
                    />
                    <Text style={styles.characterCount}>{bio.length}/200</Text>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Role Picker Modal */}
            <Modal
                visible={showRolePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowRolePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Role</Text>
                            <TouchableOpacity onPress={() => setShowRolePicker(false)}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>
                        {ROLES.map((role) => (
                            <TouchableOpacity
                                key={role.id}
                                style={styles.modalOption}
                                onPress={() => {
                                    setSelectedRole(role.id);
                                    setShowRolePicker(false);
                                }}
                            >
                                <View style={styles.roleOptionContent}>
                                    <Text style={styles.modalOptionText}>{role.label}</Text>
                                    <Text style={styles.roleOptionDescription}>{role.description}</Text>
                                </View>
                                {selectedRole === role.id && (
                                    <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                                )}
                            </TouchableOpacity>
                        ))}
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
    interestsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    interestChip: {
        backgroundColor: grayColors[50],
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 6,
        marginBottom: 12,
    },
    interestChipSelected: {
        backgroundColor: cskColors[500],
        borderColor: cskColors[500],
    },
    interestChipText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.light.text,
    },
    interestChipTextSelected: {
        color: '#FFFFFF',
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
        flex: 1,
    },
    placeholder: {
        color: grayColors[500],
    },
    bioInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
        minHeight: 100,
    },
    characterCount: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        textAlign: 'right',
        marginTop: 4,
    },
    continueButton: {
        backgroundColor: cskColors[500],
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: cskColors[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
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
        paddingTop: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    modalOptionText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    roleOptionContent: {
        flex: 1,
    },
    roleOptionDescription: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 2,
    },
});
