import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    getEffectiveTheme: (systemTheme: ColorSchemeName) => 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themeMode: 'system',

            setThemeMode: (mode: ThemeMode) => {
                set({ themeMode: mode });
            },

            getEffectiveTheme: (systemTheme: ColorSchemeName) => {
                const { themeMode } = get();

                if (themeMode === 'system') {
                    return systemTheme === 'dark' ? 'dark' : 'light';
                }

                return themeMode;
            },
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
