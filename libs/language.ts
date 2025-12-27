import { create } from 'zustand';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from './i18n';

const LANGUAGE_KEY = '@app_language';

// Get device language, default to 'en' if not Arabic
const getDeviceLanguage = (): 'en' | 'ar' => {
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    // Only support Arabic and English, default to English for others
    return deviceLocale === 'ar' ? 'ar' : 'en';
};

// Resolve 'system' to actual language
const resolveLanguage = (preference: string): 'en' | 'ar' => {
    if (preference === 'system') {
        return getDeviceLanguage();
    }
    return preference === 'ar' ? 'ar' : 'en';
};

interface LanguageState {
    locale: string;          // The actual locale being used ('en' or 'ar')
    preference: string;      // The user's preference ('system', 'en', or 'ar')
    isRTL: boolean;
    isInitialized: boolean;
    setLocale: (preference: string) => Promise<boolean>;
    initialize: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    locale: 'en',
    preference: 'system',
    isRTL: false,
    isInitialized: false,

    initialize: async () => {
        try {
            const savedPreference = await AsyncStorage.getItem(LANGUAGE_KEY);
            const preference = savedPreference || 'system';
            const locale = resolveLanguage(preference);
            
            i18n.locale = locale;
            
            // Handle RTL for Arabic
            const isRTL = locale === 'ar';
            if (I18nManager.isRTL !== isRTL) {
                I18nManager.allowRTL(isRTL);
                I18nManager.forceRTL(isRTL);
            }
            
            set({
                locale,
                preference,
                isRTL,
                isInitialized: true,
            });
        } catch (error) {
            console.error('Error initializing language:', error);
            set({ locale: 'en', preference: 'system', isRTL: false, isInitialized: true });
        }
    },

    setLocale: async (newPreference: string) => {
        try {
            const newLocale = resolveLanguage(newPreference);
            
            // Update i18n
            i18n.locale = newLocale;
            
            // Save preference to storage
            await AsyncStorage.setItem(LANGUAGE_KEY, newPreference);

            // Check if RTL change is needed
            const isRTL = newLocale === 'ar';
            const needsRTLChange = I18nManager.isRTL !== isRTL;

            if (needsRTLChange) {
                I18nManager.allowRTL(isRTL);
                I18nManager.forceRTL(isRTL);
            }

            // Update store - this triggers re-renders in all subscribed components
            set({ locale: newLocale, preference: newPreference, isRTL });

            return needsRTLChange; // Returns true if app restart is needed
        } catch (error) {
            console.error('Error setting language:', error);
            return false;
        }
    },
}));
