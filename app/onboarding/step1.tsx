import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
    ActivityIndicator,
    DevSettings,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { Colors, Fonts } from '@/constants/theme';
import { useToast } from '@/components/toast';
import { useOnboardingStore } from '@/libs/onboarding';
import { useThemeStore } from '@/libs/theme';
import { useAuthStore } from '@/libs/auth';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/libs/language';
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

// Country key to translation key mapping
const COUNTRY_TRANSLATION_MAP: Record<string, string> = {
    'United States': 'countries.unitedStates',
    'United Kingdom': 'countries.unitedKingdom',
    'Canada': 'countries.canada',
    'Australia': 'countries.australia',
    'Germany': 'countries.germany',
    'France': 'countries.france',
    'Italy': 'countries.italy',
    'Spain': 'countries.spain',
    'Netherlands': 'countries.netherlands',
    'Belgium': 'countries.belgium',
    'Switzerland': 'countries.switzerland',
    'Austria': 'countries.austria',
    'Sweden': 'countries.sweden',
    'Norway': 'countries.norway',
    'Denmark': 'countries.denmark',
    'Finland': 'countries.finland',
    'Poland': 'countries.poland',
    'Portugal': 'countries.portugal',
    'Greece': 'countries.greece',
    'Ireland': 'countries.ireland',
    'Czech Republic': 'countries.czechRepublic',
    'Romania': 'countries.romania',
    'Hungary': 'countries.hungary',
    'Egypt': 'countries.egypt',
    'Saudi Arabia': 'countries.saudiArabia',
    'UAE': 'countries.uae',
    'Kuwait': 'countries.kuwait',
    'Qatar': 'countries.qatar',
    'Jordan': 'countries.jordan',
    'Lebanon': 'countries.lebanon',
    'Morocco': 'countries.morocco',
    'Tunisia': 'countries.tunisia',
    'Algeria': 'countries.algeria',
    'South Africa': 'countries.southAfrica',
    'Nigeria': 'countries.nigeria',
    'Kenya': 'countries.kenya',
    'India': 'countries.india',
    'China': 'countries.china',
    'Japan': 'countries.japan',
    'South Korea': 'countries.southKorea',
    'Singapore': 'countries.singapore',
    'Malaysia': 'countries.malaysia',
    'Thailand': 'countries.thailand',
    'Indonesia': 'countries.indonesia',
    'Philippines': 'countries.philippines',
    'Vietnam': 'countries.vietnam',
    'Brazil': 'countries.brazil',
    'Mexico': 'countries.mexico',
    'Argentina': 'countries.argentina',
    'Chile': 'countries.chile',
    'Colombia': 'countries.colombia',
    'Peru': 'countries.peru',
    'Turkey': 'countries.turkey',
    'Russia': 'countries.russia',
};

const LANGUAGES = [
    { id: 'system', translationKey: 'languages.system', nativeLabel: 'System' },
    { id: 'en', translationKey: 'languages.english', nativeLabel: 'English' },
    { id: 'ar', translationKey: 'languages.arabic', nativeLabel: 'العربية' },
];

export default function OnboardingStep1() {
    const router = useRouter();
    const toast = useToast();
    const { t, locale, setLanguage: setAppLanguage } = useTranslation();
    const isArabic = locale === 'ar';
    const systemColorScheme = useColorScheme();
    const { themeMode, setThemeMode } = useThemeStore();
    const { user } = useAuthStore();
    const { formData, setStep1Data } = useOnboardingStore();

    // Check if this is first time (no dateOfBirth means user hasn't completed step1 before)
    const isFirstTime = !formData.dateOfBirth;

    // Convert Western numerals to Arabic-Indic numerals
    const toArabicNumerals = (num: number | string): string => {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
    };

    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';

    const GENDERS = [
        { id: 'MALE', label: t('onboarding.male') },
        { id: 'FEMALE', label: t('onboarding.female') },
        { id: 'OTHER', label: t('onboarding.other') },
        { id: 'PREFER_NOT_TO_SAY', label: t('onboarding.preferNotToSay') },
    ];

    const THEMES = [
        { id: 'light', label: t('onboarding.themeLight'), icon: 'sunny-outline' as const },
        { id: 'dark', label: t('onboarding.themeDark'), icon: 'moon-outline' as const },
        { id: 'system', label: t('onboarding.themeSystem'), icon: 'settings-outline' as const },
    ];

    // Get initial language - default to 'system' for first time users
    const getInitialLanguage = (): 'system' | 'en' | 'ar' => {
        if (!isFirstTime && formData.preferences?.language) {
            return formData.preferences.language as 'system' | 'en' | 'ar';
        }
        // First time: default to 'system' to follow device language
        return 'system';
    };

    // Get initial theme - use 'system' if first time to follow device theme
    const getInitialTheme = (): 'system' | 'light' | 'dark' => {
        if (!isFirstTime && formData.preferences?.themePreference) {
            return formData.preferences.themePreference as 'system' | 'light' | 'dark';
        }
        // First time: default to 'system' to follow device theme
        return 'system';
    };

    // Form state
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
        formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
    );
    const [profileImg, setProfileImg] = useState<string>(
        formData.profileImg || user?.profileImg || ''
    );
    const [gender, setGender] = useState<string>(formData.gender || '');
    const [country, setCountry] = useState<string>(formData.country || '');
    const [language, setLanguage] = useState<'system' | 'en' | 'ar'>(getInitialLanguage);
    const [selectedTheme, setSelectedTheme] = useState<'system' | 'light' | 'dark'>(getInitialTheme);

    // Sync theme mode on mount for first-time users
    useEffect(() => {
        if (isFirstTime && themeMode !== 'system') {
            setThemeMode('system');
        }
    }, []);

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
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);

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
            toast.success(t('onboarding.success'), t('onboarding.profileImageSelected'));
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
                toast.error(t('onboarding.permissionDenied'), t('onboarding.cameraPermission'));
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
                toast.error(t('onboarding.permissionDenied'), t('onboarding.galleryPermission'));
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
                toast.success(t('onboarding.deleted'), t('onboarding.profileImageRemoved'));
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
        const year = date.getFullYear().toString();
        const formattedDate = `${day}/${month}/${year}`;
        return isArabic ? toArabicNumerals(formattedDate) : formattedDate;
    };

    const handleContinue = () => {
        if (!dateOfBirth) {
            toast.error(t('onboarding.required'), t('onboarding.selectDob'));
            return;
        }
        if (!gender) {
            toast.error(t('onboarding.required'), t('onboarding.selectGenderRequired'));
            return;
        }
        if (!country) {
            toast.error(t('onboarding.required'), t('onboarding.selectCountryRequired'));
            return;
        }

        const step1Data = {
            dateOfBirth: dateOfBirth.toISOString(),
            gender: gender as 'MALE' | 'FEMALE' | 'OTHER',
            country,
            profileImg: profileImg || undefined,
            preferences: {
                language,
                themePreference: selectedTheme,
                notifications: true,
            }
        };

        setStep1Data(step1Data);

        router.push('/onboarding/step2');
    };

    const handleThemeSelect = (themeId: string) => {
        setSelectedTheme(themeId as 'system' | 'light' | 'dark');
        setThemeMode(themeId as 'light' | 'dark' | 'system');
    };

    // Handle language selection - apply immediately so user sees UI in their language
    const handleLanguageSelect = async (langId: string) => {
        // Persist current step 1 inputs before reloading so they are not lost
        setStep1Data({
            dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
            gender: gender as any,
            country: country || undefined,
            profileImg: profileImg || undefined,
            preferences: {
                language: langId as any,
                themePreference: selectedTheme,
                notifications: true,
            }
        });

        setLanguage(langId as 'system' | 'en' | 'ar');
        setShowLanguagePicker(false);
        
        const needsRestart = await setAppLanguage(langId);
        if (needsRestart) {
            setIsChangingLanguage(true);
            setTimeout(async () => {
                try {
                    if (__DEV__) {
                        DevSettings.reload();
                    } else {
                        await Updates.reloadAsync();
                    }
                } catch (e) {
                    setIsChangingLanguage(false);
                    toast.info(
                        langId === 'ar' ? 'إعادة التشغيل مطلوبة' : 'Restart Required',
                        langId === 'ar' 
                            ? 'يرجى إعادة تشغيل التطبيق يدوياً'
                            : 'Please manually restart the app'
                    );
                }
            }, 500);
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                </TouchableOpacity>

                <ProfileImagePicker
                    profileImg={profileImg}
                    isLoading={isImgLoading}
                    onPress={() => setShowImageOptions(true)}
                />

                <SelectInput
                    label={t('onboarding.dateOfBirth')}
                    value={formatDate(dateOfBirth)}
                    placeholder={t('onboarding.selectDateOfBirth')}
                    onPress={() => setShowDatePicker(true)}
                    icon="calendar-outline"
                />

                <SelectInput
                    label={t('onboarding.selectGender')}
                    value={GENDERS.find(g => g.id === gender)?.label || ''}
                    placeholder={t('onboarding.selectGender')}
                    onPress={() => setShowGenderPicker(true)}
                />

                <SelectInput
                    label={t('onboarding.country')}
                    value={country ? t(COUNTRY_TRANSLATION_MAP[country] || country) : ''}
                    placeholder={t('onboarding.selectCountry')}
                    onPress={() => setShowCountryPicker(true)}
                />

                <SelectInput
                    label={t('onboarding.language')}
                    value={(() => {
                        const lang = LANGUAGES.find(l => l.id === language);
                        return lang ? t(lang.translationKey) : '';
                    })()}
                    placeholder={t('onboarding.selectLanguage')}
                    onPress={() => setShowLanguagePicker(true)}
                />

                <SelectInput
                    label={t('onboarding.theme')}
                    value={THEMES.find(t => t.id === selectedTheme)?.label || ''}
                    placeholder={t('onboarding.selectTheme')}
                    onPress={() => setShowThemePicker(true)}
                />

                <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: theme.primary }]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.continueButtonText, { fontFamily: Fonts?.semiBold }]}>
                        {t('onboarding.continue')}
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
                    else toast.warning(t('onboarding.selectDate'), t('onboarding.pleaseSelectDate'));
                }}
                isReady={datePickerReady}
            />

            <OptionPickerSheet
                visible={showGenderPicker}
                onClose={() => setShowGenderPicker(false)}
                title={t('onboarding.selectGender')}
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
                title={t('onboarding.selectLanguage')}
                options={LANGUAGES.map(lang => ({ id: lang.id, label: t(lang.translationKey) }))}
                selectedValue={language}
                onSelect={handleLanguageSelect}
                height={500}
            />

            <OptionPickerSheet
                visible={showThemePicker}
                onClose={() => setShowThemePicker(false)}
                title={t('onboarding.selectTheme')}
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

            {isChangingLanguage && (
                <View style={styles.languageOverlay}>
                    <View style={[styles.languageOverlayContent, { backgroundColor: theme.surface }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.languageOverlayText, { color: theme.text }]}>
                            {locale === 'ar' ? 'جاري تغيير اللغة...' : 'Changing language...'}
                        </Text>
                    </View>
                </View>
            )}
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
    languageOverlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 9999,
    },
    languageOverlayContent: { 
        padding: 32, 
        borderRadius: 16, 
        alignItems: 'center',
        gap: 16,
    },
    languageOverlayText: { 
        fontSize: 16, 
        fontFamily: Fonts.medium,
    },
});
