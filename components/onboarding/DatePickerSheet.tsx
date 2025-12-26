import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeStore } from '@/libs/theme';
import { useTranslation } from '@/hooks/useTranslation';
import BottomSheetModal from '@/components/BottomSheetModal';

// Convert Western numerals to Arabic-Indic numerals
const toArabicNumerals = (num: number | string): string => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
};

interface DatePickerSheetProps {
    visible: boolean;
    onClose: () => void;
    dateOfBirth: Date | null;
    onDateChange: (type: 'day' | 'month' | 'year', value: number) => void;
    onDone: () => void;
    isReady: boolean;
}

const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month, 0).getDate();
};

export const DatePickerSheet = ({
    visible,
    onClose,
    dateOfBirth,
    onDateChange,
    onDone,
    isReady,
}: DatePickerSheetProps) => {
    const systemColorScheme = useColorScheme();
    const { themeMode } = useThemeStore();
    const { t, locale } = useTranslation();
    const isArabic = locale === 'ar';
    
    // Format number based on locale
    const formatNumber = (num: number | string): string => {
        return isArabic ? toArabicNumerals(num) : String(num);
    };
    
    const currentTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode;
    const theme = Colors[currentTheme as 'light' | 'dark'];
    const isDark = currentTheme === 'dark';

    const allDays = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
    
    const months = useMemo(() => {
        // Use translation keys for month names
        const monthKeys = [
            'months.jan', 'months.feb', 'months.mar', 'months.apr',
            'months.may', 'months.jun', 'months.jul', 'months.aug',
            'months.sep', 'months.oct', 'months.nov', 'months.dec'
        ];
        return Array.from({ length: 12 }, (_, i) => ({
            value: i + 1,
            label: t(monthKeys[i])
        }));
    }, [t]);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = 1924;
        const endYear = currentYear - 13;
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
    }, []);

    const visibleDays = useMemo(() => {
        if (!dateOfBirth) return allDays;
        const daysInMonth = getDaysInMonth(
            dateOfBirth.getMonth() + 1,
            dateOfBirth.getFullYear()
        );
        return allDays.slice(0, daysInMonth);
    }, [dateOfBirth, allDays]);

    const handleDaySelect = (day: number) => {
        if (!dateOfBirth) {
            const currentYear = new Date().getFullYear() - 20;
            onDateChange('day', day);
        } else {
            onDateChange('day', day);
        }
    };

    const handleMonthSelect = (month: number) => {
        if (!dateOfBirth) {
            const currentYear = new Date().getFullYear() - 20;
            onDateChange('month', month);
        } else {
            onDateChange('month', month);
        }
    };

    const handleYearSelect = (year: number) => {
        onDateChange('year', year);
    };

    return (
        <BottomSheetModal visible={visible} onClose={onClose} height={450}>
            <View style={[styles.header, { borderBottomColor: isDark ? theme.border : '#E5E5E5' }]}>
                <TouchableOpacity onPress={onClose}>
                    <Text style={[styles.cancelText, { 
                        color: isDark ? theme.gray[500] : '#696F77',
                        fontFamily: Fonts?.regular 
                    }]}>
                        {t('common.cancel')}
                    </Text>
                </TouchableOpacity>
                <Text style={[styles.title, { 
                    color: isDark ? theme.text : '#11181C',
                    fontFamily: Fonts?.semiBold 
                }]}>
                    {t('onboarding.selectDateOfBirthTitle')}
                </Text>
                <TouchableOpacity onPress={onDone}>
                    <Text style={[
                        styles.doneText, 
                        { 
                            color: theme.primary,
                            fontFamily: Fonts?.semiBold,
                            opacity: dateOfBirth ? 1 : 0.4 
                        }
                    ]}>
                        {t('common.done')}
                    </Text>
                </TouchableOpacity>
            </View>
            
            {!dateOfBirth && (
                <View style={[styles.hint, { backgroundColor: isDark ? theme.csk[50] : '#F0FBF6' }]}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                    <Text style={[styles.hintText, { 
                        color: isDark ? theme.csk[600] : '#07673A',
                        fontFamily: Fonts?.regular 
                    }]}>
                        {t('onboarding.scrollToSelect')}
                    </Text>
                </View>
            )}

            {isReady ? (
                <>
                    <View style={styles.pickerContainer}>
                        <FlatList
                            style={styles.column}
                            data={visibleDays}
                            keyExtractor={(item) => `day-${item}`}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={10}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            removeClippedSubviews={true}
                            getItemLayout={(_, index) => ({
                                length: 44,
                                offset: 44 * index,
                                index,
                            })}
                            renderItem={({ item: day }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        dateOfBirth?.getDate() === day && { backgroundColor: theme.primary },
                                    ]}
                                    onPress={() => handleDaySelect(day)}
                                >
                                    <Text style={[
                                        styles.itemText,
                                        { 
                                            color: isDark ? theme.text : '#11181C',
                                            fontFamily: Fonts?.regular 
                                        },
                                        dateOfBirth?.getDate() === day && { 
                                            color: '#FFFFFF',
                                            fontFamily: Fonts?.semiBold 
                                        },
                                    ]}>
                                        {formatNumber(day)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                        
                        <FlatList
                            style={styles.column}
                            data={months}
                            keyExtractor={(item) => `month-${item.value}`}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={12}
                            maxToRenderPerBatch={12}
                            windowSize={3}
                            removeClippedSubviews={true}
                            getItemLayout={(_, index) => ({
                                length: 44,
                                offset: 44 * index,
                                index,
                            })}
                            renderItem={({ item: month }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        dateOfBirth && dateOfBirth.getMonth() + 1 === month.value && 
                                            { backgroundColor: theme.primary },
                                    ]}
                                    onPress={() => handleMonthSelect(month.value)}
                                >
                                    <Text style={[
                                        styles.itemText,
                                        { 
                                            color: isDark ? theme.text : '#11181C',
                                            fontFamily: Fonts?.regular 
                                        },
                                        dateOfBirth && dateOfBirth.getMonth() + 1 === month.value && { 
                                            color: '#FFFFFF',
                                            fontFamily: Fonts?.semiBold 
                                        },
                                    ]}>
                                        {month.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                        
                        <FlatList
                            style={styles.column}
                            data={years}
                            keyExtractor={(item) => `year-${item}`}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={15}
                            maxToRenderPerBatch={15}
                            windowSize={5}
                            removeClippedSubviews={true}
                            getItemLayout={(_, index) => ({
                                length: 44,
                                offset: 44 * index,
                                index,
                            })}
                            renderItem={({ item: year }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        dateOfBirth?.getFullYear() === year && { backgroundColor: theme.primary },
                                    ]}
                                    onPress={() => handleYearSelect(year)}
                                >
                                    <Text style={[
                                        styles.itemText,
                                        { 
                                            color: isDark ? theme.text : '#11181C',
                                            fontFamily: Fonts?.regular 
                                        },
                                        dateOfBirth?.getFullYear() === year && { 
                                            color: '#FFFFFF',
                                            fontFamily: Fonts?.semiBold 
                                        },
                                    ]}>
                                        {formatNumber(year)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                    
                    <View style={[styles.labels, { borderTopColor: isDark ? theme.border : '#E5E5E5' }]}>
                        <Text style={[styles.label, { 
                            color: isDark ? theme.gray[500] : '#696F77',
                            fontFamily: Fonts?.medium 
                        }]}>{t('onboarding.day')}</Text>
                        <Text style={[styles.label, { 
                            color: isDark ? theme.gray[500] : '#696F77',
                            fontFamily: Fonts?.medium 
                        }]}>{t('onboarding.month')}</Text>
                        <Text style={[styles.label, { 
                            color: isDark ? theme.gray[500] : '#696F77',
                            fontFamily: Fonts?.medium 
                        }]}>{t('onboarding.year')}</Text>
                    </View>
                </>
            ) : (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            )}
        </BottomSheetModal>
    );
};


const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
    },
    cancelText: {
        fontSize: 16,
    },
    doneText: {
        fontSize: 16,
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
        gap: 6,
    },
    hintText: {
        fontSize: 13,
    },
    pickerContainer: {
        flexDirection: 'row',
        height: 250,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    column: {
        flex: 1,
        marginHorizontal: 4,
    },
    item: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 2,
    },
    itemText: {
        fontSize: 16,
    },
    labels: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        marginTop: 8,
    },
    label: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        marginHorizontal: 4,
    },
    loading: {
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
