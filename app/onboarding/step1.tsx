import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { useToast } from '@/components/toast';
import { useOnboardingStore } from '@/libs/onboarding';
import { useThemeStore } from '@/libs/theme';
import { useAuthStore } from '@/libs/auth';
import { deleteProfileImage } from '@/services/AuthService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
    ProfileImagePicker,
    SelectInput,
    DatePickerSheet,
    OptionPickerSheet,
    CountryPickerSheet,
    ImageOptionsSheet,
} from '@/components/onboarding';

const LANGUAGES = [
    { id: 'en', label: 'English' },
    { id: 'ar', label: 'العربية' },
    { id: 'es', label: 'Español' },
    { id: 'fr', label: 'Français' },
    { id: 'de', label: 'Deutsch' },
    { id: 'zh', label: '中文' },
    { id: 'ja', label: '日本語' },
    { id: 'ko', label: '한국어' },
    { id: 'pt', label: 'Português' },
    { id: 'ru', label: 'Русский' },
];

const THEMES = [
    { id: 'light', label: 'Light', icon: 'sunny-outline' as const },
    { id: 'dark', label: 'Dark', icon: 'moon-outline' as const },
    { id: 'system', label: 'System', icon: 'settings-outline' as const },
];

const GENDERS = [
    { id: 'MALE', label: 'Male' },
    { id: 'FEMALE', label: 'Female' },
    { id: 'OTHER', label: 'Other' },
    { id: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export default function OnboardingStep1() {
    const router = useRouter();
    const toast = useToast();
    const systemColorScheme = useColorScheme();
    const { themeMode, setThemeMode } = useThemeStore();
    const { user } = useAuthStore();
    const { formData, setStep1Data } = useOnboardingStore();

    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';

    // Form state
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
        formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
    );
    const [profileImg, setProfileImg] = useState<string>(
        formData.profileImg || user?.profileImg || ''
    );
    const [gender, setGender] = useState<string>(formData.gender || '');
    const [country, setCountry] = useState<string>(formData.country || '');
    const [language, setLanguage] = useState<string>(
        formData.preferences?.language || 'en'
    );
    const [selectedTheme, setSelectedTheme] = useState<string>(
        formData.preferences?.themePreference || themeMode
    );

    // Modal state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showImageOptions, setShowImageOptions] = useState(false);
    
    // Loading state
    const [isImgLoading, setIsImgLoading] = useState(false);
    const [datePickerReady, setDatePickerReady] = useState(false);

    useEffect(() => {
        if (user?.profileImg && !profileImg) {
            setProfileImg(user.profileImg);
        }
    }, [user?.profileImg]);

    useEffect(() => {
        if (showDatePicker && !datePickerReady) {
            const timer = setTimeout(() => setDatePickerReady(true), 100);
            return () => clearTimeout(timer);
        }
    }, [showDatePicker, datePickerReady]);

    const processImage = async (uri: string) => {
        try {
            setIsImgLoading(true);
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 400, height: 400 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            if (!manipResult.base64) {
                throw new Error('Failed to convert image to base64');
            }

            setProfileImg(`data:image/jpeg;base64,${manipResult.base64}`);
            toast.success('Success', 'Profile image selected');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to process image');
        } finally {
            setIsImgLoading(false);
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
                await processImage(result.assets[0].uri);
            }
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to take photo');
        }
    };

    const handlePickImage = async () => {
        setShowImageOptions(false);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                toast.error('Permission Denied', 'We need camera roll permissions');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                await processImage(result.assets[0].uri);
            }
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to pick image');
        }
    };

    const handleDeleteImage = async () => {
        try {
            setShowImageOptions(false);
            setIsImgLoading(true);
            const result = await deleteProfileImage();
            if (result.success) {
                setProfileImg('');
                toast.success('Deleted', 'Profile image removed');
            }
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to delete image');
        } finally {
            setIsImgLoading(false);
        }
    };

    const getDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month, 0).getDate();
    };

    const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
        let newDate = dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1);

        if (type === 'day') {
            newDate.setDate(value);
        } else if (type === 'month') {
            newDate.setMonth(value - 1);
            const daysInMonth = getDaysInMonth(value, newDate.getFullYear());
            if (newDate.getDate() > daysInMonth) newDate.setDate(daysInMonth);
        } else if (type === 'year') {
            newDate.setFullYear(value);
            const daysInMonth = getDaysInMonth(newDate.getMonth() + 1, value);
            if (newDate.getDate() > daysInMonth) newDate.setDate(daysInMonth);
        }

        if (newDate > new Date()) newDate = new Date();
        setDateOfBirth(newDate);
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}/${date.getFullYear()}`;
    };

    const handleContinue = () => {
        if (!dateOfBirth) {
            toast.error('Required', 'Please select your date of birth');
            return;
        }
        if (!gender) {
            toast.error('Required', 'Please select your gender');
            return;
        }
        if (!country) {
            toast.error('Required', 'Please select your country');
            return;
        }

        setStep1Data({
            dateOfBirth: dateOfBirth.toISOString(),
            gender: gender as 'MALE' | 'FEMALE' | 'OTHER',
            country,
            profileImg: profileImg || undefined,
            preferences: {
                language,
                themePreference: selectedTheme === 'system' ? 'light' : selectedTheme as 'light' | 'dark',
                notifications: true,
            }
        });

        router.push('/onboarding/step2');
    };

    const handleThemeSelect = (themeId: string) => {
        setSelectedTheme(themeId);
        setThemeMode(themeId as 'light' | 'dark' | 'system');
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>

                <ProfileImagePicker
                    profileImg={profileImg}
                    isLoading={isImgLoading}
                    onPress={() => setShowImageOptions(true)}
                />

                <SelectInput
                    label="Date Of Birth"
                    value={formatDate(dateOfBirth)}
                    placeholder="Select your date of birth"
                    onPress={() => setShowDatePicker(true)}
                    icon="calendar-outline"
                />

                <SelectInput
                    label="Select Gender"
                    value={GENDERS.find(g => g.id === gender)?.label || ''}
                    placeholder="Select Gender"
                    onPress={() => setShowGenderPicker(true)}
                />

                <SelectInput
                    label="Country"
                    value={country}
                    placeholder="Select Country"
                    onPress={() => setShowCountryPicker(true)}
                />

                <SelectInput
                    label="Language"
                    value={LANGUAGES.find(l => l.id === language)?.label || ''}
                    placeholder="Select Language"
                    onPress={() => setShowLanguagePicker(true)}
                />

                <SelectInput
                    label="Theme"
                    value={THEMES.find(t => t.id === selectedTheme)?.label || ''}
                    placeholder="Select Theme"
                    onPress={() => setShowThemePicker(true)}
                />

                <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: theme.primary }]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.continueButtonText, { fontFamily: Fonts?.semiBold }]}>
                        Continue
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <DatePickerSheet
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                dateOfBirth={dateOfBirth}
                onDateChange={handleDateChange}
                onDone={() => {
                    if (dateOfBirth) setShowDatePicker(false);
                    else toast.warning('Select Date', 'Please select a date');
                }}
                isReady={datePickerReady}
            />

            <OptionPickerSheet
                visible={showGenderPicker}
                onClose={() => setShowGenderPicker(false)}
                title="Select Gender"
                options={GENDERS}
                selectedValue={gender}
                onSelect={setGender}
            />

            <CountryPickerSheet
                visible={showCountryPicker}
                onClose={() => setShowCountryPicker(false)}
                selectedCountry={country}
                onSelect={setCountry}
            />

            <OptionPickerSheet
                visible={showLanguagePicker}
                onClose={() => setShowLanguagePicker(false)}
                title="Select Language"
                options={LANGUAGES}
                selectedValue={language}
                onSelect={setLanguage}
                height={500}
            />

            <OptionPickerSheet
                visible={showThemePicker}
                onClose={() => setShowThemePicker(false)}
                title="Select Theme"
                options={THEMES}
                selectedValue={selectedTheme}
                onSelect={handleThemeSelect}
            />

            <ImageOptionsSheet
                visible={showImageOptions}
                onClose={() => setShowImageOptions(false)}
                hasImage={!!profileImg}
                onTakePhoto={handleTakePhoto}
                onPickImage={handlePickImage}
                onDeleteImage={handleDeleteImage}
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
    continueButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
});
