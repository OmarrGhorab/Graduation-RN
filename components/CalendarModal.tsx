import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    mode: 'start' | 'end';
    minDate?: Date;
    maxDate?: Date;
}

export default function CalendarModal({
    visible,
    onClose,
    selectedDate,
    onSelectDate,
    mode,
    minDate,
    maxDate,
}: CalendarModalProps) {
    const { theme, isDark } = useTheme();
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];
        
        // Add empty slots for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const isDateDisabled = (date: Date | null) => {
        if (!date) return true;
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
    };

    const isDateSelected = (date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === new Date().toDateString();
    };

    const handleDateSelect = (date: Date | null) => {
        if (!date || isDateDisabled(date)) return;
        onSelectDate(date);
        onClose();
    };

    const days = getDaysInMonth(currentMonth);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity 
                    style={styles.modalBackdrop} 
                    activeOpacity={1} 
                    onPress={onClose}
                />
                
                <View style={[styles.modalContent, { backgroundColor: isDark ? theme.surface : '#ffffff' }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.headerTitle, { color: isDark ? theme.text : theme.gray[900] }]}>
                                Select {mode === 'start' ? 'Start' : 'End'} Date
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: theme.gray[500] }]}>
                                {selectedDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.gray[500]} />
                        </TouchableOpacity>
                    </View>

                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color={theme.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.monthText, { color: isDark ? theme.text : theme.gray[900] }]}>
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color={theme.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Day Names */}
                    <View style={styles.dayNamesRow}>
                        {dayNames.map((day) => (
                            <View key={day} style={styles.dayNameCell}>
                                <Text style={[styles.dayNameText, { color: theme.gray[500] }]}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
                        <View style={styles.calendarGrid}>
                            {days.map((date, index) => {
                                const disabled = isDateDisabled(date);
                                const selected = isDateSelected(date);
                                const today = isToday(date);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dayCell,
                                            selected && { backgroundColor: theme.primary },
                                            today && !selected && { 
                                                borderWidth: 2, 
                                                borderColor: theme.primary 
                                            },
                                        ]}
                                        onPress={() => handleDateSelect(date)}
                                        disabled={disabled}
                                    >
                                        {date && (
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    { color: isDark ? theme.text : theme.gray[900] },
                                                    selected && { color: '#000000', fontFamily: Fonts.bold },
                                                    disabled && { color: theme.gray[300] },
                                                    today && !selected && { color: theme.primary, fontFamily: Fonts.bold },
                                                ]}
                                            >
                                                {date.getDate()}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            onPress={() => handleDateSelect(new Date())}
                            style={[styles.quickButton, { backgroundColor: `${theme.primary}15` }]}
                        >
                            <Ionicons name="today-outline" size={18} color={theme.primary} />
                            <Text style={[styles.quickButtonText, { color: theme.primary }]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.quickButton, { backgroundColor: isDark ? theme.background : theme.gray[100] }]}
                        >
                            <Text style={[styles.quickButtonText, { color: theme.gray[600] }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    closeButton: {
        padding: 4,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    navButton: {
        padding: 8,
    },
    monthText: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    dayNamesRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dayNameCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    dayNameText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        textTransform: 'uppercase',
    },
    calendarScroll: {
        maxHeight: 320,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        marginBottom: 4,
    },
    dayText: {
        fontSize: 15,
        fontFamily: Fonts.medium,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    quickButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
    },
    quickButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
});
