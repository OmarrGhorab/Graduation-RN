import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeStore } from '@/libs/theme';
import BottomSheetModal from '@/components/BottomSheetModal';

const COUNTRIES = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Portugal',
    'Greece', 'Ireland', 'Czech Republic', 'Romania', 'Hungary', 'Egypt',
    'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Jordan', 'Lebanon',
    'Morocco', 'Tunisia', 'Algeria', 'South Africa', 'Nigeria', 'Kenya',
    'India', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia',
    'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'Brazil', 'Mexico',
    'Argentina', 'Chile', 'Colombia', 'Peru', 'Turkey', 'Russia',
];

interface CountryPickerSheetProps {
    visible: boolean;
    onClose: () => void;
    selectedCountry: string;
    onSelect: (country: string) => void;
}

export const CountryPickerSheet = ({
    visible,
    onClose,
    selectedCountry,
    onSelect,
}: CountryPickerSheetProps) => {
    const systemColorScheme = useColorScheme();
    const { themeMode } = useThemeStore();
    
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';
    
    const [search, setSearch] = useState('');
    const [filteredCountries, setFilteredCountries] = useState(COUNTRIES);

    useEffect(() => {
        if (search) {
            setFilteredCountries(
                COUNTRIES.filter(c =>
                    c.toLowerCase().includes(search.toLowerCase())
                )
            );
        } else {
            setFilteredCountries(COUNTRIES);
        }
    }, [search]);

    const handleClose = () => {
        setSearch('');
        onClose();
    };

    return (
        <BottomSheetModal visible={visible} onClose={handleClose} height={600}>
            <View style={[styles.header, { borderBottomColor: isDark ? theme.border : '#E5E5E5' }]}>
                <Text style={[styles.title, { 
                    color: isDark ? theme.text : '#11181C',
                    fontFamily: Fonts?.semiBold 
                }]}>
                    Select Country
                </Text>
            </View>
            <View style={[styles.searchContainer, { borderColor: isDark ? theme.border : '#E5E5E5' }]}>
                <Ionicons name="search" size={20} color={isDark ? theme.gray[500] : '#696F77'} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { 
                        color: isDark ? theme.text : '#11181C',
                        fontFamily: Fonts?.regular 
                    }]}
                    placeholder="Search country..."
                    placeholderTextColor={isDark ? theme.gray[500] : '#696F77'}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {filteredCountries.map((country) => (
                    <TouchableOpacity
                        key={country}
                        style={[styles.option, { borderBottomColor: isDark ? theme.border : '#F5F5F5' }]}
                        onPress={() => {
                            onSelect(country);
                            handleClose();
                        }}
                    >
                        <Text style={[styles.optionText, { 
                            color: isDark ? theme.text : '#11181C',
                            fontFamily: Fonts?.regular 
                        }]}>
                            {country}
                        </Text>
                        {selectedCountry === country && (
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
    },
    optionText: {
        fontSize: 16,
    },
});
