/**
 * Theme Configuration
 * 
 * This file contains the theme system including:
 * - Static color palettes (warning, CSK, gray, error)
 * - Primary gradient configuration
 * - Dark mode variants
 * - Rubik font family configuration with all weights
 */

import { Platform } from 'react-native';

// ============================================================================
// Color Palettes
// ============================================================================

// CSK (Green) - Primary Color
export const cskColors = {
  50: '#F0FBF6',
  100: '#D4F4E5',
  200: '#A8E7CA',
  300: '#7AD6AA',
  400: '#4FBF8A',
  500: '#097D46',
  600: '#07673A',
  700: '#05512F',
  800: '#043C23',
  900: '#032618',
  950: '#01140D',
};

// Warning (Orange)
export const warningColors = {
  50: '#FFFBF5',
  100: '#FFF3E0',
  200: '#FFE0B2',
  300: '#FFCC80',
  400: '#FFB74D',
  500: '#FFB547',
  600: '#FF9800',
  700: '#F57C00',
  800: '#E65100',
  900: '#BF360C',
  950: '#7F2B00',
};

// Gray
export const grayColors = {
  50: '#F7F8F9',
  100: '#E9EBED',
  200: '#D1D5D9',
  300: '#B3B9BF',
  400: '#949DA5',
  500: '#696F77',
  600: '#545A62',
  700: '#434851',
  800: '#363A41',
  900: '#2D3138',
  950: '#1A1D20',
};

// Error (Red)
export const errorColors = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#DF0909',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
  950: '#450A0A',
};

// Dark mode variants
export const cskDarkColors = {
  50: '#01140D',
  100: '#032618',
  200: '#043C23',
  300: '#05512F',
  400: '#07673A',
  500: '#097D46',
  600: '#0A8F51',
  700: '#4FBF8A',
  800: '#7AD6AA',
  900: '#A8E7CA',
  950: '#D4F4E5',
};

export const warningDarkColors = {
  50: '#2D1B00',
  100: '#402200',
  200: '#5C2D00',
  300: '#7A3A00',
  400: '#9A4A00',
  500: '#FFB547',
  600: '#FFB74D',
  700: '#FFCC80',
  800: '#FFE0B2',
  900: '#FFF3E0',
  950: '#FFFBF5',
};

export const grayDarkColors = {
  50: '#1A1D20',
  100: '#2D3138',
  200: '#363A41',
  300: '#434851',
  400: '#545A62',
  500: '#696F77',
  600: '#949DA5',
  700: '#B3B9BF',
  800: '#D1D5D9',
  900: '#E9EBED',
  950: '#F7F8F9',
};

export const errorDarkColors = {
  50: '#450A0A',
  100: '#7F1D1D',
  200: '#991B1B',
  300: '#B91C1C',
  400: '#DC2626',
  500: '#DF0909',
  600: '#F87171',
  700: '#FCA5A5',
  800: '#FECACA',
  900: '#FEE2E2',
  950: '#FEF2F2',
};

// ============================================================================
// Primary Gradient
// ============================================================================

export const primaryGradient = {
  colors: ['#0A8F51', '#097D46', '#075F36'],
  locations: [0.3908, 0.6689, 0.9122],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// ============================================================================
// Colors Export
// ============================================================================

export const Colors = {
  light: {
    // Text and background colors
    text: '#11181C',
    background: '#FFFFFF',
    
    // Primary color (CSK Green)
    primary: '#097D46',
    
    // Icon colors
    icon: '#696F77',
    tabIconDefault: '#696F77',
    tabIconSelected: '#097D46',

    // Color palettes
    warning: warningColors,
    csk: cskColors,
    gray: grayColors,
    error: errorColors,
  },

  dark: {
    // Text and background colors
    text: '#ECEDEE',
    background: '#121212', // Softer dark gray instead of pure black
    
    // Primary color (CSK Green - lighter for dark mode)
    primary: '#0A8F51',
    
    // Icon colors
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#0A8F51',

    // Color palettes
    warning: warningDarkColors,
    csk: cskDarkColors,
    gray: grayDarkColors,
    error: errorDarkColors,
  },
};

// ============================================================================
// Font Configuration
// ============================================================================

/**
 * Rubik font family configuration with all weights
 * Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold), 900 (Black)
 */
export const Fonts = Platform.select({
  ios: {
    light: 'Rubik-Light',        // 300
    regular: 'Rubik-Regular',    // 400
    medium: 'Rubik-Medium',      // 500
    semiBold: 'Rubik-SemiBold',  // 600
    bold: 'Rubik-Bold',          // 700
    extraBold: 'Rubik-ExtraBold', // 800
    black: 'Rubik-Black',        // 900
  },
  android: {
    light: 'Rubik-Light',        // 300
    regular: 'Rubik-Regular',    // 400
    medium: 'Rubik-Medium',      // 500
    semiBold: 'Rubik-SemiBold',  // 600
    bold: 'Rubik-Bold',          // 700
    extraBold: 'Rubik-ExtraBold', // 800
    black: 'Rubik-Black',        // 900
  },
  web: {
    light: "'Rubik', sans-serif",        // 300
    regular: "'Rubik', sans-serif",      // 400
    medium: "'Rubik', sans-serif",       // 500
    semiBold: "'Rubik', sans-serif",     // 600
    bold: "'Rubik', sans-serif",         // 700
    extraBold: "'Rubik', sans-serif",    // 800
    black: "'Rubik', sans-serif",        // 900
  },
  default: {
    light: 'Rubik-Light',        // 300
    regular: 'Rubik-Regular',    // 400
    medium: 'Rubik-Medium',      // 500
    semiBold: 'Rubik-SemiBold',  // 600
    bold: 'Rubik-Bold',          // 700
    extraBold: 'Rubik-ExtraBold', // 800
    black: 'Rubik-Black',        // 900
  },
});

/**
 * Font weights mapping for use with fontWeight style property
 */
export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};
