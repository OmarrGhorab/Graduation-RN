import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface GeofenceSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    minValue?: number;
    maxValue?: number;
    step?: number;
}

export default function GeofenceSlider({
    value,
    onValueChange,
    minValue = 10,
    maxValue = 200,
    step = 10,
}: GeofenceSliderProps) {
    const { isDark } = useTheme();

    return (
        <View style={styles.container}>
            {/* Value Display Badge */}
            <View style={[styles.valueBadge, {
                backgroundColor: cskColors[500],
            }]}>
                <Text style={styles.valueText}>{value}m</Text>
            </View>

            {/* Slider */}
            <View style={styles.sliderContainer}>
                <Slider
                    style={styles.slider}
                    minimumValue={minValue}
                    maximumValue={maxValue}
                    step={step}
                    value={value}
                    onValueChange={onValueChange}
                    minimumTrackTintColor={cskColors[500]}
                    maximumTrackTintColor={isDark ? '#3a4048' : '#d1d5d9'}
                    thumbTintColor={cskColors[500]}
                />
            </View>

            {/* Min/Max Labels */}
            <View style={styles.labelsContainer}>
                <Text style={[styles.labelText, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                    {minValue}m
                </Text>
                <Text style={[styles.labelText, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                    {maxValue}m
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    valueBadge: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    valueText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    sliderContainer: {
        paddingHorizontal: 4,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    labelsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        marginTop: 4,
    },
    labelText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
});
