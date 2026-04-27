import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './translations/en';
import ar from './translations/ar';

const LANGUAGE_KEY = '@app_language';

// Create i18n instance
const i18n = new I18n({
  en,
  ar,
});

// Set default locale from device
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Initialize with device locale or saved preference
export const initializeI18n = async (): Promise<string> => {
  try {
    // Check for saved language preference
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    } else {
      // Use device locale, fallback to 'en'
      const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
      i18n.locale = ['en', 'ar'].includes(deviceLocale) ? deviceLocale : 'en';
    }

    // Handle RTL for Arabic
    const isRTL = i18n.locale === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }

    return i18n.locale;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    i18n.locale = 'en';
    return 'en';
  }
};

// Change language
export const changeLanguage = async (languageCode: string): Promise<boolean> => {
  try {
    i18n.locale = languageCode;
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);

    // Handle RTL
    const isRTL = languageCode === 'ar';
    const needsRTLChange = I18nManager.isRTL !== isRTL;

    if (needsRTLChange) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      return true; // Indicates app needs restart for RTL change
    }

    return false; // No restart needed
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.locale;
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  return i18n.locale === 'ar';
};

// Translation function
export const t = (key: string, options?: Record<string, any>): string => {
  const translation = i18n.t(key, options);
  if (translation.includes('[missing') && !__DEV__) {
      console.warn(`[i18n] Missing translation for: ${key} in ${i18n.locale}`);
  }
  return translation;
};

// Get text alignment based on locale (for TextInput)
export const getTextAlign = (): 'left' | 'right' => {
  return i18n.locale === 'ar' ? 'right' : 'left';
};

// Get writing direction
export const getWritingDirection = (): 'ltr' | 'rtl' => {
  return i18n.locale === 'ar' ? 'rtl' : 'ltr';
};

export default i18n;
