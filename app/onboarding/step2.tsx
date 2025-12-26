import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/toast';
import { useOnboardingStore } from '@/libs/onboarding';
import {
    InterestsGrid,
    BioInput,
    RoleSelector,
    RolePickerModal,
    RoleOption,
} from '@/components/onboarding';

const INTERESTS = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'Artificial Intelligence', 'Cloud Computing', 'DevOps', 'Cybersecurity',
    'Blockchain', 'Game Development', 'UI/UX Design', 'Digital Marketing',
    'Business', 'Finance', 'Photography', 'Music Production', 'Writing',
    'Language Learning', 'Fitness', 'Nutrition', 'Psychology', 'Philosophy',
];

const ROLES: RoleOption[] = [
    { id: 'student', label: 'Student', description: 'Learning and growing' },
    { id: 'teacher', label: 'Teacher', description: 'Educating others' },
    { id: 'parent', label: 'Parent', description: 'Supporting learning' },
    { id: 'instructor', label: 'Instructor', description: 'Teaching specific skills' },
    { id: 'assistant', label: 'Assistant', description: 'Helping teachers and instructors' },
];

export default function OnboardingStep2() {
    const router = useRouter();
    const toast = useToast();
    const { theme, isDark } = useTheme();
    const { formData, setStep2Data } = useOnboardingStore();

    const [selectedInterests, setSelectedInterests] = useState<string[]>(
        formData.interests || []
    );
    const [selectedRole, setSelectedRole] = useState<string>(
        formData.role?.toLowerCase() || ''
    );
    const [bio, setBio] = useState<string>(formData.bio || '');
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
        if (bio.length > 0 && bio.length < 10) {
            toast.error('Short Bio', 'Bio should be at least 10 characters if provided');
            return;
        }

        let mappedRole: 'STUDENT' | 'TEACHER' | 'PARENT' = 'STUDENT';
        const roleLower = selectedRole.toLowerCase();
        if (roleLower === 'teacher' || roleLower === 'instructor' || roleLower === 'assistant') {
            mappedRole = 'TEACHER';
        } else if (roleLower === 'parent') {
            mappedRole = 'PARENT';
        }

        setStep2Data({
            role: mappedRole,
            interests: selectedInterests,
            bio: bio || undefined,
        });

        router.push('/onboarding/step3' as Href);
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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>

                <View style={styles.headerContainer}>
                    <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.bold }]}>
                        Tell us about yourself
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.gray[500], fontFamily: Fonts.regular }]}>
                        This helps us personalize your experience
                    </Text>
                </View>

                <InterestsGrid
                    interests={INTERESTS}
                    selectedInterests={selectedInterests}
                    onToggleInterest={toggleInterest}
                />

                <RoleSelector
                    roles={ROLES}
                    selectedRole={selectedRole}
                    onPress={() => setShowRolePicker(true)}
                />

                <BioInput
                    value={bio}
                    onChangeText={setBio}
                />

                <TouchableOpacity
                    style={[styles.continueButton, { 
                        backgroundColor: theme.primary,
                        shadowColor: theme.primary,
                    }]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.continueButtonText, { fontFamily: Fonts.semiBold }]}>
                        Continue
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <RolePickerModal
                visible={showRolePicker}
                onClose={() => setShowRolePicker(false)}
                roles={ROLES}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
            />
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    continueButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
});
