import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { InterestChip } from './InterestChip';

interface InterestsGridProps {
    interests: string[];
    selectedInterests: string[];
    onToggleInterest: (interest: string) => void;
}

export const InterestsGrid = ({ 
    interests, 
    selectedInterests, 
    onToggleInterest 
}: InterestsGridProps) => {
    const { theme } = useTheme();
    
    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.semiBold }]}>
                Select Your Interests
            </Text>
            <Text style={[styles.subtitle, { color: theme.gray[500], fontFamily: Fonts.regular }]}>
                Choose up to 5 topics you're interested in
            </Text>
            
            <View style={styles.grid}>
                {interests.map((interest) => (
                    <InterestChip
                        key={interest}
                        label={interest}
                        selected={selectedInterests.includes(interest)}
                        onPress={() => onToggleInterest(interest)}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 30,
    },
    title: {
        fontSize: 18,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
});
