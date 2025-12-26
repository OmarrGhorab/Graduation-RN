import { useState, useCallback, useEffect, useMemo } from 'react';
import { I18nManager, TextStyle } from 'react-native';
import * as Updates from 'expo-updates';
import i18n, { changeLanguage, getCurrentLanguage, initializeI18n, t } from '@/libs/i18n';

export function useTranslation() {
  const [locale, setLocale] = useState(getCurrentLanguage());
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    // Sync state with i18n
    setLocale(getCurrentLanguage());
    setIsRTL(I18nManager.isRTL);
  }, []);

  const setLanguage = useCallback(async (languageCode: string) => {
    const needsRestart = await changeLanguage(languageCode);
    setLocale(languageCode);
    setIsRTL(languageCode === 'ar');

    if (needsRestart) {
      // RTL change requires app restart
      // In development, user needs to manually restart
      // In production with expo-updates, we can reload
      try {
        if (!__DEV__) {
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log('Restart required for RTL change');
      }
      return true; // Indicates restart needed
    }
    return false;
  }, []);

  // Translation function that triggers re-render on locale change
  const translate = useCallback((key: string, options?: Record<string, any>) => {
    return t(key, options);
  }, [locale]);

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
    locale,
    isRTL,
    setLanguage,
    textAlign,
    writingDirection,
    inputStyle,
    i18n,
  };
}

export { initializeI18n };
