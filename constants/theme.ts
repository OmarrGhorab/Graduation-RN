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

// Dark mode variants - Optimized for OLED and dark mode viewing
export const cskDarkColors = {
  50: '#0D1F17',      // Darkest - for backgrounds
  100: '#153328',     // Very dark
  200: '#1E4739',     // Dark
  300: '#2A5F4D',     // Medium dark
  400: '#3A7A64',     // Medium
  500: '#4FBF8A',     // Primary - brighter for visibility
  600: '#6DD4A3',     // Light
  700: '#8FDFBA',     // Lighter
  800: '#B3E9D1',     // Very light
  900: '#D4F4E5',     // Lightest - for text
  950: '#E8FAF2',     // Ultra light - for emphasis
};

export const warningDarkColors = {
  50: '#2D1F0D',      // Darkest
  100: '#3D2A11',     // Very dark
  200: '#5C3F1A',     // Dark
  300: '#7A5424',     // Medium dark
  400: '#9A6B2F',     // Medium
  500: '#FFB547',     // Primary - warm and visible
  600: '#FFC670',     // Light
  700: '#FFD699',     // Lighter
  800: '#FFE5BF',     // Very light
  900: '#FFF3E0',     // Lightest
  950: '#FFF9F0',     // Ultra light
};

export const grayDarkColors = {
  50: '#1A1D20',      // Darkest - card backgrounds
  100: '#23272D',     // Very dark - elevated surfaces
  200: '#2D3239',     // Dark - borders
  300: '#3A4048',     // Medium dark - disabled states
  400: '#4A5159',     // Medium - secondary text
  500: '#6B737C',     // Primary gray - icons
  600: '#8B939C',     // Light - tertiary text
  700: '#A8B0B8',     // Lighter - placeholder text
  800: '#C5CBD2',     // Very light - dividers
  900: '#E1E5E9',     // Lightest - primary text
  950: '#F0F2F4',     // Ultra light - emphasis
};

export const errorDarkColors = {
  50: '#2D0F0F',      // Darkest
  100: '#3D1515',     // Very dark
  200: '#5C1F1F',     // Dark
  300: '#7A2A2A',     // Medium dark
  400: '#9A3838',     // Medium
  500: '#EF4444',     // Primary - bright red for visibility
  600: '#F87171',     // Light
  700: '#FCA5A5',     // Lighter
  800: '#FECACA',     // Very light
  900: '#FEE2E2',     // Lightest
  950: '#FEF2F2',     // Ultra light
};

// ============================================================================
// Primary Gradient
// ============================================================================

// Light mode gradient
export const primaryGradient = {
  colors: ['#0A8F51', '#097D46', '#075F36'],
  locations: [0.3908, 0.6689, 0.9122],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// Dark mode gradient - subtle and sophisticated
export const primaryGradientDark = {
  colors: ['#2A5F4D', '#1E4739', '#153328'],
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
    surface: '#F7F8F9',           // Card/elevated surfaces
    surfaceVariant: '#E9EBED',    // Alternative surface
    
    // Primary color (CSK Green)
    primary: '#097D46',
    primaryContainer: '#D4F4E5',  // Light primary background
    onPrimary: '#FFFFFF',         // Text on primary
    
    // Icon colors
    icon: '#696F77',
    tabIconDefault: '#696F77',
    tabIconSelected: '#097D46',
    
    // Borders and dividers
    border: '#D1D5D9',
    divider: '#E9EBED',

    // Color palettes
    warning: warningColors,
    csk: cskColors,
    gray: grayColors,
    error: errorColors,
  },

  dark: {
    // Text and background colors
    text: '#E1E5E9',              // Primary text - softer white
    textSecondary: '#A8B0B8',     // Secondary text
    textTertiary: '#6B737C',      // Tertiary text
    background: '#121212',        // Main background - Material Design dark
    surface: '#1E1E1E',           // Card/elevated surfaces
    surfaceVariant: '#2A2A2A',    // Alternative surface (modals, sheets)
    
    // Primary color (CSK Green - brighter for dark mode)
    primary: '#4FBF8A',           // Brighter green for visibility
    primaryContainer: '#1E4739',  // Dark green background
    onPrimary: '#0D1F17',         // Text on primary
    
    // Icon colors
    icon: '#8B939C',
    tabIconDefault: '#8B939C',
    tabIconSelected: '#4FBF8A',
    
    // Borders and dividers
    border: '#3A4048',            // Subtle borders
    divider: '#2D3239',           // Dividers

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
