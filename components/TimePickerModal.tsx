import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimePickerModalProps {
    visible: boolean;
    onClose: () => void;
    selectedTime: Date;
    onSelectTime: (time: Date) => void;
}

const ITEM_HEIGHT = 48;

export default function TimePickerModal({
    visible,
    onClose,
    selectedTime,
    onSelectTime,
}: TimePickerModalProps) {
    const { isDark } = useTheme();

    const get12Hour = (date: Date) => {
        const h = date.getHours();
        if (h === 0) return 12;
        if (h > 12) return h - 12;
        return h;
    };

    const [selectedHour, setSelectedHour] = useState(() => get12Hour(selectedTime));
    const [selectedMinute, setSelectedMinute] = useState(selectedTime.getMinutes());
    const [isPM, setIsPM] = useState(selectedTime.getHours() >= 12);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const hourScrollRef = useRef<ScrollView>(null);
    const minuteScrollRef = useRef<ScrollView>(null);

    // Sync state when modal becomes visible or selectedTime changes
    useEffect(() => {
        if (visible) {
            const h = selectedTime.getHours();
            const hour12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
            setSelectedHour(hour12);
            setSelectedMinute(selectedTime.getMinutes());
            setIsPM(h >= 12);
        }
    }, [visible, selectedTime]);

    // Initial scroll to current selection
    useEffect(() => {
        if (visible) {
            const h = selectedTime.getHours();
            const hour12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
            const m = selectedTime.getMinutes();

            const hourIndex = hours.indexOf(hour12);
            const minuteIndex = minutes.indexOf(m);

            setTimeout(() => {
                if (hourScrollRef.current && hourIndex !== -1) {
                    hourScrollRef.current.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
                }
                if (minuteScrollRef.current && minuteIndex !== -1) {
                    minuteScrollRef.current.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
                }
            }, 100);
        }
    }, [visible]);

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
                            <View style={[styles.pickerWrapper, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', borderColor: isDark ? '#2a4d3d' : '#e9ebed' }]}>
                                <View style={[styles.selectionIndicator, { borderColor: cskColors[500] }]} pointerEvents="none" />
                                <ScrollView 
                                    ref={hourScrollRef}
                                    style={styles.picker}
                                    snapToInterval={ITEM_HEIGHT}
                                    decelerationRate="fast"
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{
                                        paddingVertical: ITEM_HEIGHT * 2
                                    }}
                                    onMomentumScrollEnd={(e) => {
                                        const y = e.nativeEvent.contentOffset.y;
                                        const index = Math.round(y / ITEM_HEIGHT);
                                        const hour = hours[index];
                                        if (hour !== undefined) {
                                            setSelectedHour(hour);
                                        }
                                    }}
                                >
                                    {hours.map((hour) => {
                                        const isSelected = selectedHour === hour;
                                        return (
                                            <TouchableOpacity
                                                key={hour}
                                                style={styles.pickerItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    setSelectedHour(hour);
                                                    const idx = hours.indexOf(hour);
                                                    hourScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.pickerItemText,
                                                        {
                                                            color: isSelected
                                                                ? cskColors[500]
                                                                : (isDark ? '#e1e5e9' : '#0d1b15'),
                                                            opacity: isSelected ? 1 : 0.4,
                                                            fontFamily: isSelected ? Fonts.bold : Fonts.medium,
                                                            fontSize: isSelected ? 18 : 15,
                                                        },
                                                    ]}
                                                >
                                                    {hour.toString().padStart(2, '0')}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>

                        {/* Minute Picker */}
                        <View style={styles.pickerColumn}>
                            <Text style={[styles.pickerLabel, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Minute
                            </Text>
                            <View style={[styles.pickerWrapper, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', borderColor: isDark ? '#2a4d3d' : '#e9ebed' }]}>
                                <View style={[styles.selectionIndicator, { borderColor: cskColors[500] }]} pointerEvents="none" />
                                <ScrollView 
                                    ref={minuteScrollRef}
                                    style={styles.picker}
                                    snapToInterval={ITEM_HEIGHT}
                                    decelerationRate="fast"
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{
                                        paddingVertical: ITEM_HEIGHT * 2
                                    }}
                                    onMomentumScrollEnd={(e) => {
                                        const y = e.nativeEvent.contentOffset.y;
                                        const index = Math.round(y / ITEM_HEIGHT);
                                        const minute = minutes[index];
                                        if (minute !== undefined) {
                                            setSelectedMinute(minute);
                                        }
                                    }}
                                >
                                    {minutes.map((minute) => {
                                        const isSelected = selectedMinute === minute;
                                        return (
                                            <TouchableOpacity
                                                key={minute}
                                                style={styles.pickerItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    setSelectedMinute(minute);
                                                    const idx = minutes.indexOf(minute);
                                                    minuteScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.pickerItemText,
                                                        {
                                                            color: isSelected
                                                                ? cskColors[500]
                                                                : (isDark ? '#e1e5e9' : '#0d1b15'),
                                                            opacity: isSelected ? 1 : 0.4,
                                                            fontFamily: isSelected ? Fonts.bold : Fonts.medium,
                                                            fontSize: isSelected ? 18 : 15,
                                                        },
                                                    ]}
                                                >
                                                    {minute.toString().padStart(2, '0')}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>

                        {/* AM/PM Segmented Control */}
                        <View style={styles.periodColumn}>
                            <Text style={[styles.pickerLabel, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Period
                            </Text>
                            <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', borderColor: isDark ? '#2a4d3d' : '#e9ebed', borderWidth: 1 }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.segmentButton,
                                        !isPM && { backgroundColor: cskColors[500] }
                                    ]}
                                    onPress={() => setIsPM(false)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        {
                                            color: !isPM ? '#ffffff' : (isDark ? '#e1e5e9' : '#0d1b15'),
                                            fontFamily: !isPM ? Fonts.bold : Fonts.medium
                                        }
                                    ]}>
                                        AM
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.segmentButton,
                                        isPM && { backgroundColor: cskColors[500] }
                                    ]}
                                    onPress={() => setIsPM(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        {
                                            color: isPM ? '#ffffff' : (isDark ? '#e1e5e9' : '#0d1b15'),
                                            fontFamily: isPM ? Fonts.bold : Fonts.medium
                                        }
                                    ]}>
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
        width: '92%',
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
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    timeText: {
        fontSize: 32,
        fontFamily: Fonts.bold,
    },
    pickersContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    pickerColumn: {
        flex: 1,
    },
    periodColumn: {
        flex: 1.1,
    },
    pickerLabel: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        marginBottom: 8,
        textAlign: 'center',
    },
    pickerWrapper: {
        height: ITEM_HEIGHT * 5, // 240
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    selectionIndicator: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2, // 96
        left: 0,
        right: 0,
        height: ITEM_HEIGHT, // 48
        borderTopWidth: 1.5,
        borderBottomWidth: 1.5,
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
    },
    picker: {
        height: '100%',
    },
    pickerItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerItemText: {
        textAlign: 'center',
    },
    segmentedControl: {
        height: ITEM_HEIGHT * 5, // 240
        borderRadius: 16,
        padding: 6,
        justifyContent: 'space-between',
        gap: 6,
    },
    segmentButton: {
        flex: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    segmentText: {
        fontSize: 16,
    },
    confirmButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
});
