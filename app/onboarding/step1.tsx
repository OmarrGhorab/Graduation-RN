import { useToast } from '@/components/toast';
import { Colors, Fonts, cskColors, grayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
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
    TouchableWithoutFeedback,
    FlatList,
} from 'react-native';
import { useOnboardingStore } from '@/libs/onboarding';
import { useThemeStore } from '@/libs/theme';
import { useAuthStore } from '@/libs/auth';
import { useColorScheme } from 'react-native';
import { deleteProfileImage } from '@/services/AuthService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import BottomSheetModal from '@/components/BottomSheetModal';
const { width } = Dimensions.get('window');

const COUNTRIES = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Portugal',
    'Greece', 'Ireland', 'Czech Republic', 'Romania', 'Hungary', 'Egypt',
    'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Jordan', 'Lebanon',
    'Morocco', 'Tunisia', 'Algeria', 'South Africa', 'Nigeria', 'Kenya',
    'India', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia',
    'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'Brazil', 'Mexico',
    'Argentina', 'Chile', 'Colombia', 'Peru', 'Turkey', 'Russia',
];

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
    { id: 'light', label: 'Light', icon: 'sunny-outline' },
    { id: 'dark', label: 'Dark', icon: 'moon-outline' },
    { id: 'system', label: 'System', icon: 'settings-outline' },
];

export default function OnboardingStep1() {
    const router = useRouter();
    const toast = useToast();
    const systemColorScheme = useColorScheme();
    const { themeMode, setThemeMode } = useThemeStore();
    const { user } = useAuthStore();
    const { formData, setStep1Data } = useOnboardingStore();

    // Get the effective theme based on user preference
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const themeColors = Colors[currentTheme as 'light' | 'dark'];

    // Initialize from Zustand store
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
        formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
    );
    const [profileImg, setProfileImg] = useState<string>(
        formData.profileImg || user?.profileImg || ''
    );
    const [gender, setGender] = useState<any | null>(formData.gender || null);
    const [country, setCountry] = useState<string>(formData.country || '');
    const [language, setLanguage] = useState<string>(
        formData.preferences?.language || 'en'
    );
    const [theme, setTheme] = useState<string>(
        formData.preferences?.themePreference || themeMode
    );

    // Update profile image if user changes (e.g. after Google login)
    useEffect(() => {
        if (user?.profileImg && !profileImg) {
            setProfileImg(user.profileImg);
        }
    }, [user?.profileImg]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [filteredCountries, setFilteredCountries] = useState<string[]>(COUNTRIES);
    const [countrySearch, setCountrySearch] = useState<string>('');
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [datePickerReady, setDatePickerReady] = useState(false);

    useEffect(() => {
        if (countrySearch) {
            setFilteredCountries(
                COUNTRIES.filter(c =>
                    c.toLowerCase().includes(countrySearch.toLowerCase())
                )
            );
        } else {
            setFilteredCountries(COUNTRIES);
        }
    }, [countrySearch]);

    // Delay rendering date picker content only on first open
    useEffect(() => {
        if (showDatePicker && !datePickerReady) {
            const timer = setTimeout(() => {
                setDatePickerReady(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showDatePicker, datePickerReady]);

    const handleImagePick = async () => {
        setShowImageOptions(false);
        
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                toast.error('Permission Denied', 'We need camera roll permissions to select a profile image');
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
            console.error('Error picking image:', error);
            toast.error('Error', error.message || 'Failed to pick image');
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
            console.error('Error taking photo:', error);
            toast.error('Error', error.message || 'Failed to take photo');
        }
    };

    const processImage = async (uri: string) => {
        try {
            setIsImgLoading(true);

            // Resize image to 400x400
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 400, height: 400 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            if (!manipResult.base64) {
                throw new Error('Failed to convert image to base64');
            }

            const base64Image = `data:image/jpeg;base64,${manipResult.base64}`;
            setProfileImg(base64Image);
            toast.success('Success', 'Profile image selected');
        } catch (error: any) {
            console.error('Error processing image:', error);
            toast.error('Error', error.message || 'Failed to process image');
        } finally {
            setIsImgLoading(false);
        }
    };

    const [isImgLoading, setIsImgLoading] = useState(false);

    const handleDeleteImage = async () => {
        try {
            setShowImageOptions(false);
            setIsImgLoading(true);
            const result = await deleteProfileImage();
            if (result.success) {
                setProfileImg('');
                toast.success('Deleted', 'Profile image removed successfully');
            }
        } catch (error: any) {
            console.error('Delete image error:', error);
            toast.error('Error', error.message || 'Failed to delete image');
        } finally {
            setIsImgLoading(false);
        }
    };

    const handleDateChange = (type: 'day' | 'month' | 'year', value: number) => {
        const currentDate = dateOfBirth || new Date(2000, 0, 1);
        let newDate = new Date(currentDate);

        if (type === 'day') {
            newDate.setDate(value);
        } else if (type === 'month') {
            newDate.setMonth(value - 1);
            // Adjust day if it exceeds days in new month
            const daysInMonth = getDaysInMonth(value, newDate.getFullYear());
            if (newDate.getDate() > daysInMonth) {
                newDate.setDate(daysInMonth);
            }
        } else if (type === 'year') {
            newDate.setFullYear(value);
            // Adjust day if it exceeds days in month for new year (leap year)
            const daysInMonth = getDaysInMonth(newDate.getMonth() + 1, value);
            if (newDate.getDate() > daysInMonth) {
                newDate.setDate(daysInMonth);
            }
        }

        // Ensure date is not in the future
        if (newDate > new Date()) {
            newDate = new Date();
        }

        setDateOfBirth(newDate);
    };

    const getDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month, 0).getDate();
    };

    // Pre-generate all possible values once
    const allDays = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
    
    const months = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: i + 1,
            label: new Date(2000, i, 1).toLocaleString('default', { month: 'short' })
        }));
    }, []);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 1924;
        const endYear = currentYear - 13;
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
    }, []);

    // Calculate visible days based on selected month/year
    const visibleDays = useMemo(() => {
        if (!dateOfBirth) return allDays;
        const daysInMonth = getDaysInMonth(
            dateOfBirth.getMonth() + 1,
            dateOfBirth.getFullYear()
        );
        return allDays.slice(0, daysInMonth);
    }, [dateOfBirth, allDays]);

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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

        // Save data to store
        useOnboardingStore.getState().setStep1Data({
            dateOfBirth: dateOfBirth.toISOString(),
            gender: gender as 'MALE' | 'FEMALE' | 'OTHER',
            country,
            profileImg: profileImg || undefined,
            preferences: {
                language,
                themePreference: theme === 'system' ? 'light' : theme as 'light' | 'dark',
                notifications: true, // Default to true
            }
        });

        router.push('/onboarding/step2');
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: themeColors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.background} />

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

                {/* Profile Image */}
                <View style={styles.profileImageContainer}>
                    <TouchableOpacity
                        style={styles.profileImageWrapper}
                        onPress={() => !isImgLoading && setShowImageOptions(true)}
                        disabled={isImgLoading}
                    >
                        {isImgLoading ? (
                            <View style={styles.profileImagePlaceholder}>
                                <ActivityIndicator size="large" color={cskColors[500]} />
                            </View>
                        ) : profileImg ? (
                            <Image
                                source={{ uri: profileImg }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <Ionicons name="person-add" size={40} color={cskColors[500]} />
                                <Text style={styles.placeholderText}>Add Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.imageSizeLabel}>74x74 (Optional)</Text>
                </View>

                {/* Date Of Birth */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Date Of Birth</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={[styles.inputText, !dateOfBirth && styles.placeholder]}>
                            {dateOfBirth ? formatDate(dateOfBirth) : 'Select your date of birth'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                {/* Gender */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Select Gender</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowGenderPicker(true)}
                    >
                        <Text style={[styles.inputText, !gender && styles.placeholder]}>
                            {gender || 'Select Gender'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                {/* Country */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Country</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowCountryPicker(true)}
                    >
                        <Text style={[styles.inputText, !country && styles.placeholder]}>
                            {country || 'Select Country'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                {/* Language */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Language</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowLanguagePicker(true)}
                    >
                        <Text style={[styles.inputText, !language && styles.placeholder]}>
                            {language ? LANGUAGES.find(l => l.id === language)?.label : 'Select Language'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                {/* Theme */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Theme</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowThemePicker(true)}
                    >
                        <Text style={[styles.inputText, !theme && styles.placeholder]}>
                            {theme ? THEMES.find(t => t.id === theme)?.label : 'Select Theme'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={themeColors.text} />
                    </TouchableOpacity>
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

            {/* Date Picker Modal */}
            <BottomSheetModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                height={450}
            >
                <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                    <TouchableOpacity 
                        onPress={() => {
                            if (dateOfBirth) {
                                setShowDatePicker(false);
                            } else {
                                toast.warning('Select Date', 'Please select a date');
                            }
                        }}
                    >
                        <Text style={[styles.datePickerDone, !dateOfBirth && styles.datePickerDoneDisabled]}>
                            Done
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {!dateOfBirth && (
                    <View style={styles.datePickerHint}>
                        <Ionicons name="information-circle-outline" size={16} color={cskColors[500]} />
                        <Text style={styles.datePickerHintText}>Scroll to select your birth date</Text>
                    </View>
                )}

                {datePickerReady ? (
                    <>
                        <View style={styles.datePickerContainer}>
                            <FlatList
                                style={styles.datePickerColumn}
                                data={visibleDays}
                                keyExtractor={(item) => `day-${item}`}
                                showsVerticalScrollIndicator={false}
                                initialNumToRender={10}
                                maxToRenderPerBatch={10}
                                windowSize={5}
                                removeClippedSubviews={true}
                                getItemLayout={(data, index) => ({
                                    length: 44,
                                    offset: 44 * index,
                                    index,
                                })}
                                renderItem={({ item: day }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.datePickerItem,
                                            dateOfBirth?.getDate() === day && styles.datePickerItemSelected,
                                        ]}
                                        onPress={() => {
                                            if (!dateOfBirth) {
                                                const currentYear = new Date().getFullYear() - 20;
                                                setDateOfBirth(new Date(currentYear, 0, day));
                                            } else {
                                                handleDateChange('day', day);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.datePickerItemText,
                                            dateOfBirth?.getDate() === day && styles.datePickerItemTextSelected,
                                        ]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                            
                            <FlatList
                                style={styles.datePickerColumn}
                                data={months}
                                keyExtractor={(item) => `month-${item.value}`}
                                showsVerticalScrollIndicator={false}
                                initialNumToRender={12}
                                maxToRenderPerBatch={12}
                                windowSize={3}
                                removeClippedSubviews={true}
                                getItemLayout={(data, index) => ({
                                    length: 44,
                                    offset: 44 * index,
                                    index,
                                })}
                                renderItem={({ item: month }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.datePickerItem,
                                            dateOfBirth && dateOfBirth.getMonth() + 1 === month.value && styles.datePickerItemSelected,
                                        ]}
                                        onPress={() => {
                                            if (!dateOfBirth) {
                                                const currentYear = new Date().getFullYear() - 20;
                                                setDateOfBirth(new Date(currentYear, month.value - 1, 1));
                                            } else {
                                                handleDateChange('month', month.value);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.datePickerItemText,
                                            dateOfBirth && dateOfBirth.getMonth() + 1 === month.value && styles.datePickerItemTextSelected,
                                        ]}>
                                            {month.label}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                            
                            <FlatList
                                style={styles.datePickerColumn}
                                data={years}
                                keyExtractor={(item) => `year-${item}`}
                                showsVerticalScrollIndicator={false}
                                initialNumToRender={15}
                                maxToRenderPerBatch={15}
                                windowSize={5}
                                removeClippedSubviews={true}
                                getItemLayout={(data, index) => ({
                                    length: 44,
                                    offset: 44 * index,
                                    index,
                                })}
                                renderItem={({ item: year }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.datePickerItem,
                                            dateOfBirth?.getFullYear() === year && styles.datePickerItemSelected,
                                        ]}
                                        onPress={() => {
                                            if (!dateOfBirth) {
                                                setDateOfBirth(new Date(year, 0, 1));
                                            } else {
                                                handleDateChange('year', year);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.datePickerItemText,
                                            dateOfBirth?.getFullYear() === year && styles.datePickerItemTextSelected,
                                        ]}>
                                            {year}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                        
                        <View style={styles.datePickerLabels}>
                            <Text style={styles.datePickerLabel}>Day</Text>
                            <Text style={styles.datePickerLabel}>Month</Text>
                            <Text style={styles.datePickerLabel}>Year</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.datePickerLoading}>
                        <ActivityIndicator size="large" color={cskColors[500]} />
                    </View>
                )}
            </BottomSheetModal>

            {/* Gender Picker Modal */}
            <BottomSheetModal
                visible={showGenderPicker}
                onClose={() => setShowGenderPicker(false)}
                height={350}
            >
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>Select Gender</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={styles.bottomSheetOption}
                        onPress={() => {
                            setGender('MALE');
                            setShowGenderPicker(false);
                        }}
                    >
                        <Text style={styles.bottomSheetOptionText}>Male</Text>
                        {gender === 'MALE' && (
                            <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.bottomSheetOption}
                        onPress={() => {
                            setGender('FEMALE');
                            setShowGenderPicker(false);
                        }}
                    >
                        <Text style={styles.bottomSheetOptionText}>Female</Text>
                        {gender === 'FEMALE' && (
                            <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.bottomSheetOption}
                        onPress={() => {
                            setGender('OTHER');
                            setShowGenderPicker(false);
                        }}
                    >
                        <Text style={styles.bottomSheetOptionText}>Other</Text>
                        {gender === 'OTHER' && (
                            <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.bottomSheetOption}
                        onPress={() => {
                            setGender('PREFER_NOT_TO_SAY');
                            setShowGenderPicker(false);
                        }}
                    >
                        <Text style={styles.bottomSheetOptionText}>Prefer not to say</Text>
                        {gender === 'PREFER_NOT_TO_SAY' && (
                            <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </BottomSheetModal>

            {/* Country Picker Modal */}
            <BottomSheetModal
                visible={showCountryPicker}
                onClose={() => {
                    setShowCountryPicker(false);
                    setCountrySearch('');
                }}
                height={600}
            >
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>Select Country</Text>
                </View>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={Colors.light.text} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search country..."
                        value={countrySearch}
                        onChangeText={setCountrySearch}
                        placeholderTextColor={grayColors[500]}
                    />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredCountries.map((countryName) => (
                        <TouchableOpacity
                            key={countryName}
                            style={styles.bottomSheetOption}
                            onPress={() => {
                                setCountry(countryName);
                                setShowCountryPicker(false);
                                setCountrySearch('');
                            }}
                        >
                            <Text style={styles.bottomSheetOptionText}>{countryName}</Text>
                            {country === countryName && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </BottomSheetModal>

            {/* Language Picker Modal */}
            <BottomSheetModal
                visible={showLanguagePicker}
                onClose={() => setShowLanguagePicker(false)}
                height={500}
            >
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>Select Language</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {LANGUAGES.map((lang) => (
                        <TouchableOpacity
                            key={lang.id}
                            style={styles.bottomSheetOption}
                            onPress={() => {
                                setLanguage(lang.id);
                                setShowLanguagePicker(false);
                            }}
                        >
                            <Text style={styles.bottomSheetOptionText}>{lang.label}</Text>
                            {language === lang.id && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </BottomSheetModal>

            {/* Image Options Modal */}
            <BottomSheetModal
                visible={showImageOptions}
                onClose={() => setShowImageOptions(false)}
                height={profileImg ? 300 : 250}
            >
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>Profile Photo</Text>
                </View>
                
                <TouchableOpacity
                    style={styles.imageOptionButton}
                    onPress={handleTakePhoto}
                >
                    <View style={styles.imageOptionIconContainer}>
                        <Ionicons name="camera-outline" size={22} color={cskColors[500]} />
                    </View>
                    <Text style={styles.imageOptionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.imageOptionButton}
                    onPress={handleImagePick}
                >
                    <View style={styles.imageOptionIconContainer}>
                        <Ionicons name="images-outline" size={22} color={cskColors[500]} />
                    </View>
                    <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                
                {profileImg && (
                    <TouchableOpacity
                        style={styles.imageOptionButton}
                        onPress={handleDeleteImage}
                    >
                        <View style={styles.imageOptionIconContainer}>
                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                        </View>
                        <Text style={[styles.imageOptionText, styles.deleteText]}>
                            Delete Photo
                        </Text>
                    </TouchableOpacity>
                )}
            </BottomSheetModal>

            {/* Theme Picker Modal */}
            <BottomSheetModal
                visible={showThemePicker}
                onClose={() => setShowThemePicker(false)}
                height={350}
            >
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>Select Theme</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {THEMES.map((themeOption) => (
                        <TouchableOpacity
                            key={themeOption.id}
                            style={styles.bottomSheetOption}
                            onPress={() => {
                                setTheme(themeOption.id);
                                // Immediately apply theme to the app
                                setThemeMode(themeOption.id as 'light' | 'dark' | 'system');
                                setShowThemePicker(false);
                            }}
                        >
                            <View style={styles.themeOption}>
                                <Ionicons
                                    name={themeOption.icon as any}
                                    size={20}
                                    color={Colors.light.text}
                                    style={styles.themeIcon}
                                />
                                <Text style={styles.bottomSheetOptionText}>{themeOption.label}</Text>
                            </View>
                            {theme === themeOption.id && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </BottomSheetModal>
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
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileImageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: cskColors[500],
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 8,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: grayColors[50],
    },
    placeholderText: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        color: cskColors[500],
    },
    imageSizeLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginBottom: 8,
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
        maxHeight: '80%',
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
    modalCancel: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    modalDone: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: cskColors[500],
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    countryList: {
        maxHeight: 300,
    },
    datePickerContainer: {
        flexDirection: 'row',
        height: 250,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    datePickerColumn: {
        flex: 1,
        marginHorizontal: 4,
    },
    datePickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 2,
    },
    datePickerItemSelected: {
        backgroundColor: cskColors[500],
    },
    datePickerItemText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    datePickerItemTextSelected: {
        color: '#FFFFFF',
        fontFamily: Fonts.semiBold,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        marginBottom: 8,
    },
    datePickerTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: Colors.light.text,
    },
    datePickerCancel: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    datePickerDone: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: cskColors[500],
    },
    datePickerDoneDisabled: {
        opacity: 0.4,
    },
    datePickerHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: cskColors[50],
        borderRadius: 8,
        marginBottom: 12,
        gap: 6,
    },
    datePickerHintText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: cskColors[600],
    },
    datePickerLabels: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        marginTop: 8,
    },
    datePickerLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: grayColors[500],
        marginHorizontal: 4,
    },
    datePickerLoading: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeIcon: {
        marginRight: 12,
    },
    imageOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    imageOptionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: grayColors[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    imageOptionText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: Colors.light.text,
    },
    deleteText: {
        color: '#EF4444',
    },
    bottomSheetHeader: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        marginBottom: 8,
    },
    bottomSheetTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: Colors.light.text,
        textAlign: 'center',
    },
    bottomSheetOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    bottomSheetOptionText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
});
