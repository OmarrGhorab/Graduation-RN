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
import { useTranslation } from '@/hooks/useTranslation';
import BottomSheetModal from '@/components/BottomSheetModal';

// Country keys (English) for API, with translation keys
const COUNTRIES_DATA = [
    { key: 'United States', translationKey: 'countries.unitedStates' },
    { key: 'United Kingdom', translationKey: 'countries.unitedKingdom' },
    { key: 'Canada', translationKey: 'countries.canada' },
    { key: 'Australia', translationKey: 'countries.australia' },
    { key: 'Germany', translationKey: 'countries.germany' },
    { key: 'France', translationKey: 'countries.france' },
    { key: 'Italy', translationKey: 'countries.italy' },
    { key: 'Spain', translationKey: 'countries.spain' },
    { key: 'Netherlands', translationKey: 'countries.netherlands' },
    { key: 'Belgium', translationKey: 'countries.belgium' },
    { key: 'Switzerland', translationKey: 'countries.switzerland' },
    { key: 'Austria', translationKey: 'countries.austria' },
    { key: 'Sweden', translationKey: 'countries.sweden' },
    { key: 'Norway', translationKey: 'countries.norway' },
    { key: 'Denmark', translationKey: 'countries.denmark' },
    { key: 'Finland', translationKey: 'countries.finland' },
    { key: 'Poland', translationKey: 'countries.poland' },
    { key: 'Portugal', translationKey: 'countries.portugal' },
    { key: 'Greece', translationKey: 'countries.greece' },
    { key: 'Ireland', translationKey: 'countries.ireland' },
    { key: 'Czech Republic', translationKey: 'countries.czechRepublic' },
    { key: 'Romania', translationKey: 'countries.romania' },
    { key: 'Hungary', translationKey: 'countries.hungary' },
    { key: 'Egypt', translationKey: 'countries.egypt' },
    { key: 'Saudi Arabia', translationKey: 'countries.saudiArabia' },
    { key: 'UAE', translationKey: 'countries.uae' },
    { key: 'Kuwait', translationKey: 'countries.kuwait' },
    { key: 'Qatar', translationKey: 'countries.qatar' },
    { key: 'Jordan', translationKey: 'countries.jordan' },
    { key: 'Lebanon', translationKey: 'countries.lebanon' },
    { key: 'Morocco', translationKey: 'countries.morocco' },
    { key: 'Tunisia', translationKey: 'countries.tunisia' },
    { key: 'Algeria', translationKey: 'countries.algeria' },
    { key: 'South Africa', translationKey: 'countries.southAfrica' },
    { key: 'Nigeria', translationKey: 'countries.nigeria' },
    { key: 'Kenya', translationKey: 'countries.kenya' },
    { key: 'India', translationKey: 'countries.india' },
    { key: 'China', translationKey: 'countries.china' },
    { key: 'Japan', translationKey: 'countries.japan' },
    { key: 'South Korea', translationKey: 'countries.southKorea' },
    { key: 'Singapore', translationKey: 'countries.singapore' },
    { key: 'Malaysia', translationKey: 'countries.malaysia' },
    { key: 'Thailand', translationKey: 'countries.thailand' },
    { key: 'Indonesia', translationKey: 'countries.indonesia' },
    { key: 'Philippines', translationKey: 'countries.philippines' },
    { key: 'Vietnam', translationKey: 'countries.vietnam' },
    { key: 'Brazil', translationKey: 'countries.brazil' },
    { key: 'Mexico', translationKey: 'countries.mexico' },
    { key: 'Argentina', translationKey: 'countries.argentina' },
    { key: 'Chile', translationKey: 'countries.chile' },
    { key: 'Colombia', translationKey: 'countries.colombia' },
    { key: 'Peru', translationKey: 'countries.peru' },
    { key: 'Turkey', translationKey: 'countries.turkey' },
    { key: 'Russia', translationKey: 'countries.russia' },
];

interface CountryPickerSheetProps {
    visible: boolean;
    onClose: () => void;
    selectedCountry: string; // This is the English key
    onSelect: (country: string) => void; // Returns English key
}

export const CountryPickerSheet = ({
    visible,
    onClose,
    selectedCountry,
    onSelect,
}: CountryPickerSheetProps) => {
    const systemColorScheme = useColorScheme();
    const { themeMode } = useThemeStore();
    const { t, textAlign, locale } = useTranslation();
    
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';
    
    const [search, setSearch] = useState('');
    const [filteredCountries, setFilteredCountries] = useState(COUNTRIES_DATA);

    // Get translated country name
    const getCountryLabel = (country: typeof COUNTRIES_DATA[0]) => {
        return t(country.translationKey);
    };

    useEffect(() => {
        if (search) {
            setFilteredCountries(
                COUNTRIES_DATA.filter(c => {
                    const translatedName = getCountryLabel(c).toLowerCase();
                    const englishName = c.key.toLowerCase();
                    const searchLower = search.toLowerCase();
                    return translatedName.includes(searchLower) || englishName.includes(searchLower);
                })
            );
        } else {
            setFilteredCountries(COUNTRIES_DATA);
        }
    }, [search, locale]);

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
                    {t('onboarding.selectCountry')}
                </Text>
            </View>
            <View style={[styles.searchContainer, { borderColor: isDark ? theme.border : '#E5E5E5' }]}>
                <Ionicons name="search" size={20} color={isDark ? theme.gray[500] : '#696F77'} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { 
                        color: isDark ? theme.text : '#11181C',
                        fontFamily: Fonts?.regular,
                        textAlign,
                    }]}
                    placeholder={t('onboarding.searchCountryPlaceholder')}
                    placeholderTextColor={isDark ? theme.gray[500] : '#696F77'}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {filteredCountries.map((country) => (
                    <TouchableOpacity
                        key={country.key}
                        style={[styles.option, { borderBottomColor: isDark ? theme.border : '#F5F5F5' }]}
                        onPress={() => {
                            onSelect(country.key); // Send English key to API
                            handleClose();
                        }}
                    >
                        <Text style={[styles.optionText, { 
                            color: isDark ? theme.text : '#11181C',
                            fontFamily: Fonts?.regular 
                        }]}>
                            {getCountryLabel(country)}
                        </Text>
                        {selectedCountry === country.key && (
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
