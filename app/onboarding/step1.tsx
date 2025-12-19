import { Alert } from 'react-native';
import { useToast } from '@/components/toast';
import { Colors, Fonts, cskColors, grayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useOnboardingStore } from '@/libs/onboarding';
import { useThemeStore } from '@/libs/theme';
import { useAuthStore } from '@/libs/auth';
import { useColorScheme } from 'react-native';
import { deleteProfileImage } from '@/services/AuthService';
import * as ImagePicker from 'expo-image-picker';
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
    { id: 'english', label: 'English' },
    { id: 'arabic', label: 'Arabic' },
    { id: 'spanish', label: 'Spanish' },
    { id: 'french', label: 'French' },
    { id: 'german', label: 'German' },
    { id: 'chinese', label: 'Chinese' },
    { id: 'japanese', label: 'Japanese' },
    { id: 'korean', label: 'Korean' },
    { id: 'portuguese', label: 'Portuguese' },
    { id: 'russian', label: 'Russian' },
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

    // Get the effective theme based on user preference
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const themeColors = Colors[currentTheme as 'light' | 'dark'];

    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
    const [profileImg, setProfileImg] = useState<string>(user?.profileImg || '');
    const [gender, setGender] = useState<any | null>(null);
    const [country, setCountry] = useState<string>('');
    const [language, setLanguage] = useState<string>('english');
    const [theme, setTheme] = useState<string>(themeMode);

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

    const handleImagePick = async () => {
        setShowImageOptions(false);
        try {
            if (Platform.OS === 'web') {
                Alert.alert('Not Available', 'Image picker is not available on web');
                return;
            }

            let ImagePicker;
            try {
                ImagePicker = require('expo-image-picker');
            } catch (e) {
                console.error('Failed to require expo-image-picker', e);
                Alert.alert('Configuration Error', 'Image Picker module not found. Please rebuild your app.');
                return;
            }

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera roll permissions to select a profile image');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                if (asset.base64) {
                    const base64Image = `data:image/jpeg;base64,${asset.base64}`;
                    setProfileImg(base64Image);
                } else {
                    setProfileImg(asset.uri);
                }
            }
        } catch (error: any) {
            console.error('Error picking image:', error);
            if (error.message && error.message.includes('ExponentImagePicker')) {
                Alert.alert('Development Build Update Required', 'The Image Picker native module is missing. Please stop the server and run "npx expo run:android" to rebuild your app.');
            } else {
                Alert.alert('Error', error.message || 'Failed to pick image');
            }
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

    const generateDays = (): number[] => {
        const currentDate = dateOfBirth || new Date();
        const daysInMonth = getDaysInMonth(
            currentDate.getMonth() + 1,
            currentDate.getFullYear()
        );
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    };

    const generateMonths = (): number[] => {
        return Array.from({ length: 12 }, (_, i) => i + 1);
    };

    const generateYears = (): number[] => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 100;
        return Array.from({ length: 101 }, (_, i) => startYear + i).reverse();
    };

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
                        onPress={() => {
                            if (!dateOfBirth) {
                                setDateOfBirth(new Date(2000, 0, 1));
                            }
                            setShowDatePicker(true);
                        }}
                    >
                        <Text style={[styles.inputText, !dateOfBirth && styles.placeholder]}>
                            {dateOfBirth ? formatDate(dateOfBirth) : 'dd/mm/yyyy'}
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
            <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={styles.modalCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Select Date</Text>
                            <TouchableOpacity onPress={() => {
                                if (dateOfBirth) {
                                    setShowDatePicker(false);
                                }
                            }}>
                                <Text style={styles.modalDone}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerContainer}>
                            <ScrollView style={styles.datePickerColumn}>
                                {generateDays().map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            styles.datePickerItem,
                                            dateOfBirth?.getDate() === day && styles.datePickerItemSelected,
                                        ]}
                                        onPress={() => handleDateChange('day', day)}
                                    >
                                        <Text style={[
                                            styles.datePickerItemText,
                                            dateOfBirth?.getDate() === day && styles.datePickerItemTextSelected,
                                        ]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView style={styles.datePickerColumn}>
                                {generateMonths().map((month) => (
                                    <TouchableOpacity
                                        key={month}
                                        style={[
                                            styles.datePickerItem,
                                            dateOfBirth && dateOfBirth.getMonth() + 1 === month && styles.datePickerItemSelected,
                                        ]}
                                        onPress={() => handleDateChange('month', month)}
                                    >
                                        <Text style={[
                                            styles.datePickerItemText,
                                            dateOfBirth && dateOfBirth.getMonth() + 1 === month && styles.datePickerItemTextSelected,
                                        ]}>
                                            {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' })}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <ScrollView style={styles.datePickerColumn}>
                                {generateYears().map((year) => (
                                    <TouchableOpacity
                                        key={year}
                                        style={[
                                            styles.datePickerItem,
                                            dateOfBirth?.getFullYear() === year && styles.datePickerItemSelected,
                                        ]}
                                        onPress={() => handleDateChange('year', year)}
                                    >
                                        <Text style={[
                                            styles.datePickerItemText,
                                            dateOfBirth?.getFullYear() === year && styles.datePickerItemTextSelected,
                                        ]}>
                                            {year}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Gender Picker Modal */}
            <Modal
                visible={showGenderPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowGenderPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Gender</Text>
                            <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setGender('MALE');
                                setShowGenderPicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>Male</Text>
                            {gender === 'MALE' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setGender('FEMALE');
                                setShowGenderPicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>Female</Text>
                            {gender === 'FEMALE' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setGender('OTHER');
                                setShowGenderPicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>Other</Text>
                            {gender === 'OTHER' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setGender('PREFER_NOT_TO_SAY');
                                setShowGenderPicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>Prefer not to say</Text>
                            {gender === 'PREFER_NOT_TO_SAY' && (
                                <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Country Picker Modal */}
            <Modal
                visible={showCountryPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
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
                        <ScrollView style={styles.countryList}>
                            {filteredCountries.map((countryName) => (
                                <TouchableOpacity
                                    key={countryName}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        setCountry(countryName);
                                        setShowCountryPicker(false);
                                        setCountrySearch('');
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>{countryName}</Text>
                                    {country === countryName && (
                                        <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Language Picker Modal */}
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
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                        {LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.id}
                                style={styles.modalOption}
                                onPress={() => {
                                    setLanguage(lang.id);
                                    setShowLanguagePicker(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{lang.label}</Text>
                                {language === lang.id && (
                                    <Ionicons name="checkmark" size={20} color={cskColors[500]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Image Options Modal */}
            <Modal
                visible={showImageOptions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageOptions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowImageOptions(false)}
                >
                    <View style={styles.imageOptionsContainer}>
                        <View style={styles.imageOptionsContent}>
                            <TouchableOpacity
                                style={styles.imageOptionButton}
                                onPress={handleImagePick}
                            >
                                <Ionicons name="camera" size={24} color={cskColors[500]} />
                                <Text style={styles.imageOptionText}>
                                    {profileImg ? 'Change Photo' : 'Upload Photo'}
                                </Text>
                            </TouchableOpacity>
                            {profileImg && (
                                <TouchableOpacity
                                    style={[styles.imageOptionButton, styles.deleteButton]}
                                    onPress={handleDeleteImage}
                                >
                                    <Ionicons name="trash" size={24} color="#FF4444" />
                                    <Text style={[styles.imageOptionText, styles.deleteText]}>Delete Photo</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.imageOptionButton, styles.cancelButton]}
                                onPress={() => setShowImageOptions(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Theme Picker Modal */}
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
                                <Ionicons name="close" size={24} color={themeColors.text} />
                            </TouchableOpacity>
                        </View>
                        {THEMES.map((themeOption) => (
                            <TouchableOpacity
                                key={themeOption.id}
                                style={styles.modalOption}
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
                                    <Text style={styles.modalOptionText}>{themeOption.label}</Text>
                                </View>
                                {theme === themeOption.id && (
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
        marginHorizontal: 20,
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
        paddingHorizontal: 20,
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
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeIcon: {
        marginRight: 12,
    },
    imageOptionsContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    imageOptionsContent: {
        backgroundColor: Colors.light.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    imageOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    imageOptionText: {
        marginLeft: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: Colors.light.text,
    },
    deleteButton: {
        borderBottomWidth: 0,
    },
    deleteText: {
        color: '#FF4444',
    },
    cancelButton: {
        borderTopWidth: 8,
        borderTopColor: '#F5F5F5',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: grayColors[500],
        textAlign: 'center',
        width: '100%',
    },
});
