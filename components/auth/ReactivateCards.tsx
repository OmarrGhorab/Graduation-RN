import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

interface ReactivateCardsProps {
    isDark?: boolean;
    fadeAnim: Animated.Value;
    cardSlideAnim: Animated.Value;
}

export const ReactivateCards: React.FC<ReactivateCardsProps> = ({
    isDark = false,
    fadeAnim,
    cardSlideAnim,
}) => {
    const { t } = useTranslation();
    
    // Dark mode colors
    const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
    const titleColor = isDark ? '#E1E5E9' : '#1F2937';
    const descColor = isDark ? '#A8B0B8' : '#6B7280';
    const iconBg1 = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5';
    const iconBg2 = isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF';
    
    return (
        <Animated.View
            style={[
                styles.cardsContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: cardSlideAnim }],
                },
            ]}
        >
            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
                <View style={[styles.cardIconWrapper, { backgroundColor: iconBg1 }]}>
                    <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                </View>
                <View style={styles.cardTextWrapper}>
                    <Text style={[styles.cardTitle, { color: titleColor }]}>{t('auth.dataPreserved')}</Text>
                    <Text style={[styles.cardDescription, { color: descColor }]}>{t('auth.dataPreservedDesc')}</Text>
                </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
                <View style={[styles.cardIconWrapper, { backgroundColor: iconBg2 }]}>
                    <Ionicons name="sync" size={22} color="#6366F1" />
                </View>
                <View style={styles.cardTextWrapper}>
                    <Text style={[styles.cardTitle, { color: titleColor }]}>{t('auth.instantAccess')}</Text>
                    <Text style={[styles.cardDescription, { color: descColor }]}>{t('auth.instantAccessDesc')}</Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardsContainer: {
        gap: 12,
        marginBottom: 32,
    },
    infoCard: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    cardIconWrapper: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardTextWrapper: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: Fonts?.bold,
        marginBottom: 3,
    },
    cardDescription: {
        fontSize: 13,
        fontFamily: Fonts?.regular,
    },
});
