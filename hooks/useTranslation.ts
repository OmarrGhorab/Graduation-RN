import { useCallback, useMemo } from 'react';
import { TextStyle } from 'react-native';
import * as Updates from 'expo-updates';
import { t } from '@/libs/i18n';
import { useLanguageStore } from '@/libs/language';
import { logger } from '@/libs/logger';

export function useTranslation() {
  // Use global language store - all components share this state
  const { locale, preference, isRTL, setLocale } = useLanguageStore();

  const setLanguage = useCallback(async (languageCode: string) => {
    const needsRestart = await setLocale(languageCode);

    if (needsRestart) {
      // RTL change requires app restart
      // In development, user needs to manually restart
      // In production with expo-updates, we can reload
      try {
        if (!__DEV__) {
          await Updates.reloadAsync();
        }
      } catch (e) {
        logger.log('Restart required for RTL change');
      }
      return true; // Indicates restart needed
    }
    return false;
  }, [setLocale]);

  // Translation function that triggers re-render on locale change
  const translate = useCallback((key: string, options?: Record<string, any>) => {
    return t(key, options);
  }, [locale]); // Re-create when locale changes

  // Text alignment for inputs
  const textAlign = useMemo((): 'left' | 'right' => {
    return locale === 'ar' ? 'right' : 'left';
  }, [locale]);

  // Writing direction
  const writingDirection = useMemo((): 'ltr' | 'rtl' => {
    return locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  // Input style helper - use this for TextInput style prop
  const inputStyle = useMemo((): TextStyle => ({
    textAlign: locale === 'ar' ? 'right' : 'left',
    writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
  }), [locale]);

  return {
    t: translate,
    locale,           // The actual locale being used ('en' or 'ar')
    preference,       // The user's preference ('system', 'en', or 'ar')
    isRTL,
    setLanguage,
    textAlign,
    writingDirection,
    inputStyle,
  };
}

// Initialize language on app start
export const initializeLanguage = async () => {
  await useLanguageStore.getState().initialize();
};
