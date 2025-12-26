import { useState, useCallback, useEffect } from 'react';
import { I18nManager } from 'react-native';
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

  return {
    t: translate,
    locale,
    isRTL,
    setLanguage,
    i18n,
  };
}

export { initializeI18n };
