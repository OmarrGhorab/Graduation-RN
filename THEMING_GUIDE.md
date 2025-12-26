# Theming Guide

## Using the Theme System

### ✅ Simple Pattern - Use Everywhere

Instead of manually checking color scheme in every component:

```typescript
// ❌ OLD WAY - Don't do this
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';
const theme = isDark ? Colors.dark : Colors.light;
```

**Use the centralized `useTheme` hook:**

```typescript
// ✅ NEW WAY - Do this
import { useTheme } from '@/hooks/useTheme';

const { theme, isDark } = useTheme();
```

### How It Works

The `useTheme` hook automatically handles:

1. **System Preference** - Respects device dark/light mode
2. **User Preference** - When logged in, uses user's saved theme preference from backend
3. **Automatic Sync** - User preferences are synced via `usePreferences` hook

### Theme Properties

```typescript
const { theme, isDark, themeMode } = useTheme();

// theme object contains:
theme.background        // Main background color
theme.surface          // Card/elevated surface color
theme.surfaceVariant   // Alternative surface (modals, sheets)
theme.text             // Primary text color
theme.textSecondary    // Secondary text color
theme.textTertiary     // Tertiary text color
theme.primary          // Primary brand color (green)
theme.primaryContainer // Light primary background
theme.onPrimary        // Text on primary color
theme.icon             // Icon color
theme.border           // Border color
theme.divider          // Divider color

// Color palettes
theme.csk              // Green palette (50-950)
theme.warning          // Orange palette (50-950)
theme.gray             // Gray palette (50-950)
theme.error            // Red palette (50-950)
```

### Font Usage

Always use Rubik fonts from the theme:

```typescript
import { Fonts } from '@/constants/theme';

// Available fonts:
Fonts.light       // 300 weight
Fonts.regular     // 400 weight
Fonts.medium      // 500 weight
Fonts.semiBold    // 600 weight
Fonts.bold        // 700 weight
Fonts.extraBold   // 800 weight
Fonts.black       // 900 weight
```

### Example Component

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';

export default function MyComponent() {
    const { theme, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Text style={[styles.title, { color: theme.text }]}>
                Hello World
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                This adapts to theme automatically
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
});
```

### User Preference Flow

1. **Before Login**: Uses system preference (device dark/light mode)
2. **After Login**: Automatically switches to user's saved preference from backend
3. **User Changes Theme**: Updates both locally and on backend via `useUpdatePreference`

### Changing Theme

```typescript
import { useThemeStore } from '@/libs/theme';
import { useUpdatePreference } from '@/hooks/usePreferences';

const setThemeMode = useThemeStore((state) => state.setThemeMode);
const updatePreference = useUpdatePreference();

// Change theme
const changeTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    updatePreference.mutate({ themePreference: mode });
};
```

## Benefits

✅ **Single source of truth** - One hook for all theme logic  
✅ **Automatic sync** - User preferences from backend are applied automatically  
✅ **Type-safe** - Full TypeScript support  
✅ **Consistent** - Same pattern across all components  
✅ **Performant** - Uses Zustand for efficient state management  
✅ **Persistent** - Theme preference saved to AsyncStorage  

## Migration Checklist

When updating old components:

- [ ] Replace `useColorScheme()` with `useTheme()`
- [ ] Replace `Colors.light/Colors.dark` with `theme`
- [ ] Replace `fontFamily: 'System'` with `Fonts.bold/regular/etc`
- [ ] Remove `fontWeight` properties (use font families instead)
- [ ] Use `theme.primary` instead of hardcoded `cskColors[500]`
- [ ] Use `theme.background` instead of hardcoded colors
