import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeStore } from '@/libs/theme';
import BottomSheetModal from '@/components/BottomSheetModal';

interface Option {
    id: string;
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

interface OptionPickerSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: Option[];
    selectedValue: string;
    onSelect: (value: string) => void;
    height?: number;
}

export const OptionPickerSheet = ({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
    height = 350,
}: OptionPickerSheetProps) => {
    const systemColorScheme = useColorScheme();
    const { themeMode } = useThemeStore();
    
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';

    return (
        <BottomSheetModal visible={visible} onClose={onClose} height={height}>
            <View style={[styles.header, { borderBottomColor: isDark ? theme.border : '#E5E5E5' }]}>
                <Text style={[styles.title, { 
                    color: isDark ? theme.text : '#11181C',
                    fontFamily: Fonts?.semiBold 
                }]}>
                    {title}
                </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[styles.option, { borderBottomColor: isDark ? theme.border : '#F5F5F5' }]}
                        onPress={() => {
                            onSelect(option.id);
                            onClose();
                        }}
                    >
                        <View style={styles.optionContent}>
                            {option.icon && (
                                <Ionicons
                                    name={option.icon}
                                    size={20}
                                    color={isDark ? theme.text : '#11181C'}
                                    style={styles.optionIcon}
                                />
                            )}
                            <Text style={[styles.optionText, { 
                                color: isDark ? theme.text : '#11181C',
                                fontFamily: Fonts?.regular 
                            }]}>
                                {option.label}
                            </Text>
                        </View>
                        {selectedValue === option.id && (
                            <Ionicons name="checkmark" size={20} color={theme.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
    },
});
