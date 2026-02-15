import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimePickerModalProps {
    visible: boolean;
    onClose: () => void;
    selectedTime: Date;
    onSelectTime: (time: Date) => void;
}

export default function TimePickerModal({
    visible,
    onClose,
    selectedTime,
    onSelectTime,
}: TimePickerModalProps) {
    const { isDark } = useTheme();
    const [selectedHour, setSelectedHour] = useState(selectedTime.getHours());
    const [selectedMinute, setSelectedMinute] = useState(selectedTime.getMinutes());
    const [isPM, setIsPM] = useState(selectedTime.getHours() >= 12);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const handleConfirm = () => {
        const newTime = new Date(selectedTime);
        let hour24 = selectedHour;
        
        if (isPM && selectedHour !== 12) {
            hour24 = selectedHour + 12;
        } else if (!isPM && selectedHour === 12) {
            hour24 = 0;
        }
        
        newTime.setHours(hour24);
        newTime.setMinutes(selectedMinute);
        onSelectTime(newTime);
        onClose();
    };

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
                <View style={[styles.modalContent, {
                    backgroundColor: isDark ? '#183327' : '#ffffff',
                }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                            Select Time
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color={isDark ? '#ffffff' : '#0d1b15'} />
                        </TouchableOpacity>
                    </View>

                    {/* Time Display */}
                    <View style={[styles.timeDisplay, {
                        backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee',
                    }]}>
                        <Text style={[styles.timeText, { color: cskColors[500] }]}>
                            {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {isPM ? 'PM' : 'AM'}
                        </Text>
                    </View>

                    {/* Time Pickers */}
                    <View style={styles.pickersContainer}>
                        {/* Hour Picker */}
                        <View style={styles.pickerColumn}>
                            <Text style={[styles.pickerLabel, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Hour
                            </Text>
                            <ScrollView 
                                style={styles.picker}
                                showsVerticalScrollIndicator={false}
                            >
                                {hours.map((hour) => (
                                    <TouchableOpacity
                                        key={hour}
                                        style={[
                                            styles.pickerItem,
                                            selectedHour === hour && {
                                                backgroundColor: cskColors[500],
                                            },
                                        ]}
                                        onPress={() => setSelectedHour(hour)}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerItemText,
                                                {
                                                    color: selectedHour === hour
                                                        ? '#ffffff'
                                                        : (isDark ? '#e1e5e9' : '#0d1b15'),
                                                },
                                            ]}
                                        >
                                            {hour.toString().padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Minute Picker */}
                        <View style={styles.pickerColumn}>
                            <Text style={[styles.pickerLabel, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Minute
                            </Text>
                            <ScrollView 
                                style={styles.picker}
                                showsVerticalScrollIndicator={false}
                            >
                                {minutes.map((minute) => (
                                    <TouchableOpacity
                                        key={minute}
                                        style={[
                                            styles.pickerItem,
                                            selectedMinute === minute && {
                                                backgroundColor: cskColors[500],
                                            },
                                        ]}
                                        onPress={() => setSelectedMinute(minute)}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerItemText,
                                                {
                                                    color: selectedMinute === minute
                                                        ? '#ffffff'
                                                        : (isDark ? '#e1e5e9' : '#0d1b15'),
                                                },
                                            ]}
                                        >
                                            {minute.toString().padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* AM/PM Picker */}
                        <View style={styles.pickerColumn}>
                            <Text style={[styles.pickerLabel, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Period
                            </Text>
                            <View style={styles.picker}>
                                <TouchableOpacity
                                    style={[
                                        styles.pickerItem,
                                        !isPM && {
                                            backgroundColor: cskColors[500],
                                        },
                                    ]}
                                    onPress={() => setIsPM(false)}
                                >
                                    <Text
                                        style={[
                                            styles.pickerItemText,
                                            {
                                                color: !isPM
                                                    ? '#ffffff'
                                                    : (isDark ? '#e1e5e9' : '#0d1b15'),
                                            },
                                        ]}
                                    >
                                        AM
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.pickerItem,
                                        isPM && {
                                            backgroundColor: cskColors[500],
                                        },
                                    ]}
                                    onPress={() => setIsPM(true)}
                                >
                                    <Text
                                        style={[
                                            styles.pickerItemText,
                                            {
                                                color: isPM
                                                    ? '#ffffff'
                                                    : (isDark ? '#e1e5e9' : '#0d1b15'),
                                            },
                                        ]}
                                    >
                                        PM
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: cskColors[500] }]}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
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
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    closeButton: {
        padding: 4,
    },
    timeDisplay: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    timeText: {
        fontSize: 32,
        fontFamily: Fonts.bold,
    },
    pickersContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    pickerColumn: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 8,
        textAlign: 'center',
    },
    picker: {
        maxHeight: 200,
    },
    pickerItem: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 4,
    },
    pickerItemText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    confirmButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
});
