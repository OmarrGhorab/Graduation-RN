import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

interface ReactivateCardsProps {
    fadeAnim: Animated.Value;
    cardSlideAnim: Animated.Value;
}

export const ReactivateCards: React.FC<ReactivateCardsProps> = ({
    fadeAnim,
    cardSlideAnim,
}) => {
    const { t } = useTranslation();
    
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
            <View style={styles.infoCard}>
                <View style={[styles.cardIconWrapper, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                </View>
                <View style={styles.cardTextWrapper}>
                    <Text style={styles.cardTitle}>{t('auth.dataPreserved')}</Text>
                    <Text style={styles.cardDescription}>{t('auth.dataPreservedDesc')}</Text>
                </View>
            </View>

            <View style={styles.infoCard}>
                <View style={[styles.cardIconWrapper, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="sync" size={22} color="#6366F1" />
                </View>
                <View style={styles.cardTextWrapper}>
                    <Text style={styles.cardTitle}>{t('auth.instantAccess')}</Text>
                    <Text style={styles.cardDescription}>{t('auth.instantAccessDesc')}</Text>
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
        backgroundColor: '#FFFFFF',
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
        color: '#1F2937',
        marginBottom: 3,
    },
    cardDescription: {
        fontSize: 13,
        fontFamily: Fonts?.regular,
        color: '#6B7280',
    },
});
