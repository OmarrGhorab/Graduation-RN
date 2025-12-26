import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeStore } from '@/libs/theme';

interface SelectInputProps {
    label: string;
    value: string;
    placeholder: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const SelectInput = ({ 
    label, 
    value, 
    placeholder, 
    onPress,
    icon = 'chevron-down'
}: SelectInputProps) => {
    const systemColorScheme = useColorScheme();
    const { themeMode } = useThemeStore();
    
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';

    return (
        <View style={styles.container}>
            <View style={[styles.labelContainer, { backgroundColor: isDark ? theme.background : '#FFFFFF' }]}>
                <Text style={[styles.label, { 
                    color: isDark ? theme.icon : '#696F77',
                    fontFamily: Fonts?.medium 
                }]}>
                    {label}
                </Text>
            </View>
            <TouchableOpacity
                style={[styles.input, { 
                    borderColor: isDark ? theme.border : '#E5E5E5',
                    backgroundColor: isDark ? theme.background : '#FFFFFF'
                }]}
                onPress={onPress}
            >
                <Text style={[
                    styles.inputText, 
                    { 
                        color: value 
                            ? (isDark ? theme.text : '#11181C') 
                            : (isDark ? theme.icon : '#696F77'),
                        fontFamily: Fonts?.regular 
                    }
                ]}>
                    {value || placeholder}
                </Text>
                <Ionicons name={icon} size={20} color={isDark ? theme.icon : '#696F77'} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        position: 'relative',
        paddingTop: 8,
    },
    labelContainer: {
        position: 'absolute',
        top: 0,
        left: 12,
        zIndex: 1,
        paddingHorizontal: 4,
    },
    label: {
        fontSize: 12,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
    },
    inputText: {
        fontSize: 16,
        flex: 1,
    },
});
