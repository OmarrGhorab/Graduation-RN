import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';
import { InterestChip } from './InterestChip';
import { translateInterest } from '@/libs/i18n/options';

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
    const { t } = useTranslation();
    
    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text, fontFamily: Fonts.semiBold }]}>
                {t('onboarding.selectYourInterests')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.gray[500], fontFamily: Fonts.regular }]}>
                {t('onboarding.chooseUpTo5')}
            </Text>
            
            <View style={styles.grid}>
                {interests.map((interest) => (
                    <InterestChip
                        key={interest}
                        label={translateInterest(interest, t)}
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
