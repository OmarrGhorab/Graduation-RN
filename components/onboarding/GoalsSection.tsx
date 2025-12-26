import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { GoalChip } from './GoalChip';

interface GoalsSectionProps {
    goals: string[];
    selectedGoals: string[];
    customGoals: string[];
    customGoalInput: string;
    showCustomInput: boolean;
    onToggleGoal: (goal: string) => void;
    onRemoveCustomGoal: (goal: string) => void;
    onCustomGoalInputChange: (text: string) => void;
    onAddCustomGoal: () => void;
}

export const GoalsSection = ({
    goals,
    selectedGoals,
    customGoals,
    customGoalInput,
    showCustomInput,
    onToggleGoal,
    onRemoveCustomGoal,
    onCustomGoalInputChange,
    onAddCustomGoal,
}: GoalsSectionProps) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text }]}>Your Goals</Text>
            <Text style={[styles.subtitle, { color: theme.gray[500] }]}>
                What do you want to achieve? (Select up to 3)
            </Text>

            <View style={styles.goalsGrid}>
                {goals.map((goal) => (
                    <GoalChip
                        key={goal}
                        label={goal}
                        selected={selectedGoals.includes(goal)}
                        onPress={() => onToggleGoal(goal)}
                    />
                ))}
                {customGoals.map((goal, index) => (
                    <GoalChip
                        key={`custom-${index}`}
                        label={goal}
                        selected={false}
                        isCustom
                        showRemoveIcon
                        onPress={() => onRemoveCustomGoal(goal)}
                    />
                ))}
            </View>

            {/* Custom Goal Input */}
            {showCustomInput && customGoals.length < 1 && (
                <View style={styles.customInputWrapper}>
                    <View style={[styles.labelContainer, { backgroundColor: theme.background }]}>
                        <Text style={[styles.label, { color: theme.icon }]}>Custom Goal</Text>
                    </View>
                    <View style={styles.customInputRow}>
                        <TextInput
                            style={[
                                styles.customInput,
                                { 
                                    borderColor: theme.border,
                                    color: theme.text,
                                    backgroundColor: theme.background,
                                }
                            ]}
                            placeholder="Enter your custom goal..."
                            placeholderTextColor={theme.icon}
                            value={customGoalInput}
                            onChangeText={onCustomGoalInputChange}
                            onSubmitEditing={onAddCustomGoal}
                            maxLength={30}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary }]}
                            onPress={onAddCustomGoal}
                            disabled={!customGoalInput.trim()}
                        >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginBottom: 16,
    },
    goalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    customInputWrapper: {
        marginTop: 12,
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
        fontFamily: Fonts.medium,
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    customInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 50,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
