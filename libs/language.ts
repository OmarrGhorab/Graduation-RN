import { create } from 'zustand';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from './i18n';

const LANGUAGE_KEY = '@app_language';

// Get device language, default to 'en' if not Arabic
const getDeviceLanguage = (): string => {
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    // Only support Arabic and English, default to English for others
    return deviceLocale === 'ar' ? 'ar' : 'en';
};

interface LanguageState {
    locale: string;
    isRTL: boolean;
    isInitialized: boolean;
    setLocale: (locale: string) => Promise<boolean>;
    initialize: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
    locale: 'en',
    isRTL: false,
    isInitialized: false,

    initialize: async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            // Use saved language if exists, otherwise detect from device
            const locale = savedLanguage || getDeviceLanguage();
            
            i18n.locale = locale;
            
            // Handle RTL for Arabic
            const isRTL = locale === 'ar';
            if (I18nManager.isRTL !== isRTL) {
                I18nManager.allowRTL(isRTL);
                I18nManager.forceRTL(isRTL);
            }
            
            set({
                locale,
                isRTL,
                isInitialized: true,
            });
        } catch (error) {
            console.error('Error initializing language:', error);
            set({ locale: 'en', isRTL: false, isInitialized: true });
        }
    },

    setLocale: async (newLocale: string) => {
        try {
            // Update i18n
            i18n.locale = newLocale;
            
            // Save to storage
            await AsyncStorage.setItem(LANGUAGE_KEY, newLocale);

            // Check if RTL change is needed
            const isRTL = newLocale === 'ar';
            const needsRTLChange = I18nManager.isRTL !== isRTL;

            if (needsRTLChange) {
                I18nManager.allowRTL(isRTL);
                I18nManager.forceRTL(isRTL);
            }

            // Update store - this triggers re-renders in all subscribed components
            set({ locale: newLocale, isRTL });

            return needsRTLChange; // Returns true if app restart is needed
        } catch (error) {
            console.error('Error setting language:', error);
            return false;
        }
    },
}));
